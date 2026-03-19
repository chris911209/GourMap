import { mount, unmount } from "svelte";
import MarkerPopup from "../components/MarkerPopup.svelte";

export type Tier = number;

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

export const tierName: Record<Tier, string> = {
    0: "此生必吃",
    1: "贊不絕口",
    2: "值得一試",
    3: "家常風味",
    4: "將就果腹",
    5: "難以下嚥",
    6: "犬不爭食",
};

export const tierColor: Record<Tier, string> = {
    0: "#d73027",
    1: "#f46d43",
    2: "#fee08b",
    3: "#66bd63",
    4: "#1a6698",
    5: "#542788",
    6: "#000000",
};
