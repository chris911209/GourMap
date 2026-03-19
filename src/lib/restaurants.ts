import { mount, unmount } from "svelte";
import MarkerPopup from "../components/MarkerPopup.svelte";
export { CLOSED_TIER, compareTierDescending, tierBadge, tierColor, tierName, type Tier } from "./tier";
import type { Tier } from "./tier";

export type PriceBucket = number;

export type Restaurant = {
    name: string;
    lat: number;
    lng: number;
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
    view?: {
        bounds?: [[number, number], [number, number]];
    };
    items: Restaurant[];
};

export type PopupContentHandle = {
    element: HTMLDivElement;
    mount: () => void;
    destroy: () => void;
};

export function mountPopupContent(shop: Restaurant): PopupContentHandle {
    let container = document.createElement("div");
    let component: Record<string, any> | null = null;

    function mountContent() {
        if (component) {
            return;
        }

        component = mount(MarkerPopup, {
            props: {
                restaurant: shop,
            },
            target: container,
        });
    }

    function destroyContent() {
        if (!component) {
            return;
        }

        const mountedComponent = component;
        component = null;
        void unmount(mountedComponent);
    }

    mountContent();

    return {
        element: container,
        mount: mountContent,
        destroy: destroyContent,
    };
}
