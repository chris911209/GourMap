import { describe, expect, it, mock } from "bun:test";
import { convertCsvToRestaurantDataset } from "./convertCsvToRestaurantDataset";
import type { ConversionProgressEvent, ConverterGeocoder } from "./types";

function createGeocoder(overrides: Partial<ConverterGeocoder> = {}): ConverterGeocoder {
    return {
        forwardGeocode: mock(async () => ({
            lat: 25.04776,
            lng: 121.51706,
            address: "100台北市中正區測試路1號",
        })),
        reverseGeocode: mock(async () => ({
            lat: 25.04776,
            lng: 121.51706,
            address: "100台北市中正區測試路1號",
        })),
        ...overrides,
    };
}

function collectProgress() {
    const events: ConversionProgressEvent[] = [];

    return {
        events,
        onProgress(event: ConversionProgressEvent) {
            events.push(event);
        },
    };
}

describe("convertCsvToRestaurantDataset", () => {
    it("omits geocoding attribution when every row already has coordinates and address", async () => {
        const csv = [
            "店名,評級,價位,經緯度,地址,評論者,標籤",
            '測試店,T3,250,"25.1,121.5",台北市中正區測試路1號,alice,"咖啡,甜點"',
        ].join("\n");

        const dataset = await convertCsvToRestaurantDataset(csv, {
            geocoder: createGeocoder(),
        });

        expect(dataset.attribution).toBeUndefined();
        expect(dataset.items).toHaveLength(1);
        expect(dataset.items[0]).toMatchObject({
            name: "測試店",
            lat: 25.1,
            lng: 121.5,
            tier: 3,
            priceBucket: 250,
            address: "台北市中正區測試路1號",
            tags: ["咖啡", "甜點"],
            comments: [{ username: "alice", tier: 3 }],
        });
        expect(dataset.view.bounds).toEqual([
            [25.1, 121.5],
            [25.1, 121.5],
        ]);
    });

    it("reverse geocodes coordinates-only rows and includes attribution", async () => {
        const csv = ["店名,評級,價位,經緯度,評論者", '座標店,T2,180,"25.04776,121.51706",alice'].join("\n");
        const geocoder = createGeocoder();

        const dataset = await convertCsvToRestaurantDataset(csv, { geocoder, geocodeDelayMs: 0 });

        expect(geocoder.reverseGeocode).toHaveBeenCalledTimes(1);
        expect(dataset.attribution?.geocoding).toContain("Esri");
        expect(dataset.items[0]?.address).toBe("100台北市中正區測試路1號");
    });

    it("forward geocodes address-only rows and includes attribution", async () => {
        const csv = ["店名,評級,價位,地址,評論者", "地址店,T4,320,台北市中正區測試路1號,alice"].join("\n");
        const geocoder = createGeocoder();

        const dataset = await convertCsvToRestaurantDataset(csv, { geocoder, geocodeDelayMs: 0 });

        expect(geocoder.forwardGeocode).toHaveBeenCalledTimes(1);
        expect(dataset.items[0]).toMatchObject({
            name: "地址店",
            lat: 25.04776,
            lng: 121.51706,
            address: "台北市中正區測試路1號",
        });
    });

    it("fails when both coordinates and address are missing", async () => {
        const csv = ["店名,評級,價位,評論者", "缺資料店,T1,100,alice"].join("\n");

        await expect(convertCsvToRestaurantDataset(csv, { geocoder: createGeocoder() })).rejects.toThrow(
            'Each row must include at least one of "經緯度" or "地址".',
        );
    });

    it("fails on empty csv", async () => {
        await expect(convertCsvToRestaurantDataset("", { geocoder: createGeocoder() })).rejects.toThrow(
            "CSV is empty.",
        );
    });

    it("fails when required fields are missing", async () => {
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n,T1,100,台北,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow('CSV line 2: Missing required field "店名".');
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n店A,,100,台北,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow('CSV line 2 (店A): Missing required field "評級".');
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n店A,T1,,台北,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow('CSV line 2 (店A): Missing required field "價位".');
    });

    it("fails on malformed coordinates, tier, and price", async () => {
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,經緯度,評論者\n店A,T1,100,abc,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow("CSV line 2 (店A): Invalid coordinates: abc");
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n店A,wrong,100,台北,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow('CSV line 2 (店A): Unable to parse tier from "wrong".');
        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n店A,T2,abc,台北,alice", {
                geocoder: createGeocoder(),
            }),
        ).rejects.toThrow('CSV line 2 (店A): Unable to parse integer for "價位" from "abc".');
    });

    it('parses any tier starting with "T7 " as the closed tier', async () => {
        const dataset = await convertCsvToRestaurantDataset(
            "店名,評級,價位,地址,評論者\n已倒閉店,T7 已倒閉,200,台北市中正區測試路1號,alice",
            { geocoder: createGeocoder(), geocodeDelayMs: 0 },
        );

        expect(dataset.items[0]).toMatchObject({
            name: "已倒閉店",
            tier: 7,
        });
    });

    it("emits start, row, and complete in order", async () => {
        const csv = ["店名,評級,價位,地址,評論者", "地址店,T4,320,台北市中正區測試路1號,alice"].join("\n");
        const geocoder = createGeocoder();
        const { events, onProgress } = collectProgress();

        await convertCsvToRestaurantDataset(csv, {
            geocoder,
            geocodeDelayMs: 0,
            onProgress,
        });

        expect(events).toEqual([
            { type: "start", totalRows: 1 },
            { type: "row", rowIndex: 0, name: "地址店", completedRows: 1, totalRows: 1 },
            { type: "complete", itemCount: 1, usedGeocoding: true },
        ]);
    });

    it("does not emit complete after a failing row", async () => {
        const csv = [
            "店名,評級,價位,地址,評論者",
            "地址店,T4,320,台北市中正區測試路1號,alice",
            "壞資料店,,320,台北,bob",
        ].join("\n");
        const { events, onProgress } = collectProgress();

        await expect(
            convertCsvToRestaurantDataset(csv, { geocoder: createGeocoder(), onProgress, geocodeDelayMs: 0 }),
        ).rejects.toThrow('Missing required field "評級".');

        expect(events).toEqual([
            { type: "start", totalRows: 2 },
            { type: "row", rowIndex: 0, name: "地址店", completedRows: 1, totalRows: 2 },
            { type: "row", rowIndex: 1, name: "壞資料店", completedRows: 2, totalRows: 2 },
        ]);
    });

    it("normalizes missing forward geocode results", async () => {
        const geocoder = createGeocoder({
            forwardGeocode: mock(async () => {
                throw new Error('Forward geocoding returned no coordinates for "台北市中正區測試路1號".');
            }),
        });

        await expect(
            convertCsvToRestaurantDataset("店名,評級,價位,地址,評論者\n地址店,T4,320,台北市中正區測試路1號,alice", {
                geocoder,
                geocodeDelayMs: 0,
            }),
        ).rejects.toThrow('Forward geocoding returned no coordinates for "台北市中正區測試路1號".');
    });

    it("preserves a Japanese address input when forward geocoding succeeds", async () => {
        const geocoder = createGeocoder({
            forwardGeocode: mock(async () => ({
                lat: 35.66549,
                lng: 139.75854,
                address: "日本〒105-0004 Tokyo, Minato City, Shinbashi, 2 Chome−5−6 2F",
            })),
        });

        const dataset = await convertCsvToRestaurantDataset(
            '店名,評級,價位,地址,評論者\n東京店,T4,450,"日本〒105-0004 Tokyo, Minato City, Shinbashi, 2 Chome−5−6 2F",alice',
            { geocoder, geocodeDelayMs: 0 },
        );

        expect(dataset.items[0]).toMatchObject({
            name: "東京店",
            lat: 35.66549,
            lng: 139.75854,
            address: "日本〒105-0004 Tokyo, Minato City, Shinbashi, 2 Chome−5−6 2F",
        });
        expect(dataset.attribution?.geocoding).toContain("Esri");
    });

    it("deduplicates repeated restaurant rows and keeps all authored comments", async () => {
        const dataset = await convertCsvToRestaurantDataset(
            [
                "店名,評級,價位,經緯度,地址,評論者,筆記,標籤",
                '老建中麵店,T2,150,"25.0291,121.5145",100 臺北市中正區泉州街39號,alice,"紅油抄手麵很強","麵食,小吃"',
                '老建中麵店,T3,150,"25.0291,121.5145",100 臺北市中正區泉州街39號,bob,"花干好吃","小吃,宵夜"',
            ].join("\n"),
            { geocoder: createGeocoder(), geocodeDelayMs: 0 },
        );

        expect(dataset.items).toHaveLength(1);
        expect(dataset.items[0]).toMatchObject({
            name: "老建中麵店",
            tier: 3,
            priceBucket: 150,
            tags: ["麵食", "小吃", "宵夜"],
            comments: [
                { username: "alice", tier: 2, notes: "紅油抄手麵很強" },
                { username: "bob", tier: 3, notes: "花干好吃" },
            ],
        });
    });

    it("marks a restaurant as controversial when duplicate reviews are far apart", async () => {
        const dataset = await convertCsvToRestaurantDataset(
            [
                "店名,評級,價位,地址,評論者",
                "爭議餐廳,T1,300,台北市中正區測試路1號,alice",
                "爭議餐廳,T5,300,台北市中正區測試路1號,bob",
            ].join("\n"),
            { geocoder: createGeocoder(), geocodeDelayMs: 0 },
        );

        expect(dataset.items).toHaveLength(1);
        expect(dataset.items[0]?.tier).toBe(8);
        expect(dataset.items[0]?.comments).toEqual([
            { username: "alice", tier: 1 },
            { username: "bob", tier: 5 },
        ]);
    });

    it("allows missing comment authors and still preserves the review", async () => {
        const dataset = await convertCsvToRestaurantDataset(
            ["店名,評級,價位,地址,評論者,筆記", "匿名餐廳,T2,180,台北市中正區測試路1號,,還不錯"].join("\n"),
            { geocoder: createGeocoder(), geocodeDelayMs: 0 },
        );

        expect(dataset.items[0]?.comments).toEqual([{ tier: 2, notes: "還不錯" }]);
    });

    it("deduplicates mixed coordinate-only and address-only rows for the same restaurant", async () => {
        const geocoder = createGeocoder({
            forwardGeocode: mock(async () => ({
                lat: 25.047761,
                lng: 121.517059,
                address: "100台北市中正區測試路1號",
            })),
            reverseGeocode: mock(async () => ({
                lat: 25.04776,
                lng: 121.51706,
                address: "台北市中正區測試路一號",
            })),
        });

        const dataset = await convertCsvToRestaurantDataset(
            [
                "店名,評級,價位,經緯度,地址,評論者,筆記",
                '混合來源店,T2,180,"25.04776,121.51706",,alice,座標來源',
                "混合來源店,T3,180,,100台北市中正區測試路1號,bob,地址來源",
            ].join("\n"),
            { geocoder, geocodeDelayMs: 0 },
        );

        expect(dataset.items).toHaveLength(1);
        expect(dataset.items[0]?.comments).toEqual([
            { username: "alice", tier: 2, notes: "座標來源" },
            { username: "bob", tier: 3, notes: "地址來源" },
        ]);
    });

    it("fails when duplicate restaurant rows disagree on price bucket", async () => {
        await expect(
            convertCsvToRestaurantDataset(
                [
                    "店名,評級,價位,地址,評論者",
                    "衝突餐廳,T2,180,台北市中正區測試路1號,alice",
                    "衝突餐廳,T2,250,台北市中正區測試路1號,bob",
                ].join("\n"),
                { geocoder: createGeocoder(), geocodeDelayMs: 0 },
            ),
        ).rejects.toThrow('Conflicting values for "價位" across duplicate restaurant rows.');
    });
});
