import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, LabelList, Cell, ReferenceLine,
} from 'recharts'
import {
    ORG_NAME, REGION_LABEL, REPORT_DATE, SOURCE_FILE, SECTIONS, INDICATORS,
    branchRows, topAndBottom, fmt, fmtUnit,
} from './data'
import {
    ACCENT, useRatingFonts, RatingNav, RatingHero, XTickAngled, ReportMeta, DISPLAY_FONT, MONO_FONT,
} from './ui'

const COLOR_BAR = '#3b82f6'
const COLOR_GREEN = '#22c55e'
const COLOR_RED = '#ef4444'
const COLOR_REFLINE = '#ff9d2e'

function ComparisonTooltip({ active, payload, label, unit }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-[220px]">
            <p className="font-semibold mb-1 text-foreground leading-tight text-xs">{label}</p>
            <p className="font-medium" style={MONO_FONT}>{fmtUnit(payload[0].value, unit)}</p>
        </div>
    )
}

export default function ComparisonPage() {
    useRatingFonts()
    const [searchParams] = useSearchParams()
    const urlSectionId = searchParams.get('sectionId') ? Number(searchParams.get('sectionId')) : null
    const urlIndicatorId = searchParams.get('indicatorId') ? Number(searchParams.get('indicatorId')) : null

    const [sectionId, setSectionId] = useState<number>(urlSectionId ?? SECTIONS[0].id)
    const sectionIndicators = useMemo(() => INDICATORS.filter(i => i.sectionId === sectionId), [sectionId])
    const [indicatorId, setIndicatorId] = useState<number>(urlIndicatorId ?? sectionIndicators[0].id)

    useEffect(() => {
        if (!sectionIndicators.some(i => i.id === indicatorId)) {
            setIndicatorId(sectionIndicators[0]?.id)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sectionId])

    const indicator = INDICATORS.find(i => i.id === indicatorId) ?? sectionIndicators[0]
    const branches = branchRows(indicator)
    const { top, bottom } = topAndBottom(indicator)
    const minW = Math.max(380, branches.length * 60)
    const { threshold, lowerIsBetter, own } = indicator

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <RatingHero
                eyebrow="Сравнение по разделам"
                title="Сравнительный анализ"
                subtitle={`${ORG_NAME}: выберите раздел и мероприятие, чтобы сравнить филиалы между собой.`}
            />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <RatingNav />
                <ReportMeta date={REPORT_DATE} file={SOURCE_FILE} />

                <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-48">
                        <label htmlFor="cmp-section" className="block text-xs text-muted-foreground mb-1">Раздел</label>
                        <select id="cmp-section" name="section" value={sectionId} onChange={e => setSectionId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                            {SECTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-[2] min-w-64">
                        <label htmlFor="cmp-indicator" className="block text-xs text-muted-foreground mb-1">Мероприятие</label>
                        <select id="cmp-indicator" name="indicator" value={indicator.id} onChange={e => setIndicatorId(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                            {sectionIndicators.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 card-block rounded-2xl p-5">
                        <h2 className="text-center text-xl tracking-wide mb-1 text-foreground px-4 leading-snug" style={DISPLAY_FONT}>
                            Сравнительный анализ по филиалам
                        </h2>
                        <p className="text-center text-xs mb-4 text-muted-foreground px-6 leading-snug">{indicator.name}</p>

                        <div className="overflow-x-auto">
                            <div style={{ minWidth: minW }}>
                                <ResponsiveContainer width="100%" height={360}>
                                    <BarChart data={branches} margin={{ top: 28, right: 16, left: 4, bottom: 105 }} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                        <XAxis dataKey="name" tick={<XTickAngled />} tickLine={false} axisLine={false} interval={0} />
                                        <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} width={54} />
                                        <Tooltip content={<ComparisonTooltip unit={indicator.unit} />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                        {threshold !== null && (
                                            <ReferenceLine y={threshold} stroke={COLOR_REFLINE} strokeDasharray="6 3" strokeWidth={1.5}
                                                label={{ value: `${threshold}%`, position: 'insideTopRight', fontSize: 10, fill: COLOR_REFLINE, offset: 6 }} />
                                        )}
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {branches.map((row, i) => (
                                                <Cell key={i} fill={
                                                    threshold === null ? COLOR_BAR :
                                                    lowerIsBetter ? (row.value <= threshold ? COLOR_GREEN : COLOR_RED) : COLOR_BAR
                                                } />
                                            ))}
                                            <LabelList dataKey="value" position="top" formatter={(v: any) => fmt(v)} style={{ fontSize: 10, fill: 'currentColor' } as React.CSSProperties} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="card-block rounded-2xl p-5 flex flex-col gap-2 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{REGION_LABEL}</p>
                            <p className="text-sm leading-snug flex-1 min-h-[2.5rem] text-foreground">{indicator.name}</p>
                            <p className="text-4xl font-bold" style={{
                                color: threshold !== null ? (lowerIsBetter ? (own <= threshold ? COLOR_GREEN : COLOR_RED) : COLOR_BAR) : COLOR_BAR,
                                ...MONO_FONT,
                            }}>
                                {fmtUnit(own, indicator.unit)}
                            </p>
                            {threshold !== null && lowerIsBetter && (
                                <div className={`text-xs px-3 py-2 rounded-lg leading-snug ${own <= threshold ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    {own <= threshold ? `↓ Ниже порога на ${fmt(threshold - own)}%` : `↑ Выше порога на ${fmt(own - threshold)}%`}
                                </div>
                            )}
                        </div>

                        {top.length > 0 && (
                            <div className="card-block rounded-2xl p-5 flex flex-col gap-2 flex-1 ring-1 ring-emerald-500/30 shadow-[0_0_18px_2px_rgba(34,197,94,0.08)]">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {lowerIsBetter ? 'Топ-5 лучших (наименьших)' : 'Топ-5 первых'}
                                </p>
                                <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Лидеры</span>
                                <ul className="flex-1 space-y-2">
                                    {top.map((b, i) => (
                                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                                            <span className="flex items-start gap-1.5">
                                                <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                                                <span className="text-foreground leading-snug">{b.name}</span>
                                            </span>
                                            <span className="font-bold text-emerald-400 flex-shrink-0" style={MONO_FONT}>{fmtUnit(b.value, indicator.unit)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {bottom.length > 0 && (
                            <div className="card-block rounded-2xl p-5 flex flex-col gap-2 flex-1 ring-1 ring-rose-500/30 shadow-[0_0_18px_2px_rgba(244,63,94,0.08)]">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {lowerIsBetter ? 'Топ-5 худших (наибольших)' : 'Топ-5 последних'}
                                </p>
                                <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400">Отстающие</span>
                                <ul className="flex-1 space-y-2">
                                    {bottom.map((b, i) => (
                                        <li key={i} className="flex items-start justify-between gap-2 text-sm">
                                            <span className="flex items-start gap-1.5">
                                                <span className="text-rose-400 font-bold flex-shrink-0">{i + 1}.</span>
                                                <span className="text-foreground leading-snug">{b.name}</span>
                                            </span>
                                            <span className="font-bold text-rose-400 flex-shrink-0" style={MONO_FONT}>{fmtUnit(b.value, indicator.unit)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Организация, филиалы и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
