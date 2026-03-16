<script lang="ts">
    import L from "leaflet";
    import LegendPanel from "./components/LegendPanel.svelte";
    import OverlayPanel from "./components/OverlayPanel.svelte";
    import { geocodeAttribution, initView, initZoom, provider } from "./lib/map";
    import { mountPopupContent, tierColor, type RestaurantDataset } from "./lib/restaurants";

    let mapElement: HTMLDivElement;
    let loadError = $state<string | null>(null);
    let legendOpen = $state(false);
    let filterPanelOpen = $state(false);

    function setLegendOpen(open: boolean) {
        legendOpen = open;

        if (open) {
            filterPanelOpen = false;
        }
    }

    function setFilterPanelOpen(open: boolean) {
        filterPanelOpen = open;

        if (open) {
            legendOpen = false;
        }
    }

    $effect(() => {
        const map = L.map(mapElement).setView(initView, initZoom);

        L.tileLayer(provider.url, {
            maxZoom: provider.maxZoom,
            attribution: provider.attribution + " | " + geocodeAttribution,
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
                throw new Error(`Failed to fetch restaurant data: ${response.status} ${response.statusText}`);
            }

            const dataset = (await response.json()) as RestaurantDataset;

            const markerGroup = L.layerGroup().addTo(map);

            for (const shop of dataset.items) {
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
        } catch (error) {
            loadError = error instanceof Error ? error.message : "Failed to load restaurant data.";
        }
    }
</script>

<main class="app">
    <header class="page-header">
        <h1>GourMap</h1>
    </header>

    {#if loadError}
        <p class="load-error">{loadError}</p>
    {/if}

    <section class="map-shell">
        <div bind:this={mapElement} class="map"></div>

        <LegendPanel open={legendOpen} onOpenChange={setLegendOpen} />

        <OverlayPanel
            open={filterPanelOpen}
            onOpenChange={setFilterPanelOpen}
            title="篩選"
            side="left"
            hiddenIcon="filter_alt"
            panelId="filter-panel"
            openLabel="展開篩選面板"
            closeLabel="收起篩選面板"
        >
            <div class="placeholder-panel">
                <p class="placeholder-title">Filter Panel</p>
                <p class="placeholder-copy">預留給之後的 filtering UI</p>
            </div>
        </OverlayPanel>
    </section>
</main>

<style lang="scss">
    .app {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .page-header {
        padding: 1rem;
        background: linear-gradient(180deg, #fffdf8 0%, #ffffff 100%);
        border-bottom: 1px solid #ece8df;

        h1 {
            margin: 0;
            font-size: clamp(1.75rem, 4vw, 2.5rem);
            letter-spacing: -0.04em;
        }
    }

    .map-shell {
        position: relative;
        flex-grow: 1;
    }

    .load-error {
        margin: 1rem;
        color: #b42318;
    }

    .map {
        height: 100%;
        width: 100%;
    }

    .placeholder-panel {
        min-width: 14rem;
        display: grid;
        gap: 0.35rem;
    }

    .placeholder-title {
        font-weight: 700;
        color: var(--text-h);
    }

    .placeholder-copy {
        font-size: 0.9rem;
        line-height: 1.45;
        color: var(--text);
    }
</style>
