export type CurrencyCode = "TWD" | "USD" | "JPY" | "EUR";

export type Currency = {
    code: CurrencyCode;
    symbol: string;
};

export const DEFAULT_CURRENCY: Currency = {
    code: "TWD",
    symbol: "$",
};

export const CURRENCY_CODES = ["TWD", "USD", "JPY", "EUR"] as const satisfies readonly CurrencyCode[];

export const CURRENCY_PRESETS: Currency[] = [
    DEFAULT_CURRENCY,
    {
        code: "USD",
        symbol: "$",
    },
    {
        code: "JPY",
        symbol: "¥",
    },
    {
        code: "EUR",
        symbol: "€",
    },
];

export function formatPrice(priceBucket: number, currency: Currency): string {
    return `${currency.symbol}${priceBucket}`;
}
