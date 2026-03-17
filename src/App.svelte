<script lang="ts">
    import LegendPanel from "./components/LegendPanel.svelte";
    import OverlayPanel from "./components/OverlayPanel.svelte";
    import RestaurantMap from "./components/RestaurantMap.svelte";
    import { loadRestaurants as fetchRestaurants } from "./lib/data";
    import { tierName, type Restaurant } from "./lib/restaurants";

    let loadError = $state<string | null>(null);
    let legendOpen = $state(false);
    let filterPanelOpen = $state(false);
    let allRestaurants = $state<Restaurant[]>([]);
    let selectedDistrict = $state("all");
    let selectedTag = $state("all");
    let selectedTier = $state("all");

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
        loadRestaurants();
    });

    let districtOptions = $derived.by(() => getUniqueOptions(allRestaurants.map((shop) => shop.district)));
    let tagOptions = $derived.by(() => getUniqueOptions(allRestaurants.flatMap((shop) => shop.tags ?? [])));
    let tierOptions = $derived.by(() => [...new Set(allRestaurants.map((shop) => shop.tier))].sort((a, b) => a - b));
    let filteredRestaurants = $derived.by(() =>
        allRestaurants.filter((shop) => {
            const districtMatches = selectedDistrict === "all" || shop.district === selectedDistrict;
            const tagMatches = selectedTag === "all" || (shop.tags ?? []).includes(selectedTag);
            const tierMatches = selectedTier === "all" || String(shop.tier) === selectedTier;

            return districtMatches && tagMatches && tierMatches;
        }),
    );

    async function loadRestaurants() {
        try {
            allRestaurants = await fetchRestaurants();
            loadError = null;
        } catch (error) {
            loadError = error instanceof Error ? error.message : "Failed to load restaurant data.";
        }
    }

    function getUniqueOptions(values: string[]) {
        return [...new Set(values)].sort((left, right) => left.localeCompare(right, "zh-Hant"));
    }

    function resetFilters() {
        selectedDistrict = "all";
        selectedTag = "all";
        selectedTier = "all";
    }

    function setSelectedTier(tier: string) {
        selectedTier = selectedTier === tier ? "all" : tier;
    }
</script>

<main class="app">
    <header class="page-header">
        <h1 class="site-title">
            <img class="site-title__icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="GourMap logo" />
            <span>GourMap</span>
            <small>台北餐廳排行</small>
        </h1>
        <a class="source-link" href="https://github.com/Dogeon188/GourMap" target="_blank" rel="noreferrer">
            <img class="source-link__icon" src={`${import.meta.env.BASE_URL}github.png`} alt="" aria-hidden="true" />
        </a>
    </header>

    {#if loadError}
        <p class="load-error">{loadError}</p>
    {/if}

    <RestaurantMap restaurants={filteredRestaurants}>
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
            <form class="filter-panel">
                <div class="filter-header">
                    <p class="filter-count">{filteredRestaurants.length} / {allRestaurants.length} 間店家</p>
                    <button class="filter-reset" type="button" onclick={resetFilters}>清除</button>
                </div>

                <label class="filter-field">
                    <span class="filter-label">行政區</span>
                    <select bind:value={selectedDistrict}>
                        <option value="all">全部</option>
                        {#each districtOptions as district}
                            <option value={district}>{district}</option>
                        {/each}
                    </select>
                </label>

                <label class="filter-field">
                    <span class="filter-label">標籤</span>
                    <select bind:value={selectedTag}>
                        <option value="all">全部</option>
                        {#each tagOptions as tag}
                            <option value={tag}>{tag}</option>
                        {/each}
                    </select>
                </label>

                <label class="filter-field">
                    <span class="filter-label">Tier</span>
                    <select bind:value={selectedTier}>
                        <option value="all">全部</option>
                        {#each tierOptions as tier}
                            <option value={String(tier)}>T{tier} {tierName[tier]}</option>
                        {/each}
                    </select>
                </label>
            </form>
        </OverlayPanel>

        <LegendPanel open={legendOpen} onOpenChange={setLegendOpen} {selectedTier} onTierSelect={setSelectedTier} />
    </RestaurantMap>
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

    .site-title {
        display: inline-flex;
        align-items: center;
        gap: clamp(0.5rem, 1.5vw, 0.85rem);
    }

    .site-title__icon {
        width: clamp(2rem, 5vw, 3.25rem);
        height: clamp(2rem, 5vw, 3.25rem);
        flex-shrink: 0;
    }

    .source-link {
        color: var(--accent);
        font-size: 0.95rem;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .source-link__icon {
        width: 1.8rem;
        height: 1.8rem;
        object-fit: contain;
        flex-shrink: 0;
    }

    .source-link:hover {
        text-decoration: underline;
    }

    .load-error {
        margin: 1rem;
        color: #b42318;
    }

    .filter-panel {
        min-width: 14rem;
        display: grid;
        gap: 0.85rem;
    }

    .filter-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .filter-count {
        font-weight: 700;
        color: var(--text-h);
    }

    .filter-reset {
        border: none;
        background: transparent;
        color: var(--accent);
        font: inherit;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
    }

    .filter-reset:hover {
        text-decoration: underline;
    }

    .filter-field {
        display: grid;
        gap: 0.35rem;
    }

    .filter-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-h);
    }

    .filter-field select {
        min-width: 14rem;
        padding: 0.7rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.9);
        color: var(--text-h);
        font: inherit;
    }

    .filter-field select:focus {
        outline: 2px solid color-mix(in srgb, var(--accent) 35%, white);
        outline-offset: 2px;
    }
</style>
