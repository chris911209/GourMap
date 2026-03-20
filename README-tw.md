# GourMap 餐廳排行地圖

[English README](./README.md) [展示連結](https://dogeon188.github.io/GourMap/)

GourMap 是一個小型地圖應用，用來在互動式地圖上瀏覽個人整理的餐廳資料集。大部分程式撰寫由 Codex 協助完成。靈感來自 [台北市漢堡店家排名地圖](https://hsieh-george.github.io/taipei-burger-map/)。

## 如何製作你自己的餐廳排行地圖？

1. 把本專案 Fork 到自己的 GitHub 帳號下
2. 準備餐廳資料集，建議使用 Google Sheet 試算表，並匯出成 CSV
3. 使用本專案提供的 CSV 轉 JSON 轉換器，把 CSV 轉成前端可直接使用的JSON；把轉換後的 JSON 放在 `public/data/` 目錄下
4. 修改 `public/data/.sourcelist.json`，把你的 JSON 加入資料來源列表

### 1. 部署 GitHub 專案

在 GitHub 上找到這個專案，點擊右上角的「Fork」按鈕，把專案複製到自己的帳號下。

如果你想要將地圖部署到 GitHub Pages，在 GitHub 上建立本專案的分支（Fork），然後在你自己的專案頁面上點擊「Settings」>「Pages」，選擇「GitHub Actions」作為部署來源，並確保你的專案有一個 `main` 分支。GitHub Actions 會自動構建並部署網站到 GitHub Pages。一般來說，部署完成後，你的網站會在 `https://{你的 GitHub 用戶名}.github.io/{專案名稱}/` 這個 URL 上可以訪問。

### 2. 準備 CSV

可先從這份 [Google Sheet 範本](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing) 開始，複製到自己的雲端硬碟後，添加你自己的餐廳資料。完成後，點擊「檔案」>「下載」>「逗號分隔值 (.csv)」以匯出成 CSV，重新命名為如 `list.csv` 這樣的檔名，並放在本專案的主資料夾中。

各個欄位的說明可以參考 Google Sheet 範本中的說明文字，其中「店名」、「評級」、「價位」為必填欄位；「經緯度」或「地址」至少要有一個；「筆記」和「標籤」為選填欄位。

如果某家餐廳只有一則評論（例如只有你一個人的評論），地圖上的詳細資訊可以使用單一評論的排版；如果你的地圖會有很多人一起共編，每個人會有不同的評語，則可以改用新版的評論卡片樣式。這個行為由 `src/components/MarkerPopup.svelte` 裡的 `ALWAYS_USE_COMMENT_CARD` 控制。設成 `false` 會維持原本的內嵌樣式，設成 `true` 則即使只有一則評論也會包成卡片顯示。

### 3. 轉換 CSV

前往 [專用 CSV 轉換器](https://dogeon188.github.io/GourMap/converter)，上傳剛剛下載的 CSV 檔，轉換器會把它轉成前端可直接使用的 JSON 格式。轉換完成後，點擊「下載 JSON」按鈕，把 JSON 檔下載到本地，然後把它放在 `public/data/` 目錄下。（可以透過 GitHub 網頁介面直接上傳，或是從本地使用 Git 命令行工具提交到 GitHub。）

需注意，上面的轉換器連結是原作者 Dogeon188 的部署版本，如果你是從這個專案 Fork 的，請使用你自己部署的轉換器版本，確保格式兼容。如果你已經按照前面的步驟 Fork 並部署了專案，那麼轉換器的 URL 應該是 `https://{你的 GitHub 用戶名}.github.io/{專案名稱}/converter`。

如果比較習慣使用命令列工具，可以使用專案提供的 CSV 轉 JSON 轉換器腳本。打開終端機，切換到專案主資料夾，執行以下指令：

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

### 4. 加入資料來源列表

打開 `public/data/.sourcelist.json`，把剛剛轉換好的 JSON 檔加入列表中，其中 `name` 是你想要顯示在網站上的清單名稱，`path` 是 JSON 檔相對於 `public/data/` 的路徑。例如：

```json
[
    {
        "name": "我的餐廳清單1",
        "path": "list.json"
    },
    {
        "name": "範例餐廳清單2",
        "path": "example.json"
    }
]
```

## 如何將專案更新至最新版？

原作者會不定期更新專案，加入新功能或修復問題。如果你想要把這些更新合併到你的 Fork 中，可以按照以下步驟操作：

1. 在 GitHub 上打開你的專案頁面
2. 點擊「Sync Fork」按鈕，然後選擇「Update branch」。這樣 GitHub 會自動把原作者的最新提交合併到你的 Fork 中。
3. 如果有衝突，GitHub 會提示你手動解決衝突。你需要打開衝突的檔案，根據提示修改內容，然後提交解決衝突的版本。