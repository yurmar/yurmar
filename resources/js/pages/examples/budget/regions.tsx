import { useMemo, useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, Cell, LabelList,
} from 'recharts'
import { REGIONS, DISTRICT_NAME_DAT, DISTRICT_NAME_GEN, INDICATORS, IndicatorKey, indicatorValue, fmtNum } from './data'
import { ACCENT, useBudgetFonts, BudgetNav, BudgetHero, ReportTooltip } from './ui'

const GOLD = '#c9a24b'
const TEAL = '#3f7d63'
const REFLINE = '#b1493f'

function XTick({ x, y, payload }: any) {
    const MAX = 16
    const t: string = payload.value ?? ''
    const label = t.length > MAX ? t.slice(0, MAX) + '…' : t
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={10} textAnchor="end" fontSize={10} fill="currentColor" transform="rotate(-40)">{label}</text>
        </g>
    )
}

export default function BudgetRegions() {
    useBudgetFonts()
    const [indicatorKey, setIndicatorKey] = useState<IndicatorKey>('total')
    const indicator = INDICATORS.find(i => i.key === indicatorKey)!

    const chartData = useMemo(() => {
        return [...REGIONS]
            .map(r => ({ name: r.name, value: indicatorValue(r, indicatorKey), isOwn: r.isOwn }))
            .sort((a, b) => b.value - a.value)
    }, [indicatorKey])

    const avg = useMemo(() => chartData.reduce((s, r) => s + r.value, 0) / chartData.length, [chartData])
    const ownRank = chartData.findIndex(r => r.isOwn) + 1

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <BudgetHero
                eyebrow="Сравнение по округу"
                title="Регионы округа"
                subtitle={`Позиция региона среди соседей по ${DISTRICT_NAME_DAT} — выберите показатель, чтобы сравнить доходы.`}
            />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <BudgetNav />

                <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap items-end gap-4">
                    <div className="min-w-[16rem]">
                        <label htmlFor="budget-indicator" className="block text-xs text-muted-foreground mb-1">Показатель</label>
                        <select
                            id="budget-indicator"
                            name="indicator"
                            value={indicatorKey}
                            onChange={e => setIndicatorKey(e.target.value as IndicatorKey)}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer"
                        >
                            {INDICATORS.map(i => <option key={i.key} value={i.key}>{i.label}</option>)}
                        </select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Место региона: <span className="font-semibold text-foreground">{ownRank}</span> из {chartData.length} · среднее по округу: <span className="font-semibold text-foreground">{fmtNum(avg)}</span>
                    </p>
                </div>

                <div className="card-block rounded-2xl p-5 mb-6">
                    <h2 className="font-semibold mb-1 text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {indicator.label}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">По регионам {DISTRICT_NAME_GEN}, {chartData.length} регионов</p>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 px-4 py-3 bg-foreground/5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: GOLD }} />
                            <span>Свой регион</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: TEAL }} />
                            <span>Другие регионы округа</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-5 h-0.5 flex-shrink-0 rounded" style={{ background: REFLINE }} />
                            <span>Среднее по округу</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={420}>
                        <BarChart data={chartData} margin={{ top: 30, right: 20, left: 10, bottom: 90 }} barCategoryGap="30%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="name" tick={<XTick />} tickLine={false} axisLine={false} interval={0} />
                            <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={fmtNum} width={80} />
                            <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                            <ReferenceLine
                                y={avg} stroke={REFLINE} strokeDasharray="6 3" strokeWidth={1.5}
                                label={{ value: `Ср. ${fmtNum(avg)}`, position: 'insideTopRight', fontSize: 10, fill: REFLINE, offset: 6 }}
                            />
                            <Bar dataKey="value" name={indicator.label} radius={[4, 4, 0, 0]}>
                                {chartData.map((r, i) => <Cell key={i} fill={r.isOwn ? GOLD : TEAL} />)}
                                <LabelList dataKey="value" position="top" formatter={(v: any) => fmtNum(v)} style={{ fontSize: 10, fill: 'currentColor' } as React.CSSProperties} />
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
