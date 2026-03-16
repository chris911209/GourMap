<script lang="ts">
    import L from "leaflet";
    import LegendPanel from "./components/LegendPanel.svelte";
    import OverlayPanel from "./components/OverlayPanel.svelte";
    import { geocodeAttribution, initView, initZoom, provider } from "./lib/map";
    import { mountPopupContent, tierColor, type RestaurantDataset } from "./lib/restaurants";

    const dataSourceFiles = ["noodle.json", "curry.json"];
    const dataUrls = dataSourceFiles.map((file) => `${import.meta.env.BASE_URL}data/${file}`);

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
            const datasets = await Promise.all(
                dataUrls.map(async (dataUrl, index) => {
                    const response = await fetch(dataUrl);

                    if (!response.ok) {
                        throw new Error(
                            `Failed to fetch ${dataSourceFiles[index]}: ${response.status} ${response.statusText}`,
                        );
                    }

                    return (await response.json()) as RestaurantDataset;
                }),
            );

            const markerGroup = L.layerGroup().addTo(map);

            for (const shop of datasets.flatMap((dataset) => dataset.items)) {
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
        <a class="source-link" href="https://github.com/Dogeon188/GourMap" target="_blank" rel="noreferrer">
            <span class="material-symbols-outlined">code_xml</span>
            Source code
        </a>
    </header>

    {#if loadError}
        <p class="load-error">{loadError}</p>
    {/if}

    <section class="map-shell">
        <div bind:this={mapElement} class="map"></div>

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
        
        <LegendPanel open={legendOpen} onOpenChange={setLegendOpen} />
    </section>
</main>

<style lang="scss">
    .app {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: linear-gradient(180deg, #fffdf8 0%, #ffffff 100%);
        border-bottom: 1px solid #ece8df;

        h1 {
            margin: 0;
            font-size: clamp(1.75rem, 4vw, 2.5rem);
            letter-spacing: -0.04em;
        }
    }

    .source-link {
        color: var(--accent);
        font-size: 0.95rem;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        display: inline-flex;
        gap: 0.25rem;
    }

    .source-link:hover {
        text-decoration: underline;
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
