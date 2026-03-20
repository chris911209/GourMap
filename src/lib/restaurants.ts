import { mount, unmount } from "svelte";
import MarkerPopup from "../components/MarkerPopup.svelte";
import { DEFAULT_CURRENCY, formatPrice, type Currency, type CurrencyCode } from "./currency";
export {
    CLOSED_TIER,
    CONTROVERSIAL_TIER,
    compareTierDescending,
    tierBadge,
    tierColor,
    tierName,
    type Tier,
} from "./tier";
import type { Tier } from "./tier";
export {
    CURRENCY_CODES,
    CURRENCY_PRESETS,
    DEFAULT_CURRENCY,
    formatPrice,
    type Currency,
    type CurrencyCode,
} from "./currency";

export type PriceBucket = number;
export type RestaurantComment = {
    username?: string;
    tier: Tier;
    notes?: string;
};

export type Restaurant = {
    name: string;
    lat: number;
    lng: number;
    tier: Tier;
    priceBucket: PriceBucket;
    address?: string;
    comments?: RestaurantComment[];
    plusCode?: string;
    tags?: string[];
};

export type RestaurantDataset = {
    $schema?: string;
    currency: Currency;
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

export function mountPopupContent(shop: Restaurant, currency: Currency = DEFAULT_CURRENCY): PopupContentHandle {
    let container = document.createElement("div");
    let component: Record<string, any> | null = null;

    function mountContent() {
        if (component) {
            return;
        }

        component = mount(MarkerPopup, {
            props: {
                currency,
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
