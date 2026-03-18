# GourMap Restaurant Ranking Map

[繁體中文 README](./README-tw.md) [Live demo](https://dogeon188.github.io/GourMap/)

GourMap is a small interactive map app for browsing personal restaurant datasets on a map. Most of the code was written with help from Codex. The project was inspired by [Taipei Burger Map](https://hsieh-george.github.io/taipei-burger-map/).

## How do you make your own restaurant ranking map?

1. Prepare a restaurant dataset, preferably in Google Sheets, then export it as CSV.
2. Use the CSV-to-JSON converter included in this repo to turn the CSV into frontend-ready JSON, then place that JSON file in `public/data/`.
3. Update `public/data/.sourcelist.json` to include your new dataset in the available source list.
4. Deploy the project to GitHub Pages or any other static hosting service.

### 0. Environment setup

Make sure you have [Bun](https://bun.sh/) installed. Bun is used to run the converter script and manage the project dependencies. After installing Bun, open a terminal, move into the project root, and install dependencies:

```bash
bun install
```

If you want to deploy the map to GitHub Pages, you will also need Git. After installing Git, fork this repository on GitHub, then clone it locally using GitHub Desktop or any Git workflow you prefer.

### 1. Prepare the CSV

You can start from this [Google Sheets template](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing). Copy it to your own drive, add your restaurant data, then export it via `File > Download > Comma-separated values (.csv)`. Rename the file to something like `list.csv` and place it in the project root.

Column details are documented in the Google Sheets template. `店名`, `評級`, and `價位` are required. You must provide at least one of `經緯度` or `地址`. `筆記` and `標籤` are optional.

### 2. Convert the CSV

Open a terminal in the project root and run:

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

If you omit `--out`, the script will write a `.json` file next to the source CSV.

By default, the converter fills in missing coordinates or addresses where possible. If you do not want to use external geocoding, add `--no-geocode`. In that case, every row must already contain the coordinate and address data required by the converter.

### 3. Add the dataset to the source list

Open `public/data/.sourcelist.json` and add your converted JSON file to the list, for example:

```json
[
    {
        "name": "My Restaurant List",
        "path": "list.json"
    },
    {
        "name": "Example Restaurant List",
        "path": "example.json"
    }
]
```

The app reads this file at runtime and only loads one selected source at a time.

### 4. Deploy the site

After pushing the project to GitHub, open `Settings > Pages` for the repository, set the source to `GitHub Actions`, and push to the `main` branch. The GitHub Actions workflow will build and deploy the site to GitHub Pages automatically.
