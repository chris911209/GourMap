import { mount } from "svelte";
import MarkerPopup from "../components/MarkerPopup.svelte";
import { escapeHtml } from "./string";

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
