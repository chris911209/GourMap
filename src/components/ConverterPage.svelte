<script lang="ts">
    import { convertCsvToRestaurantDataset, type ConversionProgressEvent } from "../lib/converter";

    const csvChecklist = [
        `建議先使用<a href="https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing" target="_blank">專用 Google Sheet 範本</a>整理資料，再匯出成 <code>.csv</code>。`,
        "每列代表一位評論者對一家店的意見；「店名」、「評級」、「價位」為必填，「評論者」可留白，且「經緯度」與「地址」至少要提供一個。",
        "如果同一家店在 CSV 出現多次，轉換器會依店名加地址或座標自動合併，保留每個人的 tier 與筆記。",
        "如果缺少地址或座標，轉換器會依照 CLI 相同規則補做地理編碼；若資料都齊全則不會額外查詢。",
        "轉換後請把 JSON 放進 <code>public/data/</code>，並更新 <code>public/data/.sourcelist.json</code> 才能在地圖上載入。",
    ];

    let file = $state<File | null>(null);
    let converting = $state(false);
    let errorMessage = $state<string | null>(null);
    let progressMessage = $state<string | null>(null);
    let progressPercent = $state(0);
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
        progressPercent = 0;
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
        progressPercent = 0;
        progressMessage = "正在讀取 CSV 檔案...";
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
            progressPercent = 0;
            return `共 ${event.totalRows} 筆，準備開始轉換`;
        }

        if (event.type === "row") {
            progressPercent = Math.round((event.completedRows / event.totalRows) * 100);
            const rowLabel = event.name ? `${event.name}` : `第 ${event.rowIndex + 1} 筆`;
            return `處理中 ${event.completedRows}/${event.totalRows}: ${rowLabel}`;
        }

        progressPercent = 100;
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
        <a class="converter-back" href={homeHref}>
            <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
            <span>返回地圖</span>
        </a>
        <h1>地圖用CSV轉換器</h1>
    </section>

    <section class="converter-card">
        <details class="guide-block">
            <summary class="guide-summary">
                <span class="guide-title">
                    <span class="guide-triangle" aria-hidden="true"></span>
                    <h2>CSV 準備與載入說明</h2>
                </span>
                <span class="guide-toggle" aria-hidden="true"></span>
            </summary>
            <div class="guide-content">
                <ol class="guide-list">
                    {#each csvChecklist as item}
                        <li>{@html item}</li>
                    {/each}
                </ol>
                <p class="guide-note">
                    CLI 對應指令：<code>bun run convert:csv -- list.csv --out public/data/list.json</code>
                </p>
            </div>
        </details>

        <label class="converter-field">
            <span>CSV 檔案</span>
            <input type="file" accept=".csv,text/csv" onchange={handleFileChange} />
        </label>

        <div class="converter-actions">
            <button type="button" class="convert-button" onclick={handleConvert} disabled={!file || converting}>
                <span class="material-symbols-outlined" aria-hidden="true">play_arrow</span>
                <span>{converting ? "轉換中..." : "開始轉換"}</span>
            </button>
            {#if downloadHref}
                <a class="download-link" href={downloadHref} download={downloadName}>
                    <span class="material-symbols-outlined" aria-hidden="true">download</span>
                    <span>下載 {downloadName}</span>
                </a>
            {/if}
        </div>

        {#if progressMessage}
            <div class="status-block" aria-live="polite">
                {#if converting}
                    <div
                        class="progress-bar"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={progressPercent}
                        aria-label="CSV 轉換進度"
                    >
                        <div class="progress-fill" style:width={`${progressPercent}%`}></div>
                    </div>
                    <div class="progress-meta">
                        <strong>{progressPercent}%</strong>
                        <span>{progressMessage}</span>
                    </div>
                {:else}
                    <p class="status-message">{progressMessage}</p>
                {/if}
            </div>
        {/if}

        {#if errorMessage}
            <div class="error-message" aria-live="assertive">
                <strong>轉換失敗</strong>
                <p>{errorMessage}</p>
            </div>
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

    .converter-back {
        width: fit-content;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
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
        box-sizing: border-box;
    }

    .guide-block {
        padding: 1rem 1.1rem;
        border-radius: 1.15rem;
        background: linear-gradient(180deg, rgba(255, 244, 232, 0.95) 0%, rgba(255, 250, 245, 0.92) 100%);
        border: 1px solid rgba(255, 111, 60, 0.14);
    }

    .guide-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
        cursor: pointer;
        list-style: none;
    }

    .guide-summary::-webkit-details-marker {
        display: none;
    }

    .guide-title {
        display: inline-flex;
        align-items: center;
        gap: 0.65rem;
    }

    .guide-summary h2 {
        margin: 0;
        font-size: 1.05rem;
    }

    .guide-triangle {
        width: 0;
        height: 0;
        border-top: 0.38rem solid transparent;
        border-bottom: 0.38rem solid transparent;
        border-left: 0.55rem solid currentColor;
        color: var(--text-h);
        transition: transform 0.18s ease;
        transform-origin: 35% 50%;
    }

    .guide-block[open] .guide-triangle {
        transform: rotate(90deg);
    }

    .guide-toggle,
    .guide-note {
        color: var(--text);
        font-size: 0.95rem;
    }

    .guide-toggle {
        font-weight: 700;
        font-size: 0;
    }

    .guide-toggle::after {
        content: "展開";
        font-size: 0.95rem;
    }

    .guide-block[open] .guide-toggle::after {
        content: "收合";
    }

    .guide-content {
        display: grid;
        gap: 0.85rem;
        padding-top: 0.85rem;
    }

    .guide-list {
        margin: 0;
        padding-left: 1.35rem;
        display: grid;
        gap: 0.5rem;
        color: var(--text-h);
    }

    .guide-note {
        margin: 0;
        line-height: 1.6;
    }

    .guide-note code {
        padding: 0.15rem 0.35rem;
        border-radius: 0.4rem;
        background: rgba(8, 6, 13, 0.06);
        font-family: var(--mono);
        font-size: 0.9em;
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
        gap: 0.5rem;
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

    .status-block {
        display: grid;
        gap: 0.75rem;
    }

    .status-message,
    .error-message,
    .progress-bar,
    .progress-meta {
        padding: 0.9rem 1rem;
        border-radius: 1rem;
    }

    .status-message {
        background: rgba(255, 72, 62, 0.08);
        color: var(--text-h);
        margin: 0;
    }

    .error-message {
        background: rgba(180, 35, 24, 0.1);
        color: #b42318;
        display: grid;
        gap: 0.45rem;
    }

    .error-message strong,
    .error-message p {
        margin: 0;
    }

    .error-message p {
        white-space: pre-wrap;
        line-height: 1.6;
    }

    .progress-bar {
        position: relative;
        overflow: hidden;
        padding: 0;
        min-height: 0.9rem;
        background: rgba(8, 6, 13, 0.08);
    }

    .progress-fill {
        height: 100%;
        min-height: 0.9rem;
        border-radius: inherit;
        background: linear-gradient(90deg, #ff6f3c 0%, #ff483e 55%, #ff8b4b 100%);
        transition: width 0.2s ease;
    }

    .progress-meta {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        background: rgba(255, 72, 62, 0.08);
        color: var(--text-h);
    }

    .progress-meta strong {
        font-size: 1.05rem;
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
