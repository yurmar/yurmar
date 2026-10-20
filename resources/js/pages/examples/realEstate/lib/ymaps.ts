/** Минимальные типы Yandex Maps JS API 2.1 — только то, что используют карты gov-property. */
type Coord = [number, number];
type Handler = () => void;

export interface YEvents {
    add(type: string, handler: Handler): void;
}

export interface YOverlay {
    events: YEvents;
}

export interface YGeoObject<C> extends YOverlay {
    geometry: {
        events: YEvents;
        getCoordinates(): C;
        setCoordinates(coords: C): void;
    };
    editor: { startEditing(): void; stopDrawing(): void; startDrawing(): void };
    balloon: { open(): void };
}

export interface YMap {
    geoObjects: {
        add(obj: YOverlay): void;
        remove(obj: YOverlay): void;
        removeAll(): void;
        getBounds(): unknown;
    };
    setBounds(bounds: unknown, options: { checkZoomRange?: boolean; zoomMargin?: number }): void;
    setCenter(center: Coord, zoom?: number, options?: { duration?: number }): void;
    getZoom(): number;
    destroy(): void;
}

export interface YMapsApi {
    ready(cb: Handler): void;
    Map: new (el: HTMLElement, state: { center: Coord; zoom: number; controls?: string[] }) => YMap;
    Placemark: new (coords: Coord, properties: Record<string, unknown>, options: Record<string, unknown>) => YGeoObject<Coord>;
    Polygon: new (coords: Coord[][], properties: Record<string, unknown>, options: Record<string, unknown>) => YGeoObject<Coord[][]>;
}

declare global {
    interface Window {
        ymaps?: YMapsApi;
    }
}
