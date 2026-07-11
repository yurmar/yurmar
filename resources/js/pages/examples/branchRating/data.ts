// ── Вымышленный набор данных ────────────────────────────────────────────────
// Организация, филиалы и все показатели ниже полностью вымышлены — демо для
// портфолио (аналог сводки по исполнению показателей занятости населения).
// Филиалы названы в честь тех же вымышленных населённых пунктов Онежской
// области, что и в примере «Сводка за сутки» — общая условная вселенная.

export const ORG_NAME = 'Центр занятости населения Онежской области'
export const REGION_LABEL = 'Онежская область'
export const REPORT_DATE = '01.07.2026'
export const SOURCE_FILE = 'свод_ЦЗН_2026_06.xlsx'

export const BRANCHES = [
    'п. Сосновка',
    'с. Дубровино',
    'г. Заречный',
    'пгт Ясногорск',
    'д. Каменка',
    'с. Родники',
    'д. Боровое',
    'п. Луговое',
] as const

export type BranchName = typeof BRANCHES[number]

export interface Section { id: number; name: string }

export const SECTIONS: Section[] = [
    { id: 1, name: 'Занятость и рынок труда' },
    { id: 2, name: 'Демография и доходы' },
]

export interface Indicator {
    id: number
    sectionId: number
    key: string
    name: string
    shortName: string
    unit: '%' | 'тыс чел' | '₽'
    threshold: number | null
    thresholdLabel: string
    lowerIsBetter?: boolean
    inRating?: boolean
    color: string
    /** значение в целом по Онежской области */
    own: number
    /** значения по BRANCHES, в том же порядке */
    values: number[]
}

export const INDICATORS: Indicator[] = [
    {
        id: 1, sectionId: 1, key: 'k0', color: '#3b82f6', inRating: true,
        name: 'Исполнение показателей по трудоустройству граждан', shortName: 'Трудоустройство',
        unit: '%', threshold: 72, thresholdLabel: 'план не ниже 72%',
        own: 74.5, values: [78.2, 69.4, 83.6, 65.1, 91.0, 58.7, 74.8, 62.3],
    },
    {
        id: 2, sectionId: 1, key: 'k1', color: '#22c55e', inRating: true,
        name: 'Взаимодействие с работодателями', shortName: 'Работодатели',
        unit: '%', threshold: 15, thresholdLabel: 'план не менее 15%',
        own: 17.2, values: [19.5, 12.8, 22.1, 10.4, 26.7, 8.9, 16.3, 13.6],
    },
    {
        id: 3, sectionId: 1, key: 'k2', color: '#f59e0b', inRating: true,
        name: 'Исполнение мероприятий нацпроекта «Кадры»', shortName: 'НП «Кадры»',
        unit: '%', threshold: 86, thresholdLabel: 'план 86%',
        own: 88.1, values: [90.5, 81.2, 95.3, 77.6, 98.9, 72.4, 87.0, 79.8],
    },
    {
        id: 4, sectionId: 1, key: 'k3', color: '#ec4899', inRating: true,
        name: 'Меры государственной поддержки несовершеннолетних 14–18 лет', shortName: 'Несовершеннолетние',
        unit: '%', threshold: 25, thresholdLabel: 'план 25%',
        own: 27.4, values: [29.1, 21.6, 34.8, 18.9, 41.2, 15.3, 26.7, 20.4],
    },
    {
        id: 5, sectionId: 1, key: 'k4', color: '#8b5cf6', inRating: true,
        name: 'Профобучение, профориентация и социальная адаптация безработных', shortName: 'Профобучение',
        unit: '%', threshold: 70, thresholdLabel: 'план не ниже 70%',
        own: 73.0, values: [75.6, 64.2, 81.9, 60.5, 88.3, 55.8, 72.1, 63.7],
    },
    {
        id: 6, sectionId: 1, key: 'k5', color: '#06b6d4', inRating: true,
        name: 'Социальный контракт и субсидирование рабочих мест', shortName: 'Соцконтракт',
        unit: '%', threshold: 35, thresholdLabel: 'план 35%',
        own: 38.6, values: [41.2, 29.7, 47.5, 26.3, 53.8, 22.9, 37.4, 28.6],
    },
    {
        id: 7, sectionId: 1, key: 'k6', color: '#f97316', inRating: true,
        name: 'Информирование граждан о положении на рынке труда', shortName: 'Информирование',
        unit: '%', threshold: null, thresholdLabel: 'план 100%',
        own: 96.5, values: [98.2, 91.4, 100.0, 88.7, 100.0, 85.3, 95.9, 90.1],
    },
    {
        id: 8, sectionId: 1, key: 'k7', color: '#ef4444', inRating: false, lowerIsBetter: true,
        name: 'Уровень регистрируемой безработицы', shortName: 'Безработица',
        unit: '%', threshold: 0.4, thresholdLabel: 'план не выше 0,4%',
        own: 0.38, values: [0.34, 0.52, 0.27, 0.61, 0.21, 0.68, 0.39, 0.57],
    },
    {
        id: 9, sectionId: 2, key: 'k8', color: '#14b8a6',
        name: 'Численность экономически активного населения', shortName: 'Экон. активное население',
        unit: 'тыс чел', threshold: null, thresholdLabel: '',
        own: 612.4, values: [84.6, 52.3, 97.8, 45.1, 61.2, 38.7, 79.4, 43.9],
    },
    {
        id: 10, sectionId: 2, key: 'k9', color: '#a855f7',
        name: 'Среднедушевой доход безработных граждан', shortName: 'Доход безработных',
        unit: '₽', threshold: null, thresholdLabel: '',
        own: 14250, values: [15100, 12800, 16400, 11900, 17650, 10600, 14300, 12100],
    },
]

export const RATING_INDICATORS = INDICATORS.filter(i => i.inRating)

// ── Форматирование ──────────────────────────────────────────────────────────

export function fmt(v: number | null): string {
    if (v === null) return '—'
    return v % 1 < 0.05 && v % 1 > -0.05 ? String(Math.round(v)) : v.toFixed(1)
}

export function fmtUnit(v: number | null, unit: Indicator['unit']): string {
    if (v === null) return '—'
    if (unit === '₽') return `${Math.round(v).toLocaleString('ru-RU')} ₽`
    if (unit === 'тыс чел') return `${fmt(v)} тыс чел`
    return `${fmt(v)}%`
}

// ── Производные величины ────────────────────────────────────────────────────

export interface BranchRow { name: string; value: number }

export function branchRows(ind: Indicator): BranchRow[] {
    return BRANCHES.map((name, i) => ({ name, value: ind.values[i] }))
        .sort((a, b) => ind.lowerIsBetter ? a.value - b.value : b.value - a.value)
}

export function topAndBottom(ind: Indicator): { top: BranchRow[]; bottom: BranchRow[] } {
    const rows = branchRows(ind)
    return { top: rows.slice(0, 5), bottom: rows.slice(-5).reverse() }
}

export interface RatingRow {
    name: string
    scores: Record<string, number>
    avg: number
    aboveCount: number
}

export function buildRatingRows(): RatingRow[] {
    const rows: RatingRow[] = BRANCHES.map((name, bi) => {
        const scores: Record<string, number> = {}
        RATING_INDICATORS.forEach(ind => { scores[ind.key] = ind.values[bi] })
        const vals = Object.values(scores)
        const avg = vals.reduce((s, v) => s + v, 0) / vals.length
        const aboveCount = RATING_INDICATORS.filter(ind => ind.threshold !== null && scores[ind.key] >= ind.threshold).length
        return { name, scores, avg, aboveCount }
    })
    return rows.sort((a, b) => b.avg - a.avg)
}
