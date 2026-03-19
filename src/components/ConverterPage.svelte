<script lang="ts">
    import { convertCsvToRestaurantDataset, type ConversionProgressEvent } from "../lib/converter";

    let file = $state<File | null>(null);
    let converting = $state(false);
    let errorMessage = $state<string | null>(null);
    let progressMessage = $state<string | null>(null);
    let outputText = $state("");
    let downloadHref = $state<string | null>(null);
    let downloadName = $state("converted.json");

    const homeHref = import.meta.env.BASE_URL;

    $effect(() => {
        document.title = "GourMap CSV 轉換器";
    });

    $effect(() => {
        if (!outputText) {
            downloadHref = null;
            return;
        }

        const objectUrl = URL.createObjectURL(new Blob([outputText], { type: "application/json" }));
        downloadHref = objectUrl;

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    });

    function handleFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        file = input.files?.[0] ?? null;
        outputText = "";
        downloadHref = null;
        errorMessage = null;
        progressMessage = file ? `已選擇 ${file.name}` : null;
        downloadName = getOutputFileName(file?.name);
    }

    async function handleConvert() {
        if (!file || converting) {
            return;
        }

        converting = true;
        errorMessage = null;
        outputText = "";
        downloadName = getOutputFileName(file.name);

        try {
            const csvText = await file.text();
            const dataset = await convertCsvToRestaurantDataset(csvText, {
                onProgress(event: ConversionProgressEvent) {
                    progressMessage = formatProgress(event);
                },
            });

            outputText = `${JSON.stringify(dataset, null, 4)}\n`;
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : String(error);
        } finally {
            converting = false;
        }
    }

    function formatProgress(event: ConversionProgressEvent) {
        if (event.type === "start") {
            return `共 ${event.totalRows} 筆，準備開始轉換`;
        }

        if (event.type === "row") {
            return `處理第 ${event.rowIndex + 1} 筆: ${event.name}`;
        }

        return event.usedGeocoding
            ? `完成 ${event.itemCount} 筆，已包含地理編碼授權資訊`
            : `完成 ${event.itemCount} 筆，未使用地理編碼`;
    }

    function getOutputFileName(inputName?: string) {
        if (!inputName) {
            return "converted.json";
        }

        const stripped = inputName.replace(/\.[^.]+$/, "");
        return `${stripped || inputName}.json`;
    }
</script>

<main class="converter-page">
    <section class="converter-hero">
        <a class="converter-back" href={homeHref}>返回地圖</a>
        <h1>地圖用CSV轉換器</h1>
        <p class="converter-intro">
            上傳 CSV 後直接在瀏覽器執行與 CLI 同步的轉換流程。缺少地址或座標時，會依相同規則觸發地理編碼。
        </p>
    </section>

    <section class="converter-card">
        <label class="converter-field">
            <span>CSV 檔案</span>
            <input type="file" accept=".csv,text/csv" onchange={handleFileChange} />
        </label>

        <div class="converter-actions">
            <button type="button" class="convert-button" onclick={handleConvert} disabled={!file || converting}>
                {converting ? "轉換中..." : "開始轉換"}
            </button>
            {#if downloadHref}
                <a class="download-link" href={downloadHref} download={downloadName}>下載 {downloadName}</a>
            {/if}
        </div>

        {#if progressMessage}
            <p class="status-message">{progressMessage}</p>
        {/if}

        {#if errorMessage}
            <p class="error-message">{errorMessage}</p>
        {/if}

        <div class="preview-block">
            <div class="preview-header">
                <h2>JSON 預覽</h2>
                <span>{outputText ? downloadName : "尚未產生輸出"}</span>
            </div>
            <textarea
                class="preview-output"
                readonly
                placeholder="轉換完成後，這裡會顯示格式化 JSON。"
                value={outputText}
            ></textarea>
        </div>
    </section>
</main>

<style lang="scss">
    .converter-page {
        min-height: 100vh;
        padding: clamp(1rem, 3vw, 2rem);
        background:
            radial-gradient(circle at top left, rgba(255, 72, 62, 0.14), transparent 28%),
            linear-gradient(180deg, #fffaf2 0%, #fff 48%, #f6f1e8 100%);
        display: grid;
        gap: 1.5rem;
    }

    .converter-hero,
    .converter-card {
        width: min(100%, 960px);
        margin: 0 auto;
    }

    .converter-hero {
        display: grid;
        gap: 0.75rem;
        padding-top: clamp(1rem, 3vw, 2rem);
    }
    
    .converter-intro {
        max-width: 42rem;
        color: var(--text-h);
    }

    .converter-back {
        width: fit-content;
        color: var(--text-h);
        font-weight: 700;
        text-decoration: none;
        border-bottom: 2px solid rgba(8, 6, 13, 0.12);
    }

    .converter-card {
        display: grid;
        gap: 1.25rem;
        padding: clamp(1rem, 3vw, 1.75rem);
        border: 1px solid rgba(8, 6, 13, 0.08);
        border-radius: 1.5rem;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: var(--shadow);
        backdrop-filter: blur(12px);
    }

    .converter-field {
        display: grid;
        gap: 0.4rem;
        color: var(--text-h);
        font-weight: 700;
    }

    .converter-field input {
        padding: 0.85rem;
        border: 1px dashed rgba(8, 6, 13, 0.18);
        border-radius: 1rem;
        background: rgba(255, 250, 242, 0.95);
        font: inherit;
        color: var(--text-h);
    }

    .converter-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .convert-button,
    .download-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.9rem;
        padding: 0 1.15rem;
        border-radius: 999px;
        font: inherit;
        font-weight: 800;
        text-decoration: none;
    }

    .convert-button {
        border: none;
        color: white;
        background: linear-gradient(135deg, #ff6f3c 0%, #ff483e 100%);
        cursor: pointer;
        box-shadow: 0 10px 22px rgba(255, 72, 62, 0.22);
    }

    .convert-button:disabled {
        cursor: not-allowed;
        opacity: 0.6;
        box-shadow: none;
    }

    .download-link {
        border: 1px solid rgba(8, 6, 13, 0.12);
        color: var(--text-h);
        background: white;
    }

    .status-message,
    .error-message {
        padding: 0.9rem 1rem;
        border-radius: 1rem;
    }

    .status-message {
        background: rgba(255, 72, 62, 0.08);
        color: var(--text-h);
    }

    .error-message {
        background: rgba(180, 35, 24, 0.1);
        color: #b42318;
    }

    .preview-block {
        display: grid;
        gap: 0.75rem;
    }

    .preview-header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .preview-header h2 {
        margin: 0;
    }

    .preview-header span {
        font-size: 0.9rem;
        color: var(--text);
    }

    .preview-output {
        width: 100%;
        min-height: min(58vh, 32rem);
        padding: 1rem;
        border: 1px solid rgba(8, 6, 13, 0.08);
        border-radius: 1rem;
        background: #201c25;
        color: #f9f4eb;
        font: 0.9rem/1.5 var(--mono);
        resize: vertical;
        box-sizing: border-box;
    }

    .converter-field input:focus,
    .convert-button:focus,
    .download-link:focus,
    .converter-back:focus,
    .preview-output:focus {
        outline: 2px solid color-mix(in srgb, var(--accent) 35%, white);
        outline-offset: 2px;
    }

    @media (max-width: 720px) {
        .converter-page {
            padding: 1rem;
        }

        .preview-output {
            min-height: 20rem;
        }
    }
</style>
