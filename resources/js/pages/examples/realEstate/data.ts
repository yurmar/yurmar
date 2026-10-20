import { wgs84ToMsk38 } from './lib/msk38'

// ── Вымышленная организация ──────────────────────────────────────────────
// Торговая сеть «Северный ветер». Все объекты, адреса, кадастровые номера
// и выписки вымышлены — интерактивный пример раздела «Реестр недвижимости».
// Объекты размещены на карте произвольно и не соответствуют реальным зданиям.

export type Status = 'in_use' | 'reconstruction' | 'vacant'
export type Polygon = [number, number][] // [lat, lng]

export interface PropertyObject {
    id: number
    name: string
    cadastral_number: string | null
    address: string
    lat: number
    lng: number
    polygon: Polygon | null
    area: number | null
    land_area: number | null
    year_built: number | null
    floors: number | null
    purpose: string | null
    owner: string | null
    responsible_org: string | null
    status: Status
    description: string | null
}

export type ObjectForm = Omit<PropertyObject, 'id'>

export interface ImportPoint { num: string; x: number; y: number }

/** Запись журнала импорта: выписка ЕГРН или схема расположения участка */
export interface ImportRecord {
    id: number
    cadastral_number: string | null
    coord_system: string
    zone: number
    points: ImportPoint[]
    source_filename: string | null
    met_filename: string
    met_content: string
    created_by_name: string
    created_at: string // 'YYYY-MM-DD HH:mm'
}

export const OWNER = 'ООО «Северный ветер»'
export const DEFAULT_CENTER = { lat: 52.2978, lng: 104.2964 }
export const ZONE = 3

export const STATUS_LABEL: Record<Status, string> = {
    in_use: 'В эксплуатации',
    reconstruction: 'Реконструкция',
    vacant: 'Не используется',
}

export const STATUS_BADGE: Record<Status, string> = {
    in_use: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    reconstruction: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    vacant: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
}

export const STATUS_FILL: Record<Status, string> = {
    in_use: '#3b82f6',
    reconstruction: '#f59e0b',
    vacant: '#94a3b8',
}

export const STATUSES = Object.keys(STATUS_LABEL) as Status[]

const M_LAT = 1 / 111_000
const rect = (lat: number, lng: number, halfW: number, halfH: number): Polygon => {
    const dLat = halfH * M_LAT
    const dLng = (halfW * M_LAT) / Math.cos((lat * Math.PI) / 180)
    return [
        [lat + dLat, lng - dLng], [lat + dLat, lng + dLng],
        [lat - dLat, lng + dLng], [lat - dLat, lng - dLng],
    ]
}

const obj = (
    id: number, name: string, cadastral: string | null, address: string, lat: number, lng: number,
    halfW: number, halfH: number, rest: Partial<ObjectForm>,
): PropertyObject => ({
    id, name, cadastral_number: cadastral, address, lat, lng, polygon: rect(lat, lng, halfW, halfH),
    area: null, land_area: null, year_built: null, floors: null, purpose: null,
    owner: OWNER, responsible_org: null, status: 'in_use', description: null, ...rest,
})

export const initialObjects: PropertyObject[] = [
    obj(1, 'Головной офис', '38:36:000099:118', 'г. Северореченск, ул. Ленточная, 14', 52.3021, 104.2712, 55, 35, {
        area: 4820, land_area: 6100, year_built: 2008, floors: 7, purpose: 'Административное здание',
        responsible_org: 'Административно-хозяйственный отдел',
        description: 'Семиэтажное здание с подземной парковкой. Размещает управление сети, бухгалтерию и ИТ-службу.',
    }),
    obj(2, 'Распределительный центр «Восток»', '38:36:000099:42', 'г. Северореченск, Промышленный проезд, 3', 52.2868, 104.3485, 150, 90, {
        area: 18400, land_area: 31000, year_built: 2014, floors: 2, purpose: 'Склад',
        responsible_org: 'Отдел логистики',
        description: 'Склад класса A с температурными зонами и 24 доками. Обслуживает все магазины сети.',
    }),
    obj(3, 'Магазин «Центральный»', '38:36:000099:7', 'г. Северореченск, пр. Мира, 52', 52.2894, 104.2801, 45, 30, {
        area: 1260, land_area: 2300, year_built: 2011, floors: 2, purpose: 'Торговое здание',
        responsible_org: 'Отдел недвижимости',
        description: 'Флагманский магазин сети с кафетерием и зоной самовывоза интернет-заказов.',
    }),
    obj(4, 'Магазин «Заречный»', '38:36:000099:23', 'г. Северореченск, ул. Заречная, 9', 52.2755, 104.2523, 40, 28, {
        area: 980, land_area: 1750, year_built: 2017, floors: 1, purpose: 'Торговое здание',
        responsible_org: 'Отдел недвижимости', status: 'reconstruction',
        description: 'Идёт перепланировка торгового зала и замена холодильного оборудования.',
    }),
    obj(5, 'Магазин «Северный»', '38:36:000099:15', 'г. Северореченск, ул. Полярная, 31', 52.3160, 104.3010, 42, 30, {
        area: 1100, land_area: 1900, year_built: 2019, floors: 1, purpose: 'Торговое здание',
        responsible_org: 'Отдел недвижимости',
        description: 'Магазин у транспортной развязки, самый высокий покупательский трафик в сети.',
    }),
    obj(6, 'Бывший склад на Рабочей', '38:36:000099:61', 'г. Северореченск, ул. Рабочая, 27', 52.2802, 104.3170, 60, 40, {
        area: 2650, land_area: 3400, year_built: 1987, floors: 1, purpose: 'Склад',
        responsible_org: 'Отдел недвижимости', status: 'vacant',
        description: 'Склад выведен из эксплуатации после запуска распределительного центра. Прорабатывается продажа или аренда.',
    }),
    obj(7, 'Участок под новый магазин', '38:36:000099:9', 'г. Северореченск, мкр. Новый, уч. 9', 52.2950, 104.3340, 50, 50, {
        land_area: 5200, purpose: 'Земельный участок', responsible_org: 'Отдел недвижимости', status: 'vacant',
        description: 'Свободный участок под строительство магазина. Межевание завершено.',
    }),
    obj(8, 'Многоуровневая парковка', '38:36:000099:131', 'г. Северореченск, ул. Ленточная, 14А', 52.3043, 104.2778, 30, 22, {
        area: 7300, land_area: 2100, year_built: 2020, floors: 4, purpose: 'Парковка',
        responsible_org: 'Служба эксплуатации',
        description: 'Парковка на 310 мест для сотрудников головного офиса и посетителей.',
    }),
]

export const metContent = (points: ImportPoint[]): string => {
    const first = points[0]
    const last = points[points.length - 1]
    const closed = first && last && (first.x !== last.x || first.y !== last.y) ? [...points, first] : points
    return ['MET', 'BEGIN', 'X Y', '#', ...closed.map(p => `${p.x} ${p.y}`), 'END'].join('\r\n') + '\r\n'
}

export const metFileName = (cadastral: string | null) =>
    `${(cadastral || 'uchastok').replace(/[^0-9A-Za-zА-Яа-яЁё]/g, '-')}.met`

const pointsOf = (o: PropertyObject): ImportPoint[] => {
    const pts = (o.polygon ?? []).map((p, i) => {
        const [x, y] = wgs84ToMsk38(p[0], p[1], ZONE)
        return { num: String(i + 1), x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 }
    })
    return pts.length ? [...pts, { ...pts[0] }] : pts
}

const importOf = (id: number, objectId: number, file: string, author: string, at: string): ImportRecord => {
    const o = initialObjects.find(x => x.id === objectId)!
    const points = pointsOf(o)
    return {
        id, cadastral_number: o.cadastral_number, coord_system: `МСК-38, зона ${ZONE}`, zone: ZONE, points,
        source_filename: file, met_filename: metFileName(o.cadastral_number), met_content: metContent(points),
        created_by_name: author, created_at: at,
    }
}

export const initialEgrn: ImportRecord[] = [
    importOf(1, 1, 'vypiska_head_office.pdf', 'Орлова Мария', '2026-10-14 10:12'),
    importOf(2, 2, 'vypiska_rc_vostok.pdf', 'Орлова Мария', '2026-10-09 15:40'),
    importOf(3, 4, 'vypiska_zarechny.pdf', 'Громов Артём', '2026-09-30 11:05'),
    importOf(4, 6, 'vypiska_sklad_rabochaya.pdf', 'Громов Артём', '2026-09-02 14:18'),
]

export const initialCadastre: ImportRecord[] = [
    importOf(1, 7, 'skhema_uchastok_9.pdf', 'Орлова Мария', '2026-09-21 09:30'),
    importOf(2, 5, 'skhema_severny.pdf', 'Громов Артём', '2026-09-11 16:02'),
]

let seq = 100
export const nextId = () => ++seq

export const fmtDateTime = (s: string) => {
    const d = new Date(s.replace(' ', 'T'))
    return Number.isNaN(d.getTime())
        ? s
        : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const nowStamp = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const emptyForm = (): ObjectForm => ({
    name: '', cadastral_number: null, address: '', lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, polygon: null,
    area: null, land_area: null, year_built: null, floors: null, purpose: null, owner: OWNER,
    responsible_org: null, status: 'in_use', description: null,
})
