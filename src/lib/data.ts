import type { Restaurant, RestaurantDataset } from "./restaurants";

export type DataSource = {
    path: string;
    name: string;
};

export type LoadedRestaurants = {
    items: Restaurant[];
    geocodeAttribution: string | null;
};

const sourceListUrl = `${import.meta.env.BASE_URL}data/.sourcelist.json`;

function getDataUrl(path: string) {
    return `${import.meta.env.BASE_URL}data/${path}`;
}

export async function loadSourceList(): Promise<DataSource[]> {
    const response = await fetch(sourceListUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch .sourcelist.json: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as DataSource[];
}

export async function loadRestaurants(path: string): Promise<LoadedRestaurants> {
    const response = await fetch(getDataUrl(path));

    if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
    }

    const dataset = (await response.json()) as RestaurantDataset;
    return {
        items: dataset.items,
        geocodeAttribution: dataset.attribution?.geocoding ?? null,
    };
}
