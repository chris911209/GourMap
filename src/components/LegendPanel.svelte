<script lang="ts">
    import { CLOSED_TIER, CONTROVERSIAL_TIER, tierBadge, tierColor, tierName } from "../lib/restaurants";
    import OverlayPanel from "./OverlayPanel.svelte";

    const converterHref = `${import.meta.env.BASE_URL}converter`;

    let {
        open = true,
        onOpenChange = () => {},
        selectedTier = "all",
        onTierSelect = () => {},
    }: {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        selectedTier?: string;
        onTierSelect?: (tier: string) => void;
    } = $props();

    const legendTiers = Object.keys(tierName)
        .map(Number)
        .sort((left, right) => {
            if (left === CONTROVERSIAL_TIER && right === CLOSED_TIER) {
                return -1;
            }

            if (left === CLOSED_TIER && right === CONTROVERSIAL_TIER) {
                return 1;
            }

            return left - right;
        });
</script>

<OverlayPanel
    {open}
    {onOpenChange}
    title="圖例"
    side="right"
    hiddenIcon="info"
    panelId="tier-legend"
    openLabel="展開圖例"
    closeLabel="收起圖例"
>
    <ul class="legend-list">
        {#each legendTiers as tier (tier)}
            <li>
                <button
                    class:active={selectedTier === String(tier)}
                    class="legend-button"
                    type="button"
                    onclick={() => onTierSelect(String(tier))}
                >
                    <span class="legend-label">
                        <span class="legend-swatch" style={`background:${tierColor[tier]}`}></span>
                        <span class="legend-tier">{tierBadge(tier)}</span>
                    </span>
                    <strong>{tierName[tier]}</strong>
                </button>
            </li>
        {/each}
    </ul>

    <div class="legend-links">
        <a class="legend-source-link" href="https://github.com/chris911209/GourMap" target="_blank" rel="noreferrer">
            <img class="legend-source-link__icon" src={`${import.meta.env.BASE_URL}github.png`} alt="" aria-hidden="true" />
            <span>Source code</span>
        </a>

        <a class="legend-source-link" href={converterHref}>
            <span class="material-symbols-outlined legend-source-link__material-icon" aria-hidden="true">sync_alt</span>
            <span>CSV 轉換器</span>
        </a>
    </div>
</OverlayPanel>

<style lang="scss">
    .legend-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.3rem;
        font-size: 0.8rem;

        li {
            margin: 0;
        }
    }

    .legend-button {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.45rem 0.8rem;
        border: none;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.72);
        color: inherit;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition:
            background-color 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;

        &:hover {
            background: color-mix(in srgb, var(--accent) 10%, white);
        }
        
        &.active {
            background: color-mix(in srgb, var(--accent) 18%, white);
            color: var(--text-h);
        }

        &:focus-visible {
            outline: 2px solid color-mix(in srgb, var(--accent) 35%, white);
            outline-offset: 2px;
        }
    }

    .legend-label {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
    }

    .legend-swatch {
        width: 0.9rem;
        height: 0.9rem;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7);
        flex: 0 0 auto;
    }

    .legend-tier {
        font-size: 0.8rem;
        color: var(--text);
    }

    .legend-links {
        margin-top: 0.75rem;
        display: grid;
        gap: 0.45rem;
    }

    .legend-source-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
    }

    .legend-source-link:hover {
        text-decoration: underline;
    }

    .legend-source-link__icon {
        width: 1rem;
        height: 1rem;
        object-fit: contain;
        flex-shrink: 0;
    }

    .legend-source-link__material-icon {
        font-size: 1rem;
        line-height: 1;
    }
</style>
