<script lang="ts">
    import L from "leaflet";
    import { onMount } from "svelte";
    import { initView, initZoom, provider } from "./lib/map";

    let mapElement: HTMLDivElement;

    onMount(() => {
        const map = L.map(mapElement).setView(initView, initZoom);

        L.tileLayer(provider.url, {
            maxZoom: provider.maxZoom,
            attribution: provider.attribution,
        }).addTo(map);

        return () => {
            map.remove();
        };
    });
</script>

<div bind:this={mapElement} class="map"></div>

<style lang="scss">
    .map {
        height: 50vh;
        width: 100%;
    }
</style>