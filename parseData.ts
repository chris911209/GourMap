import { reverseGeocode as esriReverseGeocode, geocode } from "@esri/arcgis-rest-geocoding";
import cliProgress from "cli-progress";
import { parse } from "csv/sync";
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs as parseNodeArgs } from "node:util";
import { z } from "zod";

type CsvRow = Record<string, string>;

type Restaurant = {
    name: string;
    lat: number;
    lng: number;
    district: string;
    tier: number;
    priceBucket: number;
    address?: string;
    notes?: string;
    plusCode?: string;
    tags?: string[];
};

type RestaurantDataset = {
    $schema: string;
    attribution: {
        geocoding: string;
    };
    items: Restaurant[];
};

type GeocodeResult = {
    lat: number;
    lng: number;
    address: string;
    district: string;
    plusCode?: string;
};

type CliOptions = {
    inputPath: string;
    outputPath: string;
    geocode: boolean;
    schemaPath: string;
};

const DEFAULT_SCHEMA_PATH = "./restaurants.schema.json";
const GEOCODING_ATTRIBUTION = `Powered by <a href="https://developers.arcgis.com/documentation/mapping-and-location-services/geocoding/" target="_blank" rel="noopener noreferrer">Esri</a>`;

const csvRowSchema = z.record(z.string(), z.string());
const coordinateSchema = z.tuple([z.number().finite(), z.number().finite()]);
const geocodeResultSchema = z.object({
    lat: z.number().finite(),
    lng: z.number().finite(),
    address: z.string().trim().min(1),
    district: z.string().trim().min(1),
    plusCode: z.string().trim().min(1).optional(),
});

async function main() {
    const options = parseCliArgs(process.argv.slice(2));
    const csvText = await readFile(options.inputPath, "utf8");
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
        throw new Error("CSV is empty.");
    }

    const items: Restaurant[] = [];
    const progressBar = new cliProgress.SingleBar(
        {
            format: "Converting [{bar}] {percentage}% | {value}/{total} | {name}",
            hideCursor: true,
        },
        cliProgress.Presets.shades_classic,
    );

    try {
        progressBar.start(rows.length, 0, {
            name: "starting",
        });

        for (const [index, row] of rows.entries()) {
            progressBar.update(index, {
                name: requireField(row, "店名"),
            });

            const restaurant = await buildRestaurant(row, options.geocode);

            items.push(restaurant);
            progressBar.update(index + 1, {
                name: restaurant.name,
            });

            if (options.geocode && rowNeedsLookup(row) && index < rows.length - 1) {
                await sleep(1100);
            }
        }
    } finally {
        progressBar.stop();
    }

    const dataset: RestaurantDataset = {
        $schema: options.schemaPath,
        attribution: {
            geocoding: GEOCODING_ATTRIBUTION,
        },
        items,
    };

    await writeFile(options.outputPath, `${JSON.stringify(dataset, null, 4)}\n`, "utf8");
    console.log(`Wrote ${items.length} restaurant(s) to ${options.outputPath}`);
}

function parseCliArgs(args: string[]): CliOptions {
    const { positionals, values } = parseNodeArgs({
        args,
        allowPositionals: true,
        options: {
            out: {
                type: "string",
            },
            schema: {
                type: "string",
            },
            "no-geocode": {
                type: "boolean",
            },
        },
        strict: true,
    });

    if (positionals.length === 0) {
        throw new Error(
            "Usage: bun run parseData.ts <input.csv> [--out output.json] [--schema ./restaurants.schema.json] [--no-geocode]",
        );
    }

    if (positionals.length > 1) {
        throw new Error(`Unexpected positional arguments: ${positionals.slice(1).join(", ")}`);
    }

    const inputPath = resolve(positionals[0]);
    const geocode = !values["no-geocode"];
    const schemaPath = values.schema ?? DEFAULT_SCHEMA_PATH;
    let outputPath = values.out ? resolve(values.out) : "";

    if (outputPath === "") {
        const inputDir = dirname(inputPath);
        const inputBase = basename(inputPath, extname(inputPath));
        outputPath = join(inputDir, `${inputBase}.json`);
    }

    return {
        inputPath,
        outputPath,
        geocode,
        schemaPath,
    };
}

function parseCsv(text: string): CsvRow[] {
    const rows = parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    return z.array(csvRowSchema).parse(rows);
}

async function buildRestaurant(row: CsvRow, geocodeEnabled: boolean): Promise<Restaurant> {
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
        const district = extractDistrictFromAddress(addressText);

        if (!district) {
            throw new Error(`Unable to determine district from provided address "${addressText}".`);
        }

        return {
            name,
            lat: coordinates[0],
            lng: coordinates[1],
            district,
            tier,
            priceBucket,
            address: addressText,
            ...(notes ? { notes } : {}),
            ...(tags.length > 0 ? { tags } : {}),
        };
    }

    if (!geocodeEnabled) {
        throw new Error('Lookup is required when only one of "經緯度" or "地址" is provided. Remove --no-geocode.');
    }

    if (coordinates) {
        const geocode = await reverseGeocode(coordinates[0], coordinates[1]);

        return {
            name,
            lat: coordinates[0],
            lng: coordinates[1],
            district: geocode.district,
            tier,
            priceBucket,
            address: geocode.address,
            ...(geocode.plusCode ? { plusCode: geocode.plusCode } : {}),
            ...(notes ? { notes } : {}),
            ...(tags.length > 0 ? { tags } : {}),
        };
    }

    const geocode = await forwardGeocode(name, addressText!);

    return {
        name,
        lat: geocode.lat,
        lng: geocode.lng,
        district: geocode.district,
        tier,
        priceBucket,
        address: addressText,
        ...(geocode.plusCode ? { plusCode: geocode.plusCode } : {}),
        ...(notes ? { notes } : {}),
        ...(tags.length > 0 ? { tags } : {}),
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
    return coordinateSchema.parse([Number(latText), Number(lngText)], {
        error: `Invalid coordinates: ${value}`,
    });
}

function parseTier(value: string): number {
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

async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const response = await esriReverseGeocode([lng, lat], {
        params: {
            langCode: "zh-tw",
            outFields: ["Match_addr", "LongLabel", "Address", "District", "City", "Subregion", "Region", "Postal"],
        },
    });

    const address = formatArcGisAddress(response.address);
    const district = extractArcGisDistrict(response.address);

    if (!address) {
        throw new Error(`Reverse geocoding returned no address for ${lat}, ${lng}.`);
    }

    if (!district) {
        throw new Error(`Reverse geocoding returned no district for ${lat}, ${lng}.`);
    }

    return geocodeResultSchema.parse({
        lat,
        lng,
        address,
        district,
    });
}

async function forwardGeocode(name: string, address: string): Promise<GeocodeResult> {
    const queries = buildAddressQueries(name, address);
    let match:
        | {
              address: string;
              location: {
                  x: number;
                  y: number;
              };
              attributes: Record<string, string | number | undefined>;
          }
        | undefined;

    for (const query of queries) {
        const response = await geocode({
            singleLine: query,
            countryCode: "TWN",
            outFields: [
                "Addr_type",
                "Match_addr",
                "LongLabel",
                "Address",
                "District",
                "City",
                "Subregion",
                "Region",
                "Postal",
            ],
            params: {
                langCode: "zh-tw",
                maxLocations: 1,
            },
        });

        const candidate = response.candidates[0];
        if (
            candidate?.location &&
            typeof candidate.location.x === "number" &&
            typeof candidate.location.y === "number"
        ) {
            match = {
                address: candidate.address,
                location: {
                    x: candidate.location.x,
                    y: candidate.location.y,
                },
                attributes: candidate.attributes as Record<string, string | number | undefined>,
            };
            break;
        }
    }

    if (typeof match?.location?.x !== "number" || typeof match.location.y !== "number") {
        throw new Error(`Forward geocoding returned no coordinates for "${address}".`);
    }

    const lat = match.location.y;
    const lng = match.location.x;
    const district = extractArcGisDistrict(match.attributes) ?? extractDistrictFromAddress(address);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(`Forward geocoding returned invalid coordinates for "${address}".`);
    }

    if (!district) {
        throw new Error(`Forward geocoding returned no district for "${address}".`);
    }

    return geocodeResultSchema.parse({
        lat,
        lng,
        address,
        district,
    });
}

function extractArcGisDistrict(address?: Record<string, string | number | undefined>): string | undefined {
    if (!address) {
        return undefined;
    }

    return [
        stringValue(address.District),
        stringValue(address.City),
        stringValue(address.Subregion),
        stringValue(address.Region),
    ]
        .map((value) => value?.trim())
        .find((value) => Boolean(value));
}

function formatArcGisAddress(address?: Record<string, string | number | undefined>): string | undefined {
    if (!address) {
        return undefined;
    }

    const formatted = [
        stringValue(address.LongLabel),
        stringValue(address.Match_addr),
        [
            stringValue(address.Postal),
            stringValue(address.City),
            stringValue(address.District),
            stringValue(address.Address),
        ]
            .filter(Boolean)
            .join(""),
    ]
        .map((value) => value?.trim())
        .find((value) => Boolean(value));

    return formatted || undefined;
}

function extractDistrictFromAddress(address: string): string | undefined {
    const compact = address.replace(/\s+/g, "");
    const match = compact.match(/(?:市|縣)([^市縣區鄉鎮]+(?:區|鄉|鎮|市))/u);
    return match?.[1];
}

function buildAddressQueries(name: string, address: string): string[] {
    const compact = address.replace(/\s+/g, "");
    return [
        ...new Set([
            address,
            compact,
            `${name} ${address}`,
            `${name}${compact}`,
            `臺灣${compact}`,
            `台灣${compact}`,
            `臺灣${name}${compact}`,
            `台灣${name}${compact}`,
        ]),
    ];
}

function stringValue(value: string | number | undefined): string | undefined {
    return typeof value === "string" ? value : undefined;
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
});
