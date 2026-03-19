<script lang="ts">
    import { loadRestaurants as fetchRestaurants, loadSourceList, type DataSource } from "../lib/data";
    import { compareTierDescending, tierBadge, tierName, type Restaurant } from "../lib/restaurants";
    import LegendPanel from "./LegendPanel.svelte";
    import OverlayPanel from "./OverlayPanel.svelte";
    import RestaurantMap from "./RestaurantMap.svelte";

    let loadError = $state<string | null>(null);
    let legendOpen = $state(false);
    let filterPanelOpen = $state(false);
    let dataSources = $state<DataSource[]>([]);
    let selectedSourcePath = $state("");
    let geocodeAttribution = $state<string | null>(null);
    let defaultBounds = $state<[[number, number], [number, number]] | null>(null);
    let allRestaurants = $state<Restaurant[]>([]);
    let selectedTag = $state("all");
    let selectedTier = $state("all");
    let selectedMinPrice = $state("all");
    let selectedMaxPrice = $state("all");
    let latestInitializationRequestId = 0;
    let latestSourceRequestId = 0;

    const converterHref = `${import.meta.env.BASE_URL}converter`;

    let tagOptions = $derived.by(() => getUniqueOptions(allRestaurants.flatMap((shop) => shop.tags ?? [])));
    let tierOptions = $derived.by(() => [...new Set(allRestaurants.map((shop) => shop.tier))].sort((a, b) => a - b));
    let priceOptions = $derived.by(() => getPriceOptions(allRestaurants.map((shop) => shop.priceBucket)));
    let selectedSourceName = $derived.by(
        () => dataSources.find((source) => source.path === selectedSourcePath)?.name ?? "GourMap",
    );
    let filteredRestaurants = $derived.by(() =>
        allRestaurants.filter((shop) => {
            const tagMatches = selectedTag === "all" || (shop.tags ?? []).includes(selectedTag);
            const tierMatches = selectedTier === "all" || String(shop.tier) === selectedTier;
            const minPriceMatches = selectedMinPrice === "all" || shop.priceBucket >= Number(selectedMinPrice);
            const maxPriceMatches = selectedMaxPrice === "all" || shop.priceBucket <= Number(selectedMaxPrice);

            return tagMatches && tierMatches && minPriceMatches && maxPriceMatches;
        }),
    );

    $effect(() => {
        document.title = `${selectedSourceName}餐廳排行地圖`;
    });

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

    async function initializeSources() {
        const requestId = ++latestInitializationRequestId;

        try {
            const sources = await loadSourceList();
            if (requestId !== latestInitializationRequestId) {
                return;
            }

            dataSources = sources;
            const defaultSourcePath = sources[0]?.path ?? "";
            loadError = null;

            if (!defaultSourcePath) {
                selectedSourcePath = "";
                clearRestaurantData();
                return;
            }

            await setSelectedSource(defaultSourcePath);
        } catch (error) {
            if (requestId !== latestInitializationRequestId) {
                return;
            }

            dataSources = [];
            selectedSourcePath = "";
            clearRestaurantData();

            console.error("Failed to load source list:", error);
            loadError = error instanceof Error ? error.message : "Failed to load restaurant data.";
        }
    }

    async function setSelectedSource(path: string, shouldResetFilters = false) {
        const requestId = ++latestSourceRequestId;

        selectedSourcePath = path;

        if (shouldResetFilters) {
            resetFilters();
        }

        if (!path) {
            if (requestId !== latestSourceRequestId) {
                return;
            }

            clearRestaurantData();
            loadError = null;
            return;
        }

        try {
            const loadedRestaurants = await fetchRestaurants(path);
            if (requestId !== latestSourceRequestId) {
                return;
            }

            allRestaurants = loadedRestaurants.items.sort((a, b) => compareTierDescending(a.tier, b.tier));
            geocodeAttribution = loadedRestaurants.geocodeAttribution;
            defaultBounds = loadedRestaurants.defaultBounds;
            loadError = null;
        } catch (error) {
            if (requestId !== latestSourceRequestId) {
                return;
            }

            clearRestaurantData();

            console.error(`Failed to load restaurant data from source "${path}":`, error);
            loadError = error instanceof Error ? error.message : "Failed to load restaurant data.";
        }
    }

    function getUniqueOptions(values: string[]) {
        return [...new Set(values)].sort((left, right) => left.localeCompare(right, "zh-Hant"));
    }

    function getPriceOptions(values: number[]) {
        if (values.length === 0) {
            return [];
        }

        const minPrice = Math.floor(Math.min(...values) / 100) * 100;
        const maxPrice = Math.ceil(Math.max(...values) / 100) * 100;
        const options: number[] = [];

        for (let price = minPrice; price <= maxPrice; price += 100) {
            options.push(price);
        }

        return options;
    }

    function resetFilters() {
        selectedTag = "all";
        selectedTier = "all";
        selectedMinPrice = "all";
        selectedMaxPrice = "all";
    }

    function clearRestaurantData() {
        allRestaurants = [];
        geocodeAttribution = null;
        defaultBounds = null;
    }

    async function handleSourceChange(path: string) {
        await setSelectedSource(path, true);
    }

    function handleMinPriceChange(value: string) {
        selectedMinPrice = value;

        if (selectedMaxPrice !== "all" && value !== "all" && Number(value) > Number(selectedMaxPrice)) {
            selectedMaxPrice = value;
        }
    }

    function handleMaxPriceChange(value: string) {
        selectedMaxPrice = value;

        if (selectedMinPrice !== "all" && value !== "all" && Number(selectedMinPrice) > Number(value)) {
            selectedMinPrice = value;
        }
    }

    function setSelectedTier(tier: string) {
        selectedTier = selectedTier === tier ? "all" : tier;
    }

    void initializeSources();
</script>

<main class="app">
    <header class="page-header">
        <h1 class="site-title">
            <img class="site-title__icon" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="GourMap logo" />
            <span>GourMap</span>
        </h1>
        <div class="header-controls">
            <a class="utility-link" href={converterHref}>CSV 轉換器</a>
            <label class="source-picker">
                <span class="source-picker__label">資料集</span>
                <select
                    value={selectedSourcePath}
                    aria-label="選擇資料來源"
                    onchange={(event) => handleSourceChange((event.currentTarget as HTMLSelectElement).value)}
                >
                    {#each dataSources as source (source.path)}
                        <option value={source.path}>{source.name}</option>
                    {/each}
                </select>
            </label>
        </div>
    </header>

    {#if loadError}
        <p class="load-error">{loadError}</p>
    {/if}

    <RestaurantMap restaurants={filteredRestaurants} {geocodeAttribution} {defaultBounds}>
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
                    <span class="filter-label">標籤</span>
                    <select bind:value={selectedTag}>
                        <option value="all">全部</option>
                        {#each tagOptions as tag (tag)}
                            <option value={tag}>{tag}</option>
                        {/each}
                    </select>
                </label>

                <label class="filter-field">
                    <span class="filter-label">評級</span>
                    <select bind:value={selectedTier}>
                        <option value="all">全部</option>
                        {#each tierOptions as tier (tier)}
                            <option value={String(tier)}>{tierBadge(tier)} {tierName[tier]}</option>
                        {/each}
                    </select>
                </label>

                <div class="filter-field">
                    <span class="filter-label">價格區間</span>
                    <div class="price-range-fields">
                        <select
                            value={selectedMinPrice}
                            onchange={(event) => handleMinPriceChange((event.currentTarget as HTMLSelectElement).value)}
                        >
                            <option value="all">最低不限</option>
                            {#each priceOptions as price (price)}
                                <option value={String(price)}>${price}</option>
                            {/each}
                        </select>
                        <span class="price-range-separator">至</span>
                        <select
                            value={selectedMaxPrice}
                            onchange={(event) => handleMaxPriceChange((event.currentTarget as HTMLSelectElement).value)}
                        >
                            <option value="all">最高不限</option>
                            {#each priceOptions as price (price)}
                                <option value={String(price)}>${price}</option>
                            {/each}
                        </select>
                    </div>
                </div>
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
        min-width: 0;

        span {
            white-space: nowrap;
        }
    }

    .site-title__icon {
        width: clamp(2rem, 5vw, 3.25rem);
        height: clamp(2rem, 5vw, 3.25rem);
        flex-shrink: 0;
    }

    .header-controls {
        flex: 1 1 50%;
        display: flex;
        justify-content: flex-end;
        align-items: end;
        gap: 0.75rem;
        min-width: 0;
    }

    .utility-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.55rem 1rem;
        border: 1px solid var(--accent-border);
        border-radius: 999px;
        color: var(--text-h);
        background: var(--accent-bg);
        text-decoration: none;
        font-weight: 700;
        white-space: nowrap;
    }

    .source-picker {
        display: grid;
        gap: 0.25rem;
        justify-items: start;
        width: min(100%, 18rem);
        min-width: 0;
    }

    .source-picker__label {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--text);
    }

    .source-picker select {
        width: 100%;
        min-width: 0;
        padding: 0.55rem 2rem 0.55rem 0.8rem;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.88);
        color: var(--text-h);
        font: inherit;
    }

    .source-picker select:focus,
    .utility-link:focus {
        outline: 2px solid color-mix(in srgb, var(--accent) 35%, white);
        outline-offset: 2px;
    }

    @media (max-width: 720px) {
        .page-header {
            gap: 0.75rem;
        }

        .site-title {
            gap: 0.5rem;
        }

        .header-controls {
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .utility-link {
            display: none;
        }

        .source-picker {
            width: min(52vw, 11rem);
        }
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

    .price-range-fields {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
        align-items: center;
        gap: 0.5rem;
    }

    .price-range-fields select {
        min-width: 0;
    }

    .price-range-separator {
        font-size: 0.85rem;
        color: var(--text);
    }
</style>
