import { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LabelList,
} from 'recharts'
import { REGIONS, CATEGORIES, DISTRICT_NAME_GEN, fmtNum } from './data'
import { ACCENT, useBudgetFonts, BudgetNav, BudgetHero } from './ui'

function XTick({ x, y, payload }: any) {
    const MAX = 18
    const t: string = payload.value ?? ''
    const label = t.length > MAX ? t.slice(0, MAX) + '…' : t
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={10} textAnchor="end" fontSize={10} fill="currentColor" transform="rotate(-40)">{label}</text>
        </g>
    )
}

export default function BudgetStructure() {
    useBudgetFonts()

    const rows = useMemo(() => REGIONS.map(r => {
        const values: Record<string, number> = {}
        const pcts: Record<string, number> = {}
        CATEGORIES.forEach(c => {
            values[c.label] = r.categories[c.key]
            pcts[c.label] = r.taxNontax > 0 ? Math.round((r.categories[c.key] / r.taxNontax) * 1000) / 10 : 0
        })
        return { name: r.name, isOwn: r.isOwn, total: r.taxNontax, values, pcts }
    }), [])

    const chartRows = rows.map(r => ({ name: r.name, ...r.pcts }))

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <BudgetHero
                eyebrow="Структура налоговых доходов"
                title="Структура по регионам округа"
                subtitle={`Доля каждого источника в налоговых и неналоговых доходах регионов ${DISTRICT_NAME_GEN}.`}
            />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <BudgetNav />

                <div className="card-block rounded-2xl p-5 mb-6">
                    <h2 className="font-semibold mb-1 text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Структура налоговых доходов
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">Доля каждой статьи в общем объёме налоговых поступлений региона</p>

                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4 px-4 py-3 bg-foreground/5 rounded-xl">
                        {CATEGORIES.map(c => (
                            <div key={c.key} className="flex items-center gap-1.5 text-xs font-medium max-w-[12rem]">
                                <span className="w-3.5 h-3.5 rounded flex-shrink-0" style={{ background: c.color }} />
                                <span className="truncate" title={c.label}>{c.short}</span>
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <div style={{ minWidth: Math.max(480, rows.length * 90) }}>
                            <ResponsiveContainer width="100%" height={420}>
                                <BarChart data={chartRows} margin={{ top: 10, right: 20, left: 50, bottom: 90 }} barCategoryGap="25%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis dataKey="name" tick={<XTick />} tickLine={false} axisLine={false} interval={0} />
                                    <YAxis
                                        tickFormatter={v => `${Math.round(v)}%`}
                                        tick={{ fontSize: 11, fill: 'currentColor' }}
                                        tickLine={false} axisLine={false}
                                        domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]}
                                        label={{ value: 'Доля в налоговых доходах, %', angle: -90, position: 'insideLeft', offset: -35, fontSize: 11, fill: 'currentColor', style: { textAnchor: 'middle' } }}
                                    />
                                    <Tooltip
                                        content={({ active, payload, label }: any) => {
                                            if (!active || !payload?.length) return null
                                            const row = rows.find(r => r.name === label)
                                            const visible = [...payload].reverse().filter((p: any) => p.value > 0)
                                            return (
                                                <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-xs">
                                                    <p className="font-semibold mb-2 text-foreground leading-tight">{label}</p>
                                                    {visible.map((p: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 mb-1">
                                                            <span className="w-2 h-2 rounded-sm flex-shrink-0 mt-1" style={{ background: p.fill }} />
                                                            <span className="text-xs text-muted-foreground min-w-0 leading-tight flex-1">{p.name}</span>
                                                            <span className="font-medium flex-shrink-0 pl-2">
                                                                {Number(p.value).toFixed(1)}%
                                                                {row && <span className="text-muted-foreground font-normal ml-1">({fmtNum(row.values[p.name])})</span>}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {row && (
                                                        <div className="border-t border-border mt-2 pt-2 text-xs text-muted-foreground">
                                                            Всего налоговых доходов: <span className="font-semibold text-foreground">{fmtNum(row.total)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        }}
                                        cursor={{ fill: 'rgba(148,163,184,0.06)' }}
                                    />
                                    {CATEGORIES.map(c => (
                                        <Bar key={c.key} dataKey={c.label} stackId="a" fill={c.color}>
                                            <LabelList
                                                dataKey={c.label}
                                                position="center"
                                                formatter={(v: any) => (typeof v === 'number' && v >= 6 ? `${v.toFixed(0)}%` : '')}
                                                style={{ fontSize: 10, fill: '#fff', fontWeight: 600, pointerEvents: 'none' } as React.CSSProperties}
                                            />
                                        </Bar>
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Таблица */}
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">Регион</th>
                                    <th className="text-right py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">Всего налоговых</th>
                                    {CATEGORIES.map(c => (
                                        <th key={c.key} className="text-right py-2 px-2 font-medium text-muted-foreground max-w-[7rem] break-words leading-tight">{c.short}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i} className={`border-b border-border/40 hover:bg-foreground/5 transition-colors ${row.isOwn ? 'bg-[var(--budget-gold)]/5' : ''}`}>
                                        <td className="py-2 px-2 font-medium text-foreground whitespace-nowrap">
                                            {row.isOwn && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: 'var(--budget-gold)' }} />}
                                            {row.name}
                                        </td>
                                        <td className="py-2 px-2 text-right font-medium text-foreground">{fmtNum(row.total)}</td>
                                        {CATEGORIES.map(c => (
                                            <td key={c.key} className="py-2 px-2 text-right">
                                                <span className="font-medium text-foreground">{fmtNum(row.values[c.label])}</span>
                                                <br />
                                                <span style={{ color: c.color }}>{row.pcts[c.label].toFixed(1)}%</span>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            * Доли рассчитаны от налоговых и неналоговых доходов региона.
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Регионы и показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
