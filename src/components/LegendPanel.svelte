<script lang="ts">
    import { tierColor, tierName } from "../lib/restaurants";
    import OverlayPanel from "./OverlayPanel.svelte";

    let {
        open = true,
        onOpenChange = () => {},
    }: {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    } = $props();
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
        {#each Object.entries(tierName) as [tier, label]}
            <li>
                <span class="legend-label">
                    <span class="legend-swatch" style={`background:${tierColor[Number(tier)]}`}></span>
                    <span class="legend-tier">T{tier}</span>
                </span>
                <strong>{label}</strong>
            </li>
        {/each}
    </ul>
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
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            padding: 0 0.8rem;
            background: rgba(255, 255, 255, 0.72);
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
</style>
