import { mount } from "svelte";
import MarkerPopup from "../components/MarkerPopup.svelte";

export type District = string;

export type Tier = number;

export type PriceBucket = number;

export type Restaurant = {
    name: string;
    lat: number;
    lng: number;
    district: District;
    tier: Tier;
    priceBucket: PriceBucket;
    address?: string;
    notes?: string;
    plusCode?: string;
    tags?: string[];
};

export type RestaurantDataset = {
    $schema?: string;
    attribution?: {
        geocoding?: string;
    };
    items: Restaurant[];
};

export function mountPopupContent(shop: Restaurant): HTMLDivElement {
    let container = document.createElement("div");
    mount(MarkerPopup, {
        props: {
            restaurant: shop,
        },
        target: container,
    });
    return container;
}

export const tierName = {
    0: "此生必吃",
    1: "贊不絕口",
    2: "值得一試",
    3: "普普通通",
    4: "將就果腹",
    5: "難以下嚥",
    6: "犬不爭食"
}
