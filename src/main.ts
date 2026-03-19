import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";

restoreRedirectedPath(import.meta.env.BASE_URL);

const app = mount(App, {
    target: document.getElementById("app")!,
});

export default app;

function restoreRedirectedPath(baseUrl: string) {
    const url = new URL(window.location.href);
    const redirectedTarget = url.searchParams.get("p");

    if (!redirectedTarget) {
        return;
    }

    const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const targetPath = redirectedTarget.startsWith("/") ? redirectedTarget : `/${redirectedTarget}`;
    const finalUrl = `${normalizedBase}${targetPath}` || "/";

    window.history.replaceState(null, "", finalUrl);
}
