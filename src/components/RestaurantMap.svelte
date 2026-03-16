<script lang="ts">
    import L from "leaflet";
    import type { Snippet } from "svelte";
    import { geocodeAttribution, initView, initZoom, provider } from "../lib/map";
    import { mountPopupContent, tierColor, type Restaurant } from "../lib/restaurants";

    let { restaurants = [], children }: { restaurants: Restaurant[]; children?: Snippet } = $props();

    let mapElement: HTMLDivElement;
    let map: L.Map | null = null;
    let markerGroup: L.LayerGroup | null = null;
    const fitPadding = L.point(48, 48);
    const fitMaxZoom = 16;

    $effect(() => {
        const mapInstance = L.map(mapElement).setView(initView, initZoom);

        L.tileLayer(provider.url, {
            maxZoom: provider.maxZoom,
            attribution: provider.attribution + " | " + geocodeAttribution,
        }).addTo(mapInstance);

        map = mapInstance;

        return () => {
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

        markerGroup?.remove();
        markerGroup = L.layerGroup().addTo(map);

        for (const shop of restaurants) {
            L.circleMarker([shop.lat, shop.lng], {
                radius: 10,
                fillColor: tierColor[shop.tier],
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.92,
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
