import type { Restaurant, RestaurantDataset } from "./restaurants";

export const dataSourceFiles = ["noodle.json", "curry.json"] as const;

export const dataUrls = dataSourceFiles.map((file) => `${import.meta.env.BASE_URL}data/${file}`);

export async function loadRestaurants(): Promise<Restaurant[]> {
    const datasets = await Promise.all(
        dataUrls.map(async (dataUrl, index) => {
            const response = await fetch(dataUrl);

            if (!response.ok) {
                throw new Error(`Failed to fetch ${dataSourceFiles[index]}: ${response.status} ${response.statusText}`);
            }

            return (await response.json()) as RestaurantDataset;
        }),
    );

    return datasets.flatMap((dataset) => dataset.items);
}
