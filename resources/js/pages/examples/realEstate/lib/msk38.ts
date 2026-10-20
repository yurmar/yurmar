import proj4 from "proj4";

// Параметры МСК-38 (Иркутская область), зоны 1–8 — система координат Гаусса-Крюгера на
// эллипсоиде Красовского, зоны шириной 3°, свой ложный сдвиг X на каждую зону.
// Источник параметров: официальные ключи перехода МСК-38 (ГОСТ 32453-2017 / приказ Росреестра),
// таблица зон terraingis.ru/msk-38.html. Проверено численно (2026-09-14): для зоны 3 обратное
// преобразование тестовых точек кадастрового участка 38:06:080607:1448 (X=413971.13, Y=3350957.87
// и соседние) даёт lon≈104.5218°, lat≈52.5447° — правдоподобная точка в Иркутском районе
// Иркутской области, координаты образуют компактный кластер в десятки метров (как и положено
// для одного земельного участка), прямое и обратное преобразование согласованы (round-trip
// расхождение <1 мм).
//
// Важно: в проекции МСК-38 российские X (от экватора, "северная" координата) и Y (местная
// восточная координата с прибавлением x_0 зоны) НЕ совпадают с порядком x/y в записи proj4 —
// нужно передавать [Y, X] в forward/inverse (проверено численно выше), а не [X, Y].
const MSK38_Y0 = -5411057.63;
const MSK38_TOWGS84 = "23.57,-140.95,-79.8,0,0.35,0.79,-0.22";

export const MSK38_ZONES = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Msk38Zone = (typeof MSK38_ZONES)[number];

function zoneDefName(zone: number): string {
    return `MSK38_ZONE_${zone}`;
}

function ensureZoneDef(zone: number): string {
    const name = zoneDefName(zone);
    if (!proj4.defs(name)) {
        const lon0 = 94.03333333333 + 3 * zone;
        const x0 = zone * 1000000 + 250000;
        proj4.defs(
            name,
            `+proj=tmerc +lat_0=0 +lon_0=${lon0} +k=1 +x_0=${x0} +y_0=${MSK38_Y0} +ellps=krass +towgs84=${MSK38_TOWGS84} +units=m +no_defs`
        );
    }
    return name;
}

/** МСК-38 (X, Y в метрах, зона zone) → WGS84 [lat, lng]. */
export function msk38ToWgs84(x: number, y: number, zone: number): [number, number] {
    const def = ensureZoneDef(zone);
    const [lon, lat] = proj4(def, "WGS84", [y, x]);
    return [lat, lon];
}

/** WGS84 [lat, lng] → МСК-38 (X, Y в метрах, зона zone). */
export function wgs84ToMsk38(lat: number, lng: number, zone: number): [number, number] {
    const def = ensureZoneDef(zone);
    const [y, x] = proj4("WGS84", def, [lng, lat]);
    return [x, y];
}

/**
 * Контур характерных точек границы участка (МСК-38) → полигон WGS84 [[lat,lng],...] для карты.
 * Замыкающая точка (совпадает с первой — так её всегда указывают в выписках ЕГРН) отбрасывается,
 * т.к. ymaps.Polygon сам замыкает контур.
 */
export function egrnPointsToPolygon(points: { x: number; y: number }[], zone: number): [number, number][] {
    let pts = points;
    if (pts.length > 1) {
        const first = pts[0];
        const last = pts[pts.length - 1];
        if (Math.abs(first.x - last.x) < 0.01 && Math.abs(first.y - last.y) < 0.01) {
            pts = pts.slice(0, -1);
        }
    }
    return pts.map((p) => msk38ToWgs84(p.x, p.y, zone));
}

export function polygonCentroid(polygon: [number, number][]): [number, number] {
    const lat = polygon.reduce((s, p) => s + p[0], 0) / polygon.length;
    const lng = polygon.reduce((s, p) => s + p[1], 0) / polygon.length;
    return [lat, lng];
}
