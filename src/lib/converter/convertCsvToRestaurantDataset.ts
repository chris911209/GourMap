import { parse } from "csv/browser/esm/sync";
import { z } from "zod";
import { CLOSED_TIER } from "../tier";
import { createArcGisGeocoder } from "./geocoding";
import type { ConvertCsvOptions, CsvRow, Restaurant, RestaurantDataset } from "./types";

const DEFAULT_SCHEMA_PATH = "./restaurants.schema.json";
const GEOCODING_ATTRIBUTION =
    'Powered by <a href="https://developers.arcgis.com/documentation/mapping-and-location-services/geocoding/" target="_blank" rel="noopener noreferrer">Esri</a>';

const csvRowSchema = z.record(z.string(), z.string());

export async function convertCsvToRestaurantDataset(
    csvText: string,
    {
        schemaPath = DEFAULT_SCHEMA_PATH,
        geocodeDelayMs = 1100,
        geocoder = createArcGisGeocoder(),
        onProgress,
    }: ConvertCsvOptions = {},
): Promise<RestaurantDataset> {
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
        throw new Error("CSV is empty.");
    }

    onProgress?.({
        type: "start",
        totalRows: rows.length,
    });

    const items: Restaurant[] = [];
    let usedGeocoding = false;

    for (const [index, row] of rows.entries()) {
        const name = optionalField(row, "店名") ?? "";

        onProgress?.({
            type: "row",
            rowIndex: index,
            name,
            completedRows: index + 1,
            totalRows: rows.length,
        });

        const needsLookup = rowNeedsLookup(row);

        try {
            const restaurant = await buildRestaurant(row, geocoder);

            usedGeocoding ||= needsLookup;
            items.push(restaurant);
        } catch (error) {
            throw createRowError(index, row, error);
        }

        if (needsLookup && index < rows.length - 1 && geocodeDelayMs > 0) {
            await delay(geocodeDelayMs);
        }
    }

    const dataset = buildDataset(items, schemaPath, usedGeocoding);

    onProgress?.({
        type: "complete",
        itemCount: items.length,
        usedGeocoding,
    });

    return dataset;
}

function parseCsv(text: string): CsvRow[] {
    const rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    return z.array(csvRowSchema).parse(rows);
}

async function buildRestaurant(row: CsvRow, geocoder: NonNullable<ConvertCsvOptions["geocoder"]>): Promise<Restaurant> {
    const name = requireField(row, "店名");
    const tier = parseTier(requireField(row, "評級"));
    const priceBucket = parseInteger(requireField(row, "價位"), "價位");
    const notes = optionalField(row, "筆記");
    const tags = parseTags(optionalField(row, "標籤"));
    const coordinateText = optionalField(row, "經緯度");
    const addressText = optionalField(row, "地址");
    const coordinates = coordinateText ? parseCoordinates(coordinateText) : undefined;

    if (!coordinates && !addressText) {
        throw new Error('Each row must include at least one of "經緯度" or "地址".');
    }

    if (coordinates && addressText) {
        return {
            name,
            lat: coordinates[0],
            lng: coordinates[1],
            tier,
            priceBucket,
            address: addressText,
            ...(notes ? { notes } : {}),
            ...(tags.length > 0 ? { tags } : {}),
        };
    }

    if (coordinates) {
        const geocode = await geocoder.reverseGeocode(coordinates[0], coordinates[1]);

        return {
            name,
            lat: coordinates[0],
            lng: coordinates[1],
            tier,
            priceBucket,
            address: geocode.address,
            ...(geocode.plusCode ? { plusCode: geocode.plusCode } : {}),
            ...(notes ? { notes } : {}),
            ...(tags.length > 0 ? { tags } : {}),
        };
    }

    const geocode = await geocoder.forwardGeocode(name, addressText!);

    return {
        name,
        lat: geocode.lat,
        lng: geocode.lng,
        tier,
        priceBucket,
        address: addressText,
        ...(geocode.plusCode ? { plusCode: geocode.plusCode } : {}),
        ...(notes ? { notes } : {}),
        ...(tags.length > 0 ? { tags } : {}),
    };
}

function buildDataset(items: Restaurant[], schemaPath: string, usedGeocoding: boolean): RestaurantDataset {
    return {
        $schema: schemaPath,
        ...(usedGeocoding
            ? {
                  attribution: {
                      geocoding: GEOCODING_ATTRIBUTION,
                  },
              }
            : {}),
        view: {
            bounds: computeBounds(items),
        },
        items,
    };
}

function rowNeedsLookup(row: CsvRow): boolean {
    const hasCoordinates = Boolean(optionalField(row, "經緯度"));
    const hasAddress = Boolean(optionalField(row, "地址"));

    return hasCoordinates !== hasAddress;
}

function requireField(row: CsvRow, field: string): string {
    const value = row[field]?.trim();

    if (!value) {
        throw new Error(`Missing required field "${field}".`);
    }

    return value;
}

function optionalField(row: CsvRow, field: string): string | undefined {
    const value = row[field]?.trim();
    return value ? value : undefined;
}

function parseCoordinates(value: string): [number, number] {
    const [latText, lngText] = value.split(",").map((part) => part.trim());
    const lat = Number(latText);
    const lng = Number(lngText);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(`Invalid coordinates: ${value}`);
    }

    return [lat, lng];
}

function parseTier(value: string): number {
    if (/^EX\b/i.test(value.trim())) {
        return CLOSED_TIER;
    }

    const match = value.match(/[Tt]\s*(\d+)/);

    if (!match) {
        throw new Error(`Unable to parse tier from "${value}".`);
    }

    return parseInteger(match[1], "評級");
}

function parseInteger(value: string, field: string): number {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isInteger(parsed)) {
        throw new Error(`Unable to parse integer for "${field}" from "${value}".`);
    }

    return parsed;
}

function parseTags(value?: string): string[] {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
}

function computeBounds(items: Restaurant[]): [[number, number], [number, number]] {
    const lats = items.map((item) => item.lat);
    const lngs = items.map((item) => item.lng);

    return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
    ];
}

function delay(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createRowError(rowIndex: number, row: CsvRow, error: unknown): Error {
    const rowName = optionalField(row, "店名");
    const lineNumber = rowIndex + 2;
    const message = error instanceof Error ? error.message : String(error);

    return new Error(`CSV line ${lineNumber}${rowName ? ` (${rowName})` : ""}: ${message}`);
}
