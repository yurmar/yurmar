// ── Вымышленный набор данных ────────────────────────────────────────────────
// Регион, округ и все показатели ниже полностью вымышлены и нужны только как
// иллюстративный пример для портфолио (аналог сводки Росстата по региону).
// Тот же вымышленный регион, что и в примере «Бюджет» — общая условная
// вселенная для нескольких демо-дашбордов.

export const REGION_NAME = 'Онежская область'
export const DISTRICT_NAME = 'Северо-Онежский округ'
export const DISTRICT_NAME_GEN = 'Северо-Онежского округа'
export const YEAR = 2026
export const UPDATED_AT = '01.07.2026'

export const REGION_NAMES = [
    'Онежская область',
    'Ладожская область',
    'Печорский край',
    'Кольская область',
    'Валдайская область',
    'Мезенская область',
] as const

export const OWN_INDEX = 0

export interface Section { id: number; name: string }

export const SECTIONS: Section[] = [
    { id: 1, name: 'Промышленность и строительство' },
    { id: 2, name: 'Уровень жизни и рынок труда' },
]

export interface Category {
    id: number
    sectionId: number
    code: string
    name: string
    unit: '%' | 'тыс ₽'
    /** значения по REGION_NAMES, в том же порядке */
    values: number[]
    country: number
}

export const CATEGORIES: Category[] = [
    { id: 1, sectionId: 1, code: '01.1', name: 'Индекс промышленного производства', unit: '%',
        values: [104.2, 107.8, 96.5, 109.3, 101.7, 98.4], country: 103.1 },
    { id: 2, sectionId: 1, code: '01.2', name: 'Индекс обрабатывающих производств', unit: '%',
        values: [105.6, 110.2, 94.1, 101.8, 99.5, 96.7], country: 104.4 },
    { id: 3, sectionId: 1, code: '02.1', name: 'Объём строительных работ', unit: '%',
        values: [112.4, 118.9, 91.3, 105.6, 96.8, 88.2], country: 107.5 },
    { id: 4, sectionId: 1, code: '01.3', name: 'Производство электроэнергии', unit: '%',
        values: [101.9, 103.4, 97.8, 106.2, 99.1, 95.6], country: 102.0 },
    { id: 5, sectionId: 1, code: '03.1', name: 'Индекс сельскохозяйственного производства', unit: '%',
        values: [108.7, 96.4, 102.1, 89.5, 111.3, 105.9], country: 103.8 },
    { id: 6, sectionId: 2, code: '05.1', name: 'Реальные денежные доходы населения', unit: '%',
        values: [102.4, 103.1, 99.6, 104.8, 100.9, 98.7], country: 101.6 },
    { id: 7, sectionId: 2, code: '05.2', name: 'Среднемесячная номинальная зарплата', unit: 'тыс ₽',
        values: [68.4, 74.9, 52.3, 91.7, 58.1, 49.6], country: 71.2 },
    { id: 8, sectionId: 2, code: '05.3', name: 'Уровень безработицы', unit: '%',
        values: [3.8, 3.2, 5.9, 2.7, 5.1, 6.4], country: 3.9 },
    { id: 9, sectionId: 2, code: '06.1', name: 'Оборот розничной торговли', unit: '%',
        values: [106.3, 109.8, 95.4, 103.7, 98.2, 92.9], country: 104.9 },
]

// ── Производные величины ────────────────────────────────────────────────────

export function districtAvg(cat: Category): number {
    return cat.values.reduce((s, v) => s + v, 0) / cat.values.length
}

export function districtRank(cat: Category): { rank: number; count: number } {
    const sorted = [...cat.values].sort((a, b) => b - a)
    const ownVal = cat.values[OWN_INDEX]
    const rank = sorted.findIndex(v => v <= ownVal) + 1
    return { rank: rank > 0 ? rank : sorted.length, count: cat.values.length }
}

export function fmtVal(v: number | null, unit: Category['unit']): string {
    if (v == null) return '—'
    return unit === '%' ? `${v.toFixed(1)}%` : `${v.toFixed(1)} ${unit}`
}

export function fmtDev(v: number): string {
    return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`
}

// ── Ежемесячные ряды для страницы «Мониторинг» ──────────────────────────────

export const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
export const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

interface RegionCurve { base: number; amp: number; phase: number; trend: number }

function genMonthly({ base, amp, phase, trend }: RegionCurve): number[] {
    return Array.from({ length: 12 }, (_, m) => {
        const seasonal = amp * Math.sin((2 * Math.PI * (m + phase)) / 12)
        const drift = trend * (m / 11)
        return Math.round((base + seasonal + drift) * 10) / 10
    })
}

export interface MonitorCategory {
    id: number
    code: string
    name: string
    unit: '%' | 'тыс ₽'
    /** 12 значений на регион, в порядке REGION_NAMES */
    regionSeries: number[][]
    countrySeries: number[]
}

export const MONITOR_CATEGORIES: MonitorCategory[] = [
    {
        id: 1, code: '01.1', name: 'Индекс промышленного производства', unit: '%',
        regionSeries: [
            genMonthly({ base: 103, amp: 4.5, phase: 1, trend: 3 }),   // Онежская
            genMonthly({ base: 106, amp: 5.5, phase: 2, trend: 4 }),   // Ладожская
            genMonthly({ base: 95,  amp: 3.5, phase: 0, trend: -2 }),  // Печорский
            genMonthly({ base: 108, amp: 6,   phase: 3, trend: 2 }),   // Кольская
            genMonthly({ base: 100, amp: 3,   phase: 5, trend: 1 }),   // Валдайская
            genMonthly({ base: 97,  amp: 4,   phase: 4, trend: -1.5 }),// Мезенская
        ],
        countrySeries: genMonthly({ base: 102, amp: 3, phase: 2, trend: 2 }),
    },
    {
        id: 2, code: '06.1', name: 'Оборот розничной торговли', unit: '%',
        regionSeries: [
            genMonthly({ base: 105, amp: 5,   phase: 6, trend: 2.5 }), // Онежская
            genMonthly({ base: 108, amp: 6,   phase: 7, trend: 3 }),   // Ладожская
            genMonthly({ base: 94,  amp: 4,   phase: 1, trend: -1 }),  // Печорский
            genMonthly({ base: 103, amp: 3.5, phase: 8, trend: 1.5 }), // Кольская
            genMonthly({ base: 97,  amp: 3,   phase: 3, trend: 0.5 }), // Валдайская
            genMonthly({ base: 92,  amp: 4.5, phase: 9, trend: -2 }),  // Мезенская
        ],
        countrySeries: genMonthly({ base: 104, amp: 3.5, phase: 5, trend: 1 }),
    },
]

export function toQuarterly(m12: (number | null)[]): (number | null)[] {
    return [0, 1, 2, 3].map(q => {
        const s = m12.slice(q * 3, q * 3 + 3).filter((v): v is number => v !== null)
        return s.length ? Math.round((s.reduce((a, b) => a + b, 0) / s.length) * 10) / 10 : null
    })
}
