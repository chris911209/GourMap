<script lang="ts">
    import { tierName, type Restaurant } from "../lib/restaurants";

    let { restaurant } = $props<{ restaurant: Restaurant }>();
</script>

<header class="popup-header">
    <h3 class="popup-title">{restaurant.name}</h3>
</header>

<div class="meta-grid">
    <div class="meta-item meta-item-tier">
        <span class="material-symbols-outlined">workspace_premium</span>
        <div class="meta-copy">
            <span class="meta-label">評級</span>
            <strong class="meta-value">{tierName[restaurant.tier]}</strong>
        </div>
    </div>

    <div class="meta-item">
        <span class="material-symbols-outlined">payments</span>
        <div class="meta-copy">
            <span class="meta-label">價位</span>
            <strong class="meta-value">${restaurant.priceBucket}</strong>
        </div>
    </div>
</div>

{#if restaurant.tags && restaurant.tags.length > 0}
    <div class="tag-row" aria-label="Tags">
        {#each restaurant.tags as tag}
            <span class="tag">{tag}</span>
        {/each}
    </div>
{/if}

{#if restaurant.notes}
    <section class="notes">
        <span class="meta-label">Notes</span>
        <p>{restaurant.notes}</p>
    </section>
{/if}

<!-- 在 google 地圖開啟 -->
{#if restaurant.address}
    <button
        class="map-button"
        onclick={() =>
            window.open(
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`,
                "_blank",
            )}
    >
        <span class="material-symbols-outlined">place</span>
        <span>Google 地圖導航</span>
    </button>
{/if}

<!-- </div> -->

<style lang="scss">
    .popup-header {
        margin-bottom: 0.8rem;
    }

    .popup-title {
        margin: 0 0 0.2rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--accent);
    }

    h3 {
        margin: 0;
        font-size: 1.1rem;
        line-height: 1.2;
        font-weight: 700;
        color: var(--text-h);
    }

    .meta-grid {
        display: grid;
        grid-template-columns: minmax(9.5rem, 1.3fr) minmax(7rem, 1fr);
        gap: 0.65rem;
    }

    .meta-item {
        display: flex;
        gap: 0.55rem;
        justify-content: flex-start;
        align-items: center;
        padding: 0.75rem 0.8rem;
        min-width: 0;
        border: 1px solid var(--border);
        border-radius: 0.9rem;
        background: linear-gradient(-45deg, color-mix(in srgb, var(--bg) 92%, rgb(192, 192, 192)), var(--bg));

        .material-symbols-outlined {
            flex: 0 0 auto;
            font-size: 1rem;
            line-height: 1;
            margin-top: 0.15rem;
            color: var(--accent);
        }
    }

    .meta-copy {
        min-width: 0;
        flex: 1 1 auto;
    }

    .meta-label {
        display: block;
        margin-bottom: 0.1rem;
        font-size: 0.5rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text);
    }

    .meta-value {
        display: block;
        font-size: 0.92rem;
        line-height: 1.25;
        white-space: normal;
        word-break: keep-all;
        overflow-wrap: anywhere;
    }

    @media (max-width: 360px) {
        .meta-grid {
            grid-template-columns: 1fr;
        }

        .meta-item-tier {
            min-width: 0;
        }
    }

    .tag-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.8rem;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        min-height: 1.4rem;
        padding: 0 0.65rem;
        border-radius: 999px;
        background: var(--accent-bg);
        border: 1px solid var(--accent-border);
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--accent);
    }

    .notes {
        margin-top: 0.85rem;
        padding-top: 0.8rem;
        border-top: 1px solid var(--border);

        p {
            margin: 0;
            font-size: 0.7rem;
            line-height: 1.5;
            color: var(--text);
            white-space: pre-wrap;
        }
    }

    .map-button {
        margin-top: 0.8rem;
        display: flex;
        margin-left: auto;
        margin-right: auto;
        align-items: center;
        gap: 0.3rem;
        padding: 0.5rem 0.75rem;
        border: none;
        border-radius: 0.6rem;
        background: var(--accent);
        color: #fff;
        font-size: 0.6rem;
        font-weight: 700;
        cursor: pointer;

        .material-symbols-outlined {
            font-size: 0.8rem;
            line-height: 1;
            margin-top: 0.15rem;
        }
    }
</style>
