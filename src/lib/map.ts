/** Initial view of the map (latitude, longitude), currently set to Taipei, Taiwan */
export const initView: L.LatLngExpression = [25.0478, 121.5319];

/** Initial zoom level of the map. Higher values zoom in closer. */
export const initZoom = 12;

/**
 * Map tile providers. Each provider has a URL template and attribution text.
 * For more providers, see https://leaflet-extras.github.io/leaflet-providers/preview/
 */
export const providers = {
    OpenStreetMap: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
    },
    OpenStreetMapHot: {
        url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://opentopomap.org/copyright">OpenTopoMap</a> contributors',
        maxZoom: 19,
    },
    // TODO: double check T&S on https://carto.com/basemaps
    /*
    CartoLight: {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors',
    },
    CartoDark: {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
            '&copy; <a href="https://carto.com/attributions">CARTO</a> contributors',
    }
    */
};

export const provider = providers.OpenStreetMapHot;
