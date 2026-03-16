# GourMap

GourMap 是一個以 Svelte 5 和 Leaflet 製作的小型地圖應用，用來在互動式地圖上瀏覽個人整理的餐廳資料集。

靈感來自 [台北市漢堡店家排名地圖](https://hsieh-george.github.io/taipei-burger-map/)。

[English README](./README.md)

## 功能

- 從 `public/data/*.json` 載入一個或多個餐廳資料集
- 依照 tier 以不同顏色標示餐廳 marker
- 支援用行政區、標籤、tier 篩選
- Popup 會顯示備註、價位、標籤，以及 Google Maps 連結

如果要加入更多資料來源，請修改 [`src/App.svelte`](./src/App.svelte) 中的 `dataSourceFiles`。

## 本機開發

### 安裝依賴

```bash
bun install
```

### 啟動開發伺服器

```bash
bun run dev
```

## CSV 轉 JSON 流程

專案內建 [`parseData.ts`](./parseData.ts) 轉換器，可把試算表匯出的 CSV 轉成前端可直接使用的 JSON。

### 1. 準備 CSV

可先從這份 Google Sheet [範本](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing) 開始，再匯出成 CSV，命名成像 `list.csv` 這樣的檔名，並放在專案根目錄或其子目錄中。

### 2. 轉換 CSV

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

如果省略 `--out`，腳本會在原本 CSV 同目錄輸出同名的 `.json` 檔。

轉換器預設會補齊缺少座標或地址的列。如果不希望使用外部 geocoding，可加上 `--no-geocode`；這種情況下，每一列都必須已經具備轉換器所需的座標與地址資料。

### 預期 CSV 欄位

- 必填：`店名`
- 必填：`評級`
- 必填：`價位`
- 必填：`經緯度` 或 `地址`，至少其一
- 選填：`筆記`
- 選填：`標籤`
