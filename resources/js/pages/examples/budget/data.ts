// ── Вымышленный набор данных ────────────────────────────────────────────────
// Регион, округ и показатели ниже полностью вымышлены и нужны только как
// иллюстративный пример для портфолио (аналог формы 0503117 «Отчёт об
// исполнении консолидированного бюджета»).

export const REGION_NAME = 'Онежская область'
export const REGION_NAME_GEN = 'Онежской области'
export const DISTRICT_NAME = 'Северо-Онежский округ'
export const DISTRICT_NAME_DAT = 'Северо-Онежскому округу'
export const DISTRICT_NAME_GEN = 'Северо-Онежского округа'
export const YEAR = 2026
export const PREV_YEAR = 2025
export const REPORT_DATE = '01.07.2026'
export const REPORT_FORM = '0503117'

export type CategoryKey = 'ndfl' | 'profit' | 'property' | 'excise' | 'resource' | 'other'

export const CATEGORIES: { key: CategoryKey; label: string; short: string; color: string }[] = [
    { key: 'ndfl',     label: 'НДФЛ',                                   short: 'НДФЛ',       color: '#c9a24b' },
    { key: 'profit',   label: 'Налог на прибыль организаций',           short: 'Прибыль',    color: '#2f6f5e' },
    { key: 'property', label: 'Налог на имущество',                     short: 'Имущество',  color: '#5b7fa6' },
    { key: 'excise',   label: 'Акцизы',                                 short: 'Акцизы',     color: '#b1493f' },
    { key: 'resource', label: 'Платежи за пользование недрами',         short: 'Недра',      color: '#7a5c8e' },
    { key: 'other',    label: 'Прочие налоговые доходы',                short: 'Прочее',     color: '#8c8c86' },
]

export interface RegionBudget {
    id: number
    name: string
    isOwn: boolean
    total: number
    taxNontax: number
    grants: number
    categories: Record<CategoryKey, number>
}

export const OWN_PREV = {
    total: 79_800_000_000,
    taxNontax: 55_200_000_000,
    grants: 24_600_000_000,
}

export const REGIONS: RegionBudget[] = [
    {
        id: 1, name: REGION_NAME, isOwn: true,
        total: 86_420_000_000, taxNontax: 61_350_000_000, grants: 25_070_000_000,
        categories: { ndfl: 24_100_000_000, profit: 14_800_000_000, property: 8_950_000_000, excise: 6_200_000_000, resource: 4_300_000_000, other: 3_000_000_000 },
    },
    {
        id: 2, name: 'Ладожская область', isOwn: false,
        total: 102_300_000_000, taxNontax: 78_000_000_000, grants: 24_300_000_000,
        categories: { ndfl: 26_200_000_000, profit: 28_500_000_000, property: 10_800_000_000, excise: 6_500_000_000, resource: 3_200_000_000, other: 2_800_000_000 },
    },
    {
        id: 3, name: 'Печорский край', isOwn: false,
        total: 58_900_000_000, taxNontax: 36_700_000_000, grants: 22_200_000_000,
        categories: { ndfl: 15_200_000_000, profit: 6_800_000_000, property: 5_100_000_000, excise: 4_300_000_000, resource: 2_600_000_000, other: 2_700_000_000 },
    },
    {
        id: 4, name: 'Кольская область', isOwn: false,
        total: 143_700_000_000, taxNontax: 112_000_000_000, grants: 31_700_000_000,
        categories: { ndfl: 31_200_000_000, profit: 22_800_000_000, property: 12_100_000_000, excise: 5_900_000_000, resource: 38_500_000_000, other: 1_500_000_000 },
    },
    {
        id: 5, name: 'Валдайская область', isOwn: false,
        total: 47_250_000_000, taxNontax: 27_100_000_000, grants: 20_150_000_000,
        categories: { ndfl: 11_800_000_000, profit: 4_200_000_000, property: 4_100_000_000, excise: 3_600_000_000, resource: 1_400_000_000, other: 2_000_000_000 },
    },
    {
        id: 6, name: 'Мезенская область', isOwn: false,
        total: 39_800_000_000, taxNontax: 21_400_000_000, grants: 18_400_000_000,
        categories: { ndfl: 9_600_000_000, profit: 3_300_000_000, property: 3_400_000_000, excise: 2_900_000_000, resource: 1_200_000_000, other: 1_000_000_000 },
    },
]

export const NATIONAL_AVG_TOTAL = 68_500_000_000
export const NATIONAL_AVG_GRANTS_SHARE = 0.35

// ── Производные величины ────────────────────────────────────────────────────

export const own = REGIONS.find(r => r.isOwn)!
export const peers = REGIONS.filter(r => !r.isOwn)

export const districtTotal = REGIONS.reduce((s, r) => s + r.total, 0)
export const districtTaxNontax = REGIONS.reduce((s, r) => s + r.taxNontax, 0)
export const districtGrants = REGIONS.reduce((s, r) => s + r.grants, 0)

export const districtAvgTotal = districtTotal / REGIONS.length
export const districtAvgTaxNontax = districtTaxNontax / REGIONS.length
export const districtAvgGrants = districtGrants / REGIONS.length
export const districtAvgDependency = districtGrants / districtTotal

export const nationalAvgTotal = NATIONAL_AVG_TOTAL
export const nationalAvgGrants = NATIONAL_AVG_TOTAL * NATIONAL_AVG_GRANTS_SHARE
export const nationalAvgTaxNontax = NATIONAL_AVG_TOTAL - nationalAvgGrants
export const nationalAvgDependency = NATIONAL_AVG_GRANTS_SHARE

export function categoryDistrictAvg(key: CategoryKey): number {
    return REGIONS.reduce((s, r) => s + r.categories[key], 0) / REGIONS.length
}

// ── Форматирование ──────────────────────────────────────────────────────────

export function fmtNum(v: number | null | undefined): string {
    if (v == null) return '—'
    const abs = Math.abs(v)
    if (abs >= 1e9) return `${(v / 1e9).toFixed(2)} млрд ₽`
    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)} млн ₽`
    if (abs >= 1e3) return `${(v / 1e3).toFixed(1)} тыс ₽`
    return `${v.toLocaleString('ru-RU')} ₽`
}

export function fmtPct(v: number | null | undefined, digits = 1): string {
    if (v == null || !isFinite(v)) return '—'
    return `${(v * 100).toFixed(digits)}%`
}

export function fmtDelta(curr: number, prev: number): string {
    const pct = ((curr - prev) / prev) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

// ── Показатели для страницы «Регионы» ───────────────────────────────────────

export type IndicatorKey = 'total' | 'taxNontax' | 'grants' | CategoryKey

export const INDICATORS: { key: IndicatorKey; label: string }[] = [
    { key: 'total', label: 'Всего доходов' },
    { key: 'taxNontax', label: 'Налоговые и неналоговые доходы' },
    { key: 'grants', label: 'Безвозмездные поступления' },
    ...CATEGORIES.map(c => ({ key: c.key as IndicatorKey, label: c.label })),
]

export function indicatorValue(region: RegionBudget, key: IndicatorKey): number {
    if (key === 'total') return region.total
    if (key === 'taxNontax') return region.taxNontax
    if (key === 'grants') return region.grants
    return region.categories[key as CategoryKey]
}
