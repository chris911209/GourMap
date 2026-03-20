# GourMap Restaurant Ranking Map

[繁體中文 README](./README-tw.md) [Live demo](https://dogeon188.github.io/GourMap/)

GourMap is a small interactive map app for browsing personal restaurant datasets on a map. Most of the code was written with help from Codex. The project was inspired by [Taipei Burger Map](https://hsieh-george.github.io/taipei-burger-map/).

## How do you make your own restaurant ranking map?

1. Fork this project to your own GitHub account.
2. Prepare a restaurant dataset, preferably in Google Sheets, then export it as CSV.
3. Use the CSV-to-JSON converter included in this repo to turn the CSV into frontend-ready JSON, then place that JSON file in `public/data/`.
4. Update `public/data/.sourcelist.json` to include your new dataset in the available source list.

### 1. Deploy the GitHub project

Find this project on GitHub and click the `Fork` button in the top-right corner to copy it into your own account.

If you want to deploy the map to GitHub Pages, open your forked repository on GitHub, go to `Settings > Pages`, choose `GitHub Actions` as the deployment source, and make sure your repository has a `main` branch. GitHub Actions will then build and deploy the site automatically. In most cases, the site will be available at `https://{your-github-username}.github.io/{repo-name}/`.

### 2. Prepare the CSV

You can start from this [Google Sheets template](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing). Copy it to your own drive, add your restaurant data, then export it via `File > Download > Comma-separated values (.csv)`. Rename the file to something like `list.csv` and place it in the project root.

Column details are documented in the Google Sheets template. `店名`, `評級`, and `價位` are required. You must provide at least one of `經緯度` or `地址`. `筆記` and `標籤` are optional.

If a restaurant only has one comment, for example when the map is just your own personal list, the popup can use the simpler single-comment layout. If your map is shared and edited by multiple people with different opinions, you can switch to the newer comment card UI instead. This is controlled by `WRAP_SINGLE_COMMENT_IN_CARD` in `src/components/MarkerPopup.svelte`. Set it to `false` to keep the original inline layout, or `true` to wrap even a single comment in a card.

### 3. Convert the CSV

Open the dedicated CSV converter at [https://dogeon188.github.io/GourMap/converter](https://dogeon188.github.io/GourMap/converter), upload the CSV you just exported, and it will generate a frontend-ready JSON file for you. After conversion, click `Download JSON`, then place the file into `public/data/`. You can upload it through the GitHub web UI or commit it locally with Git.

Note that the converter link above is the original deployed version from Dogeon188. If you fork this project, you should use your own deployed converter so the format stays in sync with your version of the code. If you have already forked and deployed the project, your converter URL should be `https://{your-github-username}.github.io/{repo-name}/converter`.

If you prefer using the command line, open a terminal in the project root and run:

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

### 4. Add the dataset to the source list

Open `public/data/.sourcelist.json` and add your converted JSON file to the list. Here, `name` is the label shown on the website, and `path` is the JSON file path relative to `public/data/`. For example:

```json
[
    {
        "name": "My Restaurant List 1",
        "path": "list.json"
    },
    {
        "name": "Example Restaurant List 2",
        "path": "example.json"
    }
]
```

## How to update your fork to the latest version?

The original author may update this project from time to time with new features or bug fixes. If you want to merge those updates into your own fork, you can follow these steps:

1. Open your forked repository on GitHub.
2. Click `Sync fork`, then choose `Update branch`. GitHub will automatically merge the latest commits from the original repository into your fork.
3. If there are conflicts, GitHub will ask you to resolve them manually. Open the conflicting files, update them as needed, and commit the resolved version.