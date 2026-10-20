// ── Вымышленная организация ──────────────────────────────────────────────
// Торговая сеть «Северный ветер». Все объекты, адреса, кадастровые номера
// и выписки вымышлены — интерактивный пример вёрстки раздела «Реестр недвижимости».

export type Status = 'in_use' | 'reconstruction' | 'vacant'

export interface PropertyObject {
    id: number
    name: string
    cadastral: string
    address: string
    area: number | null
    landArea: number | null
    yearBuilt: number | null
    floors: number | null
    purpose: string
    responsible: string
    status: Status
    description: string
    /** Контур на схеме, проценты 0–100 (x, y) */
    polygon: [number, number][]
}

export interface ExtractImport {
    id: number
    date: string // 'YYYY-MM-DD HH:mm'
    cadastral: string
    coordSystem: string
    points: number
    file: string
    author: string
}

export const OWNER = 'ООО «Северный ветер»'

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
    in_use: '#0ea5e9',
    reconstruction: '#f59e0b',
    vacant: '#94a3b8',
}

export const PURPOSES = ['Торговое', 'Складское', 'Административное', 'Производственное', 'Парковка', 'Земельный участок']

export const RESPONSIBLE = ['Отдел недвижимости', 'Служба эксплуатации', 'Отдел логистики', 'Административно-хозяйственный отдел']

export const initialObjects: PropertyObject[] = [
    {
        id: 1, name: 'Головной офис', cadastral: '77:01:0004012:118', address: 'г. Северореченск, ул. Ленточная, 14',
        area: 4820, landArea: 6100, yearBuilt: 2008, floors: 7, purpose: 'Административное',
        responsible: 'Административно-хозяйственный отдел', status: 'in_use',
        description: 'Семиэтажное здание с подземной парковкой. Размещает управление сети, бухгалтерию и ИТ-службу.',
        polygon: [[8, 10], [34, 10], [34, 32], [8, 32]],
    },
    {
        id: 2, name: 'Распределительный центр «Восток»', cadastral: '77:01:0007003:42', address: 'г. Северореченск, Промышленный проезд, 3',
        area: 18400, landArea: 31000, yearBuilt: 2014, floors: 2, purpose: 'Складское',
        responsible: 'Отдел логистики', status: 'in_use',
        description: 'Склад класса A с температурными зонами и 24 доками. Обслуживает все магазины сети.',
        polygon: [[52, 8], [92, 8], [92, 36], [52, 36]],
    },
    {
        id: 3, name: 'Магазин «Северный ветер — Центральный»', cadastral: '77:01:0004025:7', address: 'г. Северореченск, пр. Мира, 52',
        area: 1260, landArea: 2300, yearBuilt: 2011, floors: 2, purpose: 'Торговое',
        responsible: 'Отдел недвижимости', status: 'in_use',
        description: 'Флагманский магазин сети с кафетерием и зоной самовывоза интернет-заказов.',
        polygon: [[10, 46], [30, 46], [30, 62], [10, 62]],
    },
    {
        id: 4, name: 'Магазин «Северный ветер — Заречный»', cadastral: '77:01:0009011:23', address: 'г. Северореченск, ул. Заречная, 9',
        area: 980, landArea: 1750, yearBuilt: 2017, floors: 1, purpose: 'Торговое',
        responsible: 'Отдел недвижимости', status: 'reconstruction',
        description: 'Идёт перепланировка торгового зала и замена холодильного оборудования. Открытие после реконструкции — по графику.',
        polygon: [[40, 46], [62, 46], [62, 64], [40, 64]],
    },
    {
        id: 5, name: 'Магазин «Северный ветер — Северный»', cadastral: '77:01:0012004:15', address: 'г. Северореченск, ул. Полярная, 31',
        area: 1100, landArea: 1900, yearBuilt: 2019, floors: 1, purpose: 'Торговое',
        responsible: 'Отдел недвижимости', status: 'in_use',
        description: 'Магазин у транспортной развязки, самый высокий покупательский трафик в сети.',
        polygon: [[72, 46], [92, 46], [92, 62], [72, 62]],
    },
    {
        id: 6, name: 'Бывший склад на Рабочей', cadastral: '77:01:0003008:61', address: 'г. Северореченск, ул. Рабочая, 27',
        area: 2650, landArea: 3400, yearBuilt: 1987, floors: 1, purpose: 'Складское',
        responsible: 'Отдел недвижимости', status: 'vacant',
        description: 'Склад выведен из эксплуатации после запуска распределительного центра. Прорабатывается продажа или сдача в аренду.',
        polygon: [[8, 74], [30, 74], [30, 92], [8, 92]],
    },
    {
        id: 7, name: 'Земельный участок под новый магазин', cadastral: '77:01:0015002:9', address: 'г. Северореченск, мкр. Новый, уч. 9',
        area: null, landArea: 5200, yearBuilt: null, floors: null, purpose: 'Земельный участок',
        responsible: 'Отдел недвижимости', status: 'vacant',
        description: 'Свободный участок под строительство магазина. Межевание завершено, ожидается разрешение на строительство.',
        polygon: [[42, 76], [64, 74], [66, 92], [40, 91]],
    },
    {
        id: 8, name: 'Многоуровневая парковка', cadastral: '77:01:0004012:131', address: 'г. Северореченск, ул. Ленточная, 14А',
        area: 7300, landArea: 2100, yearBuilt: 2020, floors: 4, purpose: 'Парковка',
        responsible: 'Служба эксплуатации', status: 'in_use',
        description: 'Парковка на 310 мест для сотрудников головного офиса и посетителей.',
        polygon: [[72, 74], [92, 74], [92, 92], [72, 92]],
    },
]

export const initialImports: ExtractImport[] = [
    { id: 1, date: '2026-10-14 10:12', cadastral: '77:01:0004012:118', coordSystem: 'МСК-77, зона 1', points: 6, file: 'vypiska_head_office.pdf', author: 'Орлова Мария' },
    { id: 2, date: '2026-10-09 15:40', cadastral: '77:01:0007003:42', coordSystem: 'МСК-77, зона 1', points: 12, file: 'vypiska_rc_vostok.pdf', author: 'Орлова Мария' },
    { id: 3, date: '2026-09-30 11:05', cadastral: '77:01:0009011:23', coordSystem: 'МСК-77, зона 2', points: 8, file: 'vypiska_zarechny.pdf', author: 'Громов Артём' },
    { id: 4, date: '2026-09-21 09:30', cadastral: '77:01:0015002:9', coordSystem: 'МСК-77, зона 2', points: 5, file: 'vypiska_novy_uchastok.pdf', author: 'Орлова Мария' },
    { id: 5, date: '2026-09-02 14:18', cadastral: '77:01:0003008:61', coordSystem: 'МСК-77, зона 1', points: 7, file: 'vypiska_sklad_rabochaya.pdf', author: 'Громов Артём' },
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
