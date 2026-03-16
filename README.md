# GourMap 咕嚕地圖

GourMap is a small Svelte 5 + Leaflet app for browsing a personal restaurant dataset on an interactive map.
It loads marker data from `public/data/*.json`, renders each shop as a map marker, and shows restaurant details in a popup.

The repo also includes a CSV-to-JSON converter in [`parseData.ts`](/Users/dogeon/Documents/code/js/gourmap/parseData.ts). That script turns a spreadsheet-style source file into the JSON dataset used by the frontend, and can enrich missing coordinates or addresses through ArcGIS geocoding.

## Tech stack

- Svelte 5
- Vite
- TypeScript
- Leaflet
- Bun for the CSV conversion script

## How to develop

### Requirements

- Bun is recommended for both building the web app and running the CSV converter.
- Node.js can also be used, but use it at your own risk since the project is primarily tested with Bun.

### Install dependencies

```bash
bun install
```

### Start the dev server

```bash
bun run dev
```

Vite will start a local dev server. Open the URL shown in the terminal to view the map.

## Data workflow

Convert a CSV file into the JSON format used by the app:

```bash
bun run convert:csv -- noodle2.csv --out public/data/noodle.json
```

By default, the converter will geocode rows that are missing either coordinates or an address. If every row already contains both, or if you want to forbid external geocoding, use:

```bash
bun run parseData.ts noodle2.csv --out public/data/noodle.json --no-geocode
```

### Expected CSV columns

- `店名`
- `評級`
- `價位`
- `經緯度` or `地址` or both
- Optional: `筆記`, `標籤`

If only one of `經緯度` or `地址` is provided, the converter uses ArcGIS geocoding to fill in the missing location data and writes provider attribution into the output dataset.
