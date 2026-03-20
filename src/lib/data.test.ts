import { afterEach, describe, expect, it, mock } from "bun:test";
import { formatPrice, type Currency } from "./currency";
import { loadRestaurants } from "./data";

const originalFetch = globalThis.fetch;

describe("loadRestaurants", () => {
    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    it("returns dataset currency metadata with loaded restaurants", async () => {
        globalThis.fetch = mock(
            async () =>
                new Response(
                    JSON.stringify({
                        currency: {
                            code: "JPY",
                            symbol: "JPY ",
                        },
                        view: {
                            bounds: [
                                [35.66549, 139.75854],
                                [35.66549, 139.75854],
                            ],
                        },
                        items: [
                            {
                                name: "東京店",
                                lat: 35.66549,
                                lng: 139.75854,
                                tier: 4,
                                priceBucket: 450,
                            },
                        ],
                    }),
                ),
        ) as unknown as typeof fetch;

        const loaded = await loadRestaurants("tokyo.json");

        expect(loaded.currency).toEqual({
            code: "JPY",
            symbol: "JPY ",
        } satisfies Currency);
        expect(loaded.items[0]?.priceBucket).toBe(450);
    });

    it("rejects datasets with malformed currency payloads", async () => {
        globalThis.fetch = mock(
            async () =>
                new Response(
                    JSON.stringify({
                        currency: {
                            code: "",
                            symbol: "",
                        },
                        view: {
                            bounds: [
                                [25.1, 121.5],
                                [25.1, 121.5],
                            ],
                        },
                        items: [],
                    }),
                ),
        ) as unknown as typeof fetch;

        await expect(loadRestaurants("broken.json")).rejects.toThrow("currency.code");
    });
});

describe("formatPrice", () => {
    it("formats numeric price buckets with the dataset currency symbol", () => {
        expect(formatPrice(450, { code: "JPY", symbol: "JPY " })).toBe("JPY 450");
        expect(formatPrice(150, { code: "TWD", symbol: "$" })).toBe("$150");
    });
});
