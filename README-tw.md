# GourMap 餐廳排行地圖

[English README](./README.md) [展示連結](https://dogeon188.github.io/GourMap/)

GourMap 是一個小型地圖應用，用來在互動式地圖上瀏覽個人整理的餐廳資料集。大部分程式撰寫由 Codex 協助完成。靈感來自 [台北市漢堡店家排名地圖](https://hsieh-george.github.io/taipei-burger-map/)。

## 如何製作你自己的餐廳排行地圖？

1. 準備餐廳資料集，建議使用 Google Sheet 試算表，並匯出成 CSV
2. 使用本專案提供的 CSV 轉 JSON 轉換器，把 CSV 轉成前端可直接使用的 JSON；把轉換後的 JSON 放在 `public/data/` 目錄下
3. 修改 `public/data/.sourcelist.json`，把你的 JSON 加入資料來源列表
4. 把專案部署到 GitHub Pages 或其他靜態網站託管服務上

### 0. 安裝環境

確保你已經安裝了 [Bun](https://bun.sh/)，這是用來執行轉換器腳本的 JavaScript 執行環境。安裝好 Bun 後，打開終端機，切換到專案主資料夾，執行以下指令來安裝專案依賴：

```bash
bun install
```

如果你想要將地圖部署到 GitHub Pages，還需要安裝 Git。安裝好 Git 後，在 GitHub 上建立本專案的分支（Fork），然後在專案頁面點擊「Code」>「Open with GitHub Desktop」或其他你習慣的方式來把專案複製到本地。

### 1. 準備 CSV

可先從這份 [Google Sheet 範本](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing) 開始，複製到自己的雲端硬碟後，添加你自己的餐廳資料。完成後，點擊「檔案」>「下載」>「逗號分隔值 (.csv)」以匯出成 CSV，重新命名為如 `list.csv` 這樣的檔名，並放在本專案的主資料夾中。

各個欄位的說明可以參考 Google Sheet 範本中的說明文字，其中「店名」、「評級」、「價位」為必填欄位；「經緯度」或「地址」至少要有一個；「筆記」和「標籤」為選填欄位。

### 2. 轉換 CSV

打開終端機，切換到專案主資料夾，執行以下指令：

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

如果省略 `--out`，腳本會在原本 CSV 同目錄輸出同名的 `.json` 檔。

轉換器預設會補齊缺少座標或地址的列。如果不希望使用外部的座標轉換，可加上 `--no-geocode`；這種情況下，每一列都必須已經具備轉換器所需的座標與地址資料。

### 3. 加入資料來源列表

打開 `public/data/.sourcelist.json`，把剛剛轉換好的 JSON 檔加入列表中，例如：

```json
[
    {
        "name": "我的餐廳清單",
        "path": "list.json"
    },
    {
        "name": "範例餐廳清單",
        "path": "example.json"
    }
]
```

### 4. 部署網站

將專案推送到 GitHub 後，進入該專案的「設定」>「Pages」，在「來源」選擇「GitHub Actions」，然後推送到 `main` 分支。GitHub Actions 會自動構建並部署網站到 GitHub Pages。
