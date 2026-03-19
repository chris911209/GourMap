<script lang="ts">
    import ConverterPage from "./components/ConverterPage.svelte";
    import MapPage from "./components/MapPage.svelte";

    const route = getRoute(import.meta.env.BASE_URL, window.location.pathname);

    function getRoute(baseUrl: string, pathname: string) {
        const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
        const relativePath =
            normalizedBase && pathname.startsWith(normalizedBase) ? pathname.slice(normalizedBase.length) || "/" : pathname;

        return relativePath === "/converter" ? "converter" : "map";
    }
</script>

{#if route === "converter"}
    <ConverterPage />
{:else}
    <MapPage />
{/if}
