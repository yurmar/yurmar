import { useMemo, useState } from 'react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell, LabelList,
} from 'recharts'
import {
    MONITOR_CATEGORIES, REGION_NAMES, OWN_INDEX, MONTHS, QUARTERS, YEAR, toQuarterly,
} from './data'
import {
    ACCENT, useStatFonts, StatisticsNav, StatisticsHero, ChartTooltip,
} from './ui'

const COLOR_OWN = '#baff5c'
const COLOR_OTHER = '#5b7fa6'
const COLOR_DISTRICT = '#ffb020'
const COLOR_COUNTRY = '#8b5cf6'

const GRANULARITY = [{ id: 1, label: 'Помесячно' }, { id: 2, label: 'Квартально' }]

function RankCard({ label, rank, count, above, ownVal, districtVal, unit }: {
    label: string; rank: number; count: number; above: boolean
    ownVal: number | null; districtVal: number | null; unit: string
}) {
    return (
        <div className="flex-shrink-0 w-[112px] flex flex-col items-center pt-4 pb-3 px-2 rounded-2xl border border-border bg-card gap-2">
            <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-[1.7rem] font-extrabold"
                style={above
                    ? { background: '#2f6f5e', color: '#fff', boxShadow: '0 0 0 4px rgba(47,111,94,0.25)' }
                    : { background: '#b1493f', color: '#fff', boxShadow: '0 0 0 4px rgba(177,73,63,0.25)' }}
            >
                {rank}
            </div>
            <p className="text-[0.8rem] font-bold text-foreground" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{label}</p>
            <div className="w-full border-t border-border pt-2 text-[0.65rem] text-center text-muted-foreground leading-snug">
                {districtVal != null && <div>Ср. округ: {districtVal.toFixed(1)}{unit}</div>}
                {ownVal != null && <div>Онеж.: {ownVal.toFixed(1)}{unit}</div>}
            </div>
        </div>
    )
}

function XTickAngled({ x, y, payload }: any) {
    const t = payload.value ?? ''
    const label = t.length > 16 ? t.slice(0, 16) + '…' : t
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={10} textAnchor="end" fontSize={10} fill="currentColor" transform="rotate(-40)">{label}</text>
        </g>
    )
}

export default function StatisticsMonitoring() {
    useStatFonts()
    const [categoryId, setCategoryId] = useState(MONITOR_CATEGORIES[0].id)
    const [gran, setGran] = useState(1)

    const category = MONITOR_CATEGORIES.find(c => c.id === categoryId)!
    const isQ = gran === 2
    const labels = isQ ? QUARTERS : MONTHS

    const periods = useMemo(() => {
        const regionSeries = isQ ? category.regionSeries.map(toQuarterly) : category.regionSeries
        const countrySeries = isQ ? toQuarterly(category.countrySeries) : category.countrySeries
        return labels.map((label, i) => {
            const values = regionSeries.map(s => s[i] as number)
            const districtVal = values.reduce((a, b) => a + b, 0) / values.length
            const ownVal = values[OWN_INDEX]
            const sorted = [...values].sort((a, b) => b - a)
            const rank = sorted.findIndex(v => v <= ownVal) + 1
            return { label, ownVal, districtVal, countryVal: countrySeries[i] as number | null, values, rank: rank > 0 ? rank : values.length }
        })
    }, [category, isQ, labels])

    const lineData = periods.map(p => ({ label: p.label, value: p.ownVal }))

    const lastPeriod = periods[periods.length - 1]
    const barData = REGION_NAMES.map((name, i) => ({
        name: name.replace(' область', ' обл.').replace(' край', ' кр.'),
        value: lastPeriod.values[i],
        isOwn: i === OWN_INDEX,
    })).sort((a, b) => b.value - a.value)

    const barYDomain = useMemo((): [number, number] => {
        const vals = [...barData.map(r => r.value), lastPeriod.districtVal, ...(lastPeriod.countryVal != null ? [lastPeriod.countryVal] : [])]
        const mn = Math.min(...vals)
        const mx = Math.max(...vals)
        const pad = (mx - mn) * 0.2 || 1
        return [Math.floor(mn - pad), Math.ceil(mx + pad)]
    }, [barData, lastPeriod])

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <StatisticsHero
                eyebrow="Мониторинг показателя"
                title="Мониторинг"
                subtitle="Помесячная или поквартальная динамика показателя и позиция региона среди соседей по округу."
            />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <StatisticsNav />

                {/* Фильтры */}
                <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap items-end gap-4">
                    <div className="min-w-[18rem]">
                        <label htmlFor="stat-category" className="block text-xs text-muted-foreground mb-1">Показатель</label>
                        <select
                            id="stat-category"
                            name="category"
                            value={categoryId}
                            onChange={e => setCategoryId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer"
                        >
                            {MONITOR_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[12rem]">
                        <label htmlFor="stat-gran" className="block text-xs text-muted-foreground mb-1">Детализация</label>
                        <select
                            id="stat-gran"
                            name="granularity"
                            value={gran}
                            onChange={e => setGran(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer"
                        >
                            {GRANULARITY.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                    </div>
                    <p className="text-xs text-muted-foreground">{category.code} · {YEAR} год</p>
                </div>

                {/* Карточки позиции по периодам */}
                <div className="card-block rounded-2xl p-4 mb-6">
                    <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                        <h2 className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                            Позиция {REGION_NAMES[OWN_INDEX]} в округе
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            <span className="text-emerald-500 font-bold">●</span> выше среднего&nbsp;&nbsp;
                            <span className="text-rose-500 font-bold">●</span> ниже среднего
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex flex-row gap-3 min-w-max pb-2 px-1">
                            {periods.map((p, i) => (
                                <RankCard
                                    key={i}
                                    label={p.label}
                                    rank={p.rank}
                                    count={p.values.length}
                                    above={p.ownVal >= p.districtVal}
                                    ownVal={p.ownVal}
                                    districtVal={p.districtVal}
                                    unit={category.unit === '%' ? '%' : ` ${category.unit}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Линейный график */}
                <div className="card-block rounded-2xl p-5 mb-6">
                    <h2 className="text-center font-semibold mb-1 text-foreground" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                        Динамика {REGION_NAMES[OWN_INDEX]}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4 text-center">{category.name} · {YEAR} год</p>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={lineData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={52} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(148,163,184,0.2)' }} />
                            <Line type="monotone" dataKey="value" name={REGION_NAMES[OWN_INDEX]} stroke={COLOR_OWN} strokeWidth={2.5}
                                dot={{ r: 4, fill: COLOR_OWN, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Столбчатый график по регионам */}
                <div className="card-block rounded-2xl p-5 mb-6">
                    <h2 className="text-center font-semibold mb-1 text-foreground" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                        Регионы округа — {lastPeriod.label} {YEAR}
                    </h2>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 mt-3 px-4 py-3 bg-foreground/5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: COLOR_OWN }} />
                            <span>{REGION_NAMES[OWN_INDEX]}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: COLOR_OTHER }} />
                            <span>Другие регионы округа</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-5 h-0.5 flex-shrink-0 rounded" style={{ background: COLOR_DISTRICT }} />
                            <span>Среднее по округу</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-5 h-0.5 flex-shrink-0 rounded" style={{ background: COLOR_COUNTRY }} />
                            <span>Среднее по стране</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={380}>
                        <BarChart data={barData} margin={{ top: 30, right: 20, left: 10, bottom: 90 }} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="name" tick={<XTickAngled />} tickLine={false} axisLine={false} interval={0} />
                            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} width={52} domain={barYDomain} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                            <ReferenceLine y={lastPeriod.districtVal} stroke={COLOR_DISTRICT} strokeDasharray="6 6" strokeWidth={2}
                                label={{ value: `Округ ${lastPeriod.districtVal.toFixed(1)}`, position: 'insideBottomRight', fontSize: 10, fill: COLOR_DISTRICT, offset: 6 }} />
                            {lastPeriod.countryVal != null && (
                                <ReferenceLine y={lastPeriod.countryVal} stroke={COLOR_COUNTRY} strokeWidth={2}
                                    label={{ value: `Страна ${lastPeriod.countryVal.toFixed(1)}`, position: 'insideTopRight', fontSize: 10, fill: COLOR_COUNTRY, offset: 6 }} />
                            )}
                            <Bar dataKey="value" name="Значение" radius={[4, 4, 0, 0]}>
                                {barData.map((row, i) => <Cell key={i} fill={row.isOwn ? COLOR_OWN : COLOR_OTHER} />)}
                                <LabelList dataKey="value" position="top" formatter={(v: any) => Number(v).toFixed(1)} style={{ fontSize: 10, fill: 'currentColor' } as React.CSSProperties} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Регионы и показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
