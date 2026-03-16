<script lang="ts">
    import L from "leaflet";
    import { render } from "svelte/server";
    import { initView, initZoom, provider } from "./lib/map";
    import { mountPopupContent, type RestaurantDataset } from "./lib/restaurants";

    let mapElement: HTMLDivElement;
    let loadError = $state<string | null>(null);

    $effect(() => {
        const map = L.map(mapElement).setView(initView, initZoom);

        L.tileLayer(provider.url, {
            maxZoom: provider.maxZoom,
            attribution: provider.attribution,
        }).addTo(map);

        loadRestaurants(map);

        return () => {
            map.remove();
        };
    });

    async function loadRestaurants(map: L.Map) {
        try {
            const response = await fetch("/data/noodle.json");

            if (!response.ok) {
                throw new Error(`Failed to load ramen.json: ${response.status}`);
            }

            const dataset = (await response.json()) as RestaurantDataset;

            const markerGroup = L.layerGroup().addTo(map);

            for (const shop of dataset.items) {
                L.circleMarker([shop.lat, shop.lng], {
                    radius: 10,
                    fillColor: "#ff5722",
                    color: "#fff",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                })
                    .addTo(markerGroup)
                    .bindTooltip(shop.name, { direction: "top", offset: [0, -10] })
                    .bindPopup(mountPopupContent(shop));
            }
        } catch (error) {
            loadError = error instanceof Error ? error.message : "Failed to load restaurant data.";
        }
    }
</script>

{#if loadError}
    <p class="load-error">{loadError}</p>
{/if}

<div bind:this={mapElement} class="map"></div>

<style lang="scss">
    .load-error {
        margin: 1rem;
        color: #b42318;
    }

    .map {
        height: 80vh;
        width: 100%;
    }
</style>
