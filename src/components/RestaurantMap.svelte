<script lang="ts">
    import L from "leaflet";
    import type { Snippet } from "svelte";
    import { initView, initZoom, provider } from "../lib/map";
    import { mountPopupContent, tierColor, type Restaurant } from "../lib/restaurants";

    let {
        restaurants = [],
        geocodeAttribution = null,
        children,
    }: {
        restaurants: Restaurant[];
        geocodeAttribution?: string | null;
        children?: Snippet;
    } = $props();

    let mapElement: HTMLDivElement;
    let map: L.Map | null = null;
    let markerGroup: L.LayerGroup | null = null;
    let baseLayer: L.TileLayer | null = null;
    const fitPadding = L.point(48, 48);
    const fitMaxZoom = 16;

    $effect(() => {
        const mapInstance = L.map(mapElement).setView(initView, initZoom);

        map = mapInstance;

        return () => {
            baseLayer?.remove();
            baseLayer = null;
            markerGroup?.remove();
            markerGroup = null;
            map = null;
            mapInstance.remove();
        };
    });

    $effect(() => {
        if (!map) {
            return;
        }

        baseLayer?.remove();
        baseLayer = L.tileLayer(provider.url, {
            maxZoom: provider.maxZoom,
            attribution: geocodeAttribution
                ? `${provider.attribution} | ${geocodeAttribution}`
                : provider.attribution,
        }).addTo(map);
    });

    $effect(() => {
        if (!map) {
            return;
        }

        markerGroup?.remove();
        markerGroup = L.layerGroup().addTo(map);

        for (const shop of restaurants) {
            L.circleMarker([shop.lat, shop.lng], {
                radius: 10,
                fillColor: tierColor[shop.tier],
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.7,
            })
                .addTo(markerGroup)
                .bindTooltip(`<b>T${shop.tier}</b> ${shop.name}`, { direction: "top", offset: [0, -10] })
                .bindPopup(mountPopupContent(shop));
        }

        if (restaurants.length === 0) {
            map.setView(initView, initZoom);
            return;
        }

        const bounds = L.latLngBounds(restaurants.map((shop) => [shop.lat, shop.lng] as L.LatLngTuple));
        map.fitBounds(bounds, {
            padding: fitPadding,
            maxZoom: fitMaxZoom,
        });
    });
</script>

<div class="map-shell">
    <div bind:this={mapElement} class="map"></div>
    {@render children?.()}
</div>

<style lang="scss">
    .map-shell {
        position: relative;
        flex-grow: 1;
    }

    .map {
        height: 100%;
        width: 100%;
    }
</style>
