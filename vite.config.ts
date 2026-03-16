import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        paraglideVitePlugin({
            project: "./project.inlang",
            outdir: "./src/paraglide",
        }),
        svelte({
            compilerOptions: {
                runes: true,
            },
        }),
    ],
});
