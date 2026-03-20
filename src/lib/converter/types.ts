import type { Currency } from "../currency";

export type RestaurantComment = {
    username?: string;
    tier: number;
    notes?: string;
};

export type CsvRow = Record<string, string>;

export type Restaurant = {
    name: string;
    lat: number;
    lng: number;
    tier: number;
    priceBucket: number;
    address?: string;
    comments?: RestaurantComment[];
    plusCode?: string;
    tags?: string[];
};

export type RestaurantDataset = {
    $schema: string;
    currency: Currency;
    attribution?: {
        geocoding?: string;
    };
    view: {
        bounds: [[number, number], [number, number]];
    };
    items: Restaurant[];
};

export type GeocodeResult = {
    lat: number;
    lng: number;
    address: string;
    plusCode?: string;
};

export type ConversionProgressEvent =
    | {
          type: "start";
          totalRows: number;
      }
    | {
          type: "row";
          rowIndex: number;
          name: string;
          completedRows: number;
          totalRows: number;
      }
    | {
          type: "complete";
          itemCount: number;
          usedGeocoding: boolean;
      };

export type ConverterGeocoder = {
    forwardGeocode(name: string, address: string): Promise<GeocodeResult>;
    reverseGeocode(lat: number, lng: number): Promise<GeocodeResult>;
};

export type ConvertCsvOptions = {
    schemaPath?: string;
    currency?: Currency;
    geocodeDelayMs?: number;
    geocoder?: ConverterGeocoder;
    onProgress?: (event: ConversionProgressEvent) => void;
};
