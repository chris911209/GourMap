import { z } from "zod";
import type { Restaurant } from "./restaurants";

export type DataSource = {
    path: string;
    name: string;
};

export type LoadedRestaurants = {
    items: Restaurant[];
    geocodeAttribution: string | null;
    defaultBounds: [[number, number], [number, number]] | null;
};

const sourceListUrl = `${import.meta.env.BASE_URL}data/.sourcelist.json`;

const dataSourceSchema = z.object({
    path: z.string(),
    name: z.string(),
});

const coordinatePairSchema = z.tuple([z.number(), z.number()]);

const restaurantSchema = z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    tier: z.number(),
    priceBucket: z.number(),
    address: z.string().optional(),
    notes: z.string().optional(),
    plusCode: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

const restaurantDatasetSchema = z.object({
    attribution: z
        .object({
            geocoding: z.string().optional(),
        })
        .optional(),
    view: z
        .object({
            bounds: z.tuple([coordinatePairSchema, coordinatePairSchema]).optional(),
        })
        .optional(),
    items: z.array(restaurantSchema),
});

function validationError(error: z.ZodError): Error {
    const issue = error.issues[0];
    const path = issue?.path.length ? issue.path.join(".") : "payload";
    return new Error(`Invalid data payload: ${path} ${issue?.message ?? "is invalid."}`);
}

function getDataUrl(path: string) {
    return `${import.meta.env.BASE_URL}data/${path}`;
}

export async function loadSourceList(): Promise<DataSource[]> {
    const response = await fetch(sourceListUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch .sourcelist.json: ${response.status} ${response.statusText}`);
    }

    const parsed = dataSourceSchema.array().safeParse(await response.json());

    if (!parsed.success) {
        throw validationError(parsed.error);
    }

    return parsed.data;
}

export async function loadRestaurants(path: string): Promise<LoadedRestaurants> {
    const response = await fetch(getDataUrl(path));

    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }

    const parsed = restaurantDatasetSchema.safeParse(await response.json());

    if (!parsed.success) {
        throw validationError(parsed.error);
    }

    const dataset = parsed.data;
    return {
        items: dataset.items as Restaurant[],
        geocodeAttribution: dataset.attribution?.geocoding ?? null,
        defaultBounds: dataset.view?.bounds ?? null,
    };
}
