# GourMap

GourMap is a small Svelte 5 + Leaflet app for browsing a personal restaurant dataset on an interactive map.

Inspired by [Taipei Burger Map](https://hsieh-george.github.io/taipei-burger-map/).

[繁體中文說明](./README-tw.md)

## What it does

- Loads one or more restaurant datasets from `public/data/*.json`
- Renders each restaurant as a color-coded marker based on tier
- Supports filtering by district, tag, and tier
- Shows popup details including notes, price bucket, tags, and a Google Maps link

If you want to add more sources, update `dataSourceFiles` in [`src/App.svelte`](./src/App.svelte).

## Tech stack

- Svelte 5
- Vite
- TypeScript
- Leaflet
- Bun for package management and the CSV conversion workflow

## Local development

### Requirements

- Bun is the primary runtime used in this repo
- Node.js may work for the frontend, but the data conversion script is written for Bun

### Install dependencies

```bash
bun install
```

### Start the dev server

```bash
bun run dev
```

## CSV to JSON workflow

The repo includes a converter in [`parseData.ts`](./parseData.ts) for turning spreadsheet exports into app-ready JSON.

### 1. Prepare the CSV

Start from a Google Sheet such as this [template](https://docs.google.com/spreadsheets/d/1mGLvi3M9-5V9HhEXjmIzgJdwr2YWqURBffiKIiwnI-Y/edit?usp=sharing), then export it as CSV, name it something like `list.csv`, and place it in the project root or a subdirectory.

### 2. Convert the CSV

```bash
bun run convert:csv -- list.csv --out public/data/list.json
```

If `--out` is omitted, the script writes a `.json` file next to the source CSV.

By default, the converter enriches rows that are missing either coordinates or an address. To forbid external geocoding, use `--no-geocode`, then every row must already contain both coordinates and address data where required by the converter.

### Expected CSV columns

- Required: `店名`
- Required: `評級`
- Required: `價位`
- Required: at least one of `經緯度` or `地址`
- Optional: `筆記`
- Optional: `標籤`

## Project structure

```text
src/
  App.svelte                  Main app and dataset loading
  components/                 Popup and overlay UI
  lib/restaurants.ts          Restaurant types and tier metadata
  lib/map.ts                  Map defaults and tile provider config
public/data/
  *.json                      Restaurant datasets
  restaurants.schema.json     Dataset schema
parseData.ts                  CSV-to-JSON converter
```
