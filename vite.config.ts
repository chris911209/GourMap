import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(() => {
    const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
    const base = process.env.GITHUB_ACTIONS === "true" && repositoryName ? `/${repositoryName}/` : "/";

    return {
        base,
        plugins: [
            svelte({
                compilerOptions: {
                    runes: true,
                },
            }),
        ],
    };
});
