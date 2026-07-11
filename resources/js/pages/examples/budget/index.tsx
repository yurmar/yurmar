import { useMemo } from 'react'
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
} from 'recharts'
import {
    REGION_NAME, REGION_NAME_GEN, DISTRICT_NAME, DISTRICT_NAME_DAT, YEAR, REPORT_DATE, REPORT_FORM,
    own, OWN_PREV, CATEGORIES, districtAvgTotal, districtAvgTaxNontax, districtAvgGrants, districtAvgDependency,
    nationalAvgTotal, nationalAvgTaxNontax, nationalAvgGrants, nationalAvgDependency,
    categoryDistrictAvg, fmtNum, fmtPct,
} from './data'
import {
    ACCENT, useBudgetFonts, BudgetNav, BudgetHero, TickerStrip, TickerField,
    KpiStamp, TrendBadge, ReportTooltip, ChartCard,
} from './ui'

const ownDependency = own.grants / own.total
const resourceShareOfTax = own.categories.resource / own.taxNontax

const PIE_ROWS = CATEGORIES.map(c => ({ name: c.label, value: own.categories[c.key], color: c.color }))

const DEPENDENCY_ROWS = [
    { name: REGION_NAME, value: ownDependency * 100, fill: 'var(--budget-gold)' },
    { name: `${DISTRICT_NAME} (сред.)`, value: districtAvgDependency * 100, fill: '#5b7fa6' },
    { name: 'Страна (сред.)', value: nationalAvgDependency * 100, fill: '#8c8c86' },
]

const TABLE_ROWS = [
    { name: 'Всего доходов', own: own.total, district: districtAvgTotal, national: nationalAvgTotal },
    { name: 'Налоговые и неналоговые доходы', own: own.taxNontax, district: districtAvgTaxNontax, national: nationalAvgTaxNontax },
    ...CATEGORIES.map(c => ({ name: c.label, own: own.categories[c.key], district: categoryDistrictAvg(c.key), national: null as number | null })),
    { name: 'Безвозмездные поступления', own: own.grants, district: districtAvgGrants, national: nationalAvgGrants },
]

export default function BudgetOverview() {
    useBudgetFonts()

    const pieTotal = useMemo(() => PIE_ROWS.reduce((s, r) => s + r.value, 0), [])

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <BudgetHero
                eyebrow={`Исполнение бюджета · ${YEAR} год`}
                title={`Бюджет ${REGION_NAME_GEN}`}
                subtitle={`Консолидированный бюджет региона: доходы за ${YEAR} год в сравнении со средними показателями по ${DISTRICT_NAME_DAT} и по стране.`}
            >
                <TickerStrip>
                    <TickerField label="Регион" value={REGION_NAME} />
                    <TickerField label="Отчёт от" value={REPORT_DATE} />
                    <TickerField label="Форма" value={REPORT_FORM} />
                    <TickerField label="Статус" value="Утверждено" />
                </TickerStrip>
            </BudgetHero>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <BudgetNav />

                {/* КПИ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiStamp
                        label="Совокупные доходы"
                        value={fmtNum(own.total)}
                        sub={`Выше среднего по округу на ${fmtPct(own.total / districtAvgTotal - 1)}`}
                        accent="var(--budget-gold)"
                        badge={<TrendBadge curr={own.total} prev={OWN_PREV.total} />}
                    />
                    <KpiStamp
                        label="Налоговые и неналоговые доходы"
                        value={fmtNum(own.taxNontax)}
                        sub={`${fmtPct(own.taxNontax / own.total)} всех доходов региона`}
                        accent="#2f6f5e"
                        badge={<TrendBadge curr={own.taxNontax} prev={OWN_PREV.taxNontax} />}
                    />
                    <KpiStamp
                        label="Безвозмездные поступления"
                        value={fmtNum(own.grants)}
                        sub={`Доля ${fmtPct(ownDependency)} — ниже, чем по округу (${fmtPct(districtAvgDependency)}) и по стране (${fmtPct(nationalAvgDependency)})`}
                        accent="#b1493f"
                        badge={<TrendBadge curr={own.grants} prev={OWN_PREV.grants} invert />}
                    />
                    <KpiStamp
                        label="Платежи за пользование недрами"
                        value={fmtNum(own.categories.resource)}
                        sub={`${fmtPct(resourceShareOfTax)} налоговых доходов региона`}
                        accent="#7a5c8e"
                    />
                </div>

                {/* Графики */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <ChartCard title="Структура налоговых доходов" subtitle={`${REGION_NAME} · доля каждого источника, ${YEAR} год`}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={PIE_ROWS} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={95} strokeWidth={0}>
                                    {PIE_ROWS.map((r, i) => <Cell key={i} fill={r.color} />)}
                                </Pie>
                                <Tooltip content={({ active, payload }: any) => {
                                    if (!active || !payload?.length) return null
                                    const pct = ((payload[0].value / pieTotal) * 100).toFixed(1)
                                    return (
                                        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm">
                                            <p className="font-semibold mb-1 text-foreground">{payload[0].name}</p>
                                            <p>{fmtNum(payload[0].value)} <span className="text-muted-foreground">({pct}%)</span></p>
                                        </div>
                                    )
                                }} />
                                <Legend iconSize={10} wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                            Основа бюджета — НДФЛ и налог на прибыль организаций
                        </p>
                    </ChartCard>

                    <ChartCard title="Зависимость от трансфертов" subtitle="Доля безвозмездных поступлений в общих доходах, %">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={DEPENDENCY_ROWS} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                <Bar dataKey="value" name="Доля трансфертов" radius={[6, 6, 0, 0]} barSize={64}>
                                    {DEPENDENCY_ROWS.map((r, i) => <Cell key={i} fill={r.fill} />)}
                                    <LabelList dataKey="value" position="top" formatter={(v: any) => `${v.toFixed(1)}%`} style={{ fontSize: 11, fill: 'currentColor' } as React.CSSProperties} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                            {REGION_NAME} меньше других зависит от межбюджетных трансфертов
                        </p>
                    </ChartCard>
                </div>

                {/* Таблица сравнения */}
                <div className="card-block rounded-2xl p-5 mb-6 overflow-x-auto">
                    <h3 className="font-semibold mb-4 text-foreground" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Сравнение доходных показателей
                    </h3>
                    <table className="w-full text-sm" style={{ minWidth: 640 }}>
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Показатель</th>
                                <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--budget-gold)' }}>{REGION_NAME}</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">{DISTRICT_NAME}, сред.</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">Страна, сред.</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">к округу</th>
                                <th className="text-right py-2 px-3 font-medium text-muted-foreground">к стране</th>
                            </tr>
                        </thead>
                        <tbody>
                            {TABLE_ROWS.map((row, i) => {
                                const dDistrict = row.own / row.district - 1
                                const dNational = row.national != null ? row.own / row.national - 1 : null
                                return (
                                    <tr key={i} className="border-b border-border/40 hover:bg-foreground/5 transition-colors">
                                        <td className="py-2 px-3 text-foreground">{row.name}</td>
                                        <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--budget-gold)' }}>{fmtNum(row.own)}</td>
                                        <td className="py-2 px-3 text-right text-muted-foreground">{fmtNum(row.district)}</td>
                                        <td className="py-2 px-3 text-right text-muted-foreground">{row.national != null ? fmtNum(row.national) : '—'}</td>
                                        <td className={`py-2 px-3 text-right text-xs font-semibold ${dDistrict >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                            {dDistrict >= 0 ? '+' : ''}{(dDistrict * 100).toFixed(1)}%
                                        </td>
                                        <td className={`py-2 px-3 text-right text-xs font-semibold ${dNational == null ? 'text-muted-foreground' : dNational >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                                            {dNational == null ? '—' : `${dNational >= 0 ? '+' : ''}${(dNational * 100).toFixed(1)}%`}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Регион, округ и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                    <br />Демонстрационная форма {REPORT_FORM} · отчёт от {REPORT_DATE}
                </p>
            </div>
        </div>
    )
}
