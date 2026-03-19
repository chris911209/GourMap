import { reverseGeocode as esriReverseGeocode, geocode } from "@esri/arcgis-rest-geocoding";
import { z } from "zod";
import type { ConverterGeocoder, GeocodeResult } from "./types";

const geocodeResultSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().trim().min(1),
    plusCode: z.string().trim().min(1).optional(),
});

export function createArcGisGeocoder(): ConverterGeocoder {
    return {
        async forwardGeocode(name: string, address: string): Promise<GeocodeResult> {
            try {
                const queries = buildAddressQueries(name, address);
                let match:
                    | {
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
                        outFields: ["Addr_type", "Match_addr", "LongLabel", "Address", "City", "Subregion", "Region", "Postal"],
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
                            location: {
                                x: candidate.location.x,
                                y: candidate.location.y,
                            },
                            attributes: (candidate.attributes as Record<string, string | number | undefined> | undefined) ?? {},
                        };
                        break;
                    }
                }

                if (typeof match?.location.x !== "number" || typeof match.location.y !== "number") {
                    throw new Error(`Forward geocoding returned no coordinates for "${address}".`);
                }

                const result = geocodeResultSchema.parse({
                    lat: match.location.y,
                    lng: match.location.x,
                    address: formatArcGisAddress(match.attributes) ?? address,
                    plusCode: stringValue(match.attributes.Addr_type) === "PointAddress" ? undefined : undefined,
                });

                if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng)) {
                    throw new Error(`Forward geocoding returned invalid coordinates for "${address}".`);
                }

                return result;
            } catch (error) {
                throw normalizeGeocodingError(error);
            }
        },
        async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
            try {
                const response = await esriReverseGeocode([lng, lat], {
                    params: {
                        langCode: "zh-tw",
                        outFields: ["Match_addr", "LongLabel", "Address", "City", "Subregion", "Region", "Postal"],
                    },
                });

                const address = formatArcGisAddress(response.address);
                if (!address) {
                    throw new Error(`Reverse geocoding returned no address for ${lat}, ${lng}.`);
                }

                return geocodeResultSchema.parse({
                    lat,
                    lng,
                    address,
                });
            } catch (error) {
                throw normalizeGeocodingError(error);
            }
        },
    };
}

function normalizeGeocodingError(error: unknown): Error {
    if (error instanceof Error) {
        if (
            error.message.startsWith("Forward geocoding returned no coordinates") ||
            error.message.startsWith("Forward geocoding returned invalid coordinates") ||
            error.message.startsWith("Reverse geocoding returned no address")
        ) {
            return error;
        }

        return new Error(`Geocoding request failed: ${error.message}`);
    }

    return new Error(`Geocoding request failed: ${String(error)}`);
}

function formatArcGisAddress(address?: Record<string, string | number | undefined>): string | undefined {
    if (!address) {
        return undefined;
    }

    const formatted = [
        stringValue(address.LongLabel),
        stringValue(address.Match_addr),
        [stringValue(address.Postal), stringValue(address.City), stringValue(address.Address)].filter(Boolean).join(""),
    ]
        .map((value) => value?.trim())
        .find((value) => Boolean(value));

    return formatted || undefined;
}

function buildAddressQueries(name: string, address: string): string[] {
    const compact = address.replace(/\s+/g, "");

    return [
        ...new Set([address, compact, `${name} ${address}`, `${name}${compact}`, `臺灣${compact}`, `台灣${compact}`, `臺灣${name}${compact}`, `台灣${name}${compact}`]),
    ];
}

function stringValue(value: string | number | undefined): string | undefined {
    return typeof value === "string" ? value : undefined;
}
