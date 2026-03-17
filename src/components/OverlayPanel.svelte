<script lang="ts">
    import type { Snippet } from "svelte";

    type Side = "left" | "right";

    let {
        title,
        side = "left",
        open = true,
        panelId,
        openLabel,
        closeLabel,
        hiddenIcon,
        children,
        onOpenChange = () => {},
    }: {
        title: string;
        side?: Side;
        open?: boolean;
        panelId: string;
        openLabel: string;
        closeLabel: string;
        hiddenIcon?: string;
        children: Snippet;
        onOpenChange?: (open: boolean) => void;
    } = $props();
</script>

<section class:overlay-panel={open} class:overlay-handle={!open} class:right={side === "right"}>
    {#if open}
        <button
            class="overlay-toggle"
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={closeLabel}
            onclick={() => onOpenChange(false)}
        >
            <span>{title}</span>
            <span class="material-symbols-outlined overlay-toggle-icon" aria-hidden="true">
                {side === "left" ? "left_panel_close" : "right_panel_close"}
            </span>
        </button>

        <div class="overlay-content" id={panelId}>
            {@render children()}
        </div>
    {:else}
        <button
            class="overlay-grabber"
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={openLabel}
            onclick={() => onOpenChange(true)}
        >
            <span class="material-symbols-outlined" aria-hidden="true">
                {hiddenIcon ?? (side === "left" ? "left_panel_open" : "right_panel_open")}
            </span>
        </button>
    {/if}
</section>

<style lang="scss">
    .overlay-panel {
        position: absolute;
        bottom: 1rem;
        left: 1rem;
        z-index: 500;
        border: 1px solid var(--border);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: var(--shadow);
        overflow: hidden;

        &.right {
            left: auto;
            right: 1rem;
        }
    }

    .overlay-handle {
        position: absolute;
        bottom: 1rem;
        left: 0;
        z-index: 500;
        transform: translateY(-50%);

        &.right {
            left: auto;
            right: 0;
        }
    }

    .overlay-toggle {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.85rem 1rem;
        border: none;
        background: transparent;
        color: var(--text-h);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }

    .overlay-toggle-icon {
        font-size: 1.1rem;
        color: var(--accent);
    }

    .overlay-grabber {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 3.5rem;
        border: 1px solid var(--border);
        border-left: 0;
        border-radius: 0 1rem 1rem 0;
        background: rgba(255, 255, 255, 0.94);
        color: var(--accent);
        box-shadow: var(--shadow);
        cursor: pointer;

        .right & {
            border-left: 1px solid var(--border);
            border-right: 0;
            border-radius: 1rem 0 0 1rem;
        }

        .material-symbols-outlined {
            font-size: 1.2rem;
            line-height: 1;
        }
    }

    .overlay-content {
        padding: 0 1rem 1rem;
    }

    @media (max-width: 640px) {
        .overlay-panel {
            bottom: 1rem;
            left: 0.75rem;

            &.right {
                left: auto;
                right: 0.75rem;
            }
        }

        .overlay-handle {
            top: auto;
            bottom: 1rem;
            transform: none;
        }

        .overlay-grabber {
            height: 3.25rem;
        }
    }
</style>
