import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, LabelList, ReferenceLine,
} from 'recharts'
import {
    ORG_NAME, REGION_LABEL, REPORT_DATE, SOURCE_FILE, INDICATORS, Indicator,
    branchRows, topAndBottom, fmt, BranchRow,
} from './data'
import {
    ACCENT, useRatingFonts, RatingNav, RatingHero, XTickAngled,
    ReportMeta, DISPLAY_FONT, MONO_FONT,
} from './ui'

const COLOR_OK = '#3b82f6'
const COLOR_BELOW = '#ef4444'
const COLOR_IRK_OK = '#22c55e'
const COLOR_IRK_BAD = '#ef4444'
const COLOR_IRK_NEU = '#3b82f6'
const COLOR_REFLINE = '#ff9d2e'

const CHART_INDICATORS = INDICATORS.filter(i => i.sectionId === 1)

function LaborTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-[220px]">
            <p className="font-semibold mb-1 text-foreground leading-tight text-xs">{label}</p>
            <p className="font-medium" style={MONO_FONT}>{fmt(payload[0].value)}%</p>
        </div>
    )
}

function IndicatorBlock({ ind }: { ind: Indicator }) {
    const { threshold, thresholdLabel, lowerIsBetter, own } = ind
    const branches = branchRows(ind)
    const { top, bottom } = topAndBottom(ind)

    const irkGood = threshold === null ? null : lowerIsBetter ? own <= threshold : own >= threshold
    const irkColor = irkGood === null ? COLOR_IRK_NEU : irkGood ? COLOR_IRK_OK : COLOR_IRK_BAD
    const minW = Math.max(380, branches.length * 60)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 card-block rounded-2xl p-5">
                <h2 className="text-center text-xl tracking-wide mb-1 text-foreground px-4 leading-snug" style={DISPLAY_FONT}>
                    {ind.name}
                </h2>
                <p className="text-center text-xs mb-3 text-muted-foreground px-6">{ind.shortName}</p>

                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mb-3 px-4 py-2 bg-foreground/5 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                        <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: lowerIsBetter ? COLOR_IRK_OK : COLOR_OK }} />
                        <span>{lowerIsBetter ? 'Ниже порога (норма)' : 'Выполнение плана'}</span>
                    </div>
                    {threshold !== null && (
                        <div className="flex items-center gap-1.5 font-medium">
                            <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: COLOR_BELOW }} />
                            <span>{lowerIsBetter ? 'Выше порога' : 'Ниже плана'}</span>
                        </div>
                    )}
                    {threshold !== null && (
                        <div className="flex items-center gap-1.5 font-medium">
                            <span className="w-5 h-0.5 rounded flex-shrink-0" style={{ background: COLOR_REFLINE }} />
                            <span>{thresholdLabel}</span>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <div style={{ minWidth: minW }}>
                        <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={branches} margin={{ top: 28, right: 16, left: 4, bottom: 105 }} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                <XAxis dataKey="name" tick={<XTickAngled />} tickLine={false} axisLine={false} interval={0} />
                                <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={44} />
                                <Tooltip content={<LaborTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                {threshold !== null && (
                                    <ReferenceLine y={threshold} stroke={COLOR_REFLINE} strokeDasharray="6 3" strokeWidth={1.5}
                                        label={{ value: `${threshold}%`, position: 'insideTopRight', fontSize: 10, fill: COLOR_REFLINE, offset: 6 }} />
                                )}
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {branches.map((row, i) => (
                                        <Cell key={i} fill={
                                            threshold === null ? COLOR_OK :
                                            lowerIsBetter ? (row.value <= threshold ? COLOR_IRK_OK : COLOR_BELOW)
                                                : (row.value >= threshold ? COLOR_OK : COLOR_BELOW)
                                        } />
                                    ))}
                                    <LabelList dataKey="value" position="top" formatter={(v: any) => `${fmt(v)}%`} style={{ fontSize: 10, fill: 'currentColor' } as React.CSSProperties} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="card-block rounded-2xl p-5 flex flex-col gap-3 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{REGION_LABEL}</p>
                    <p className="text-sm leading-snug flex-1 min-h-[2.5rem] text-foreground">{ind.shortName}</p>
                    <p className="text-4xl font-bold" style={{ color: irkColor, ...MONO_FONT }}>{fmt(own)}%</p>
                    {threshold !== null && (
                        <div className={`text-xs px-3 py-2 rounded-lg leading-snug ${irkGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {lowerIsBetter
                                ? irkGood ? `↓ Ниже порога на ${fmt(threshold - own)}%` : `↑ Выше порога на ${fmt(own - threshold)}%`
                                : irkGood ? `↑ Выше плана на ${fmt(own - threshold)}%` : `↓ Ниже плана на ${fmt(threshold - own)}%`}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground border-t border-border pt-2 mt-auto">{thresholdLabel}</p>
                </div>

                <BranchList title="Топ-5 первых" items={top} tone="emerald" />
                <BranchList title="Топ-5 последних" items={bottom} tone="rose" />
            </div>
        </div>
    )
}

function BranchList({ title, items, tone }: { title: string; items: BranchRow[]; tone: 'emerald' | 'rose' }) {
    if (!items.length) return null
    const ring = tone === 'emerald' ? 'ring-1 ring-emerald-500/30 shadow-[0_0_18px_2px_rgba(34,197,94,0.08)]' : 'ring-1 ring-rose-500/30 shadow-[0_0_18px_2px_rgba(244,63,94,0.08)]'
    const badgeCls = tone === 'emerald' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
    const textCls = tone === 'emerald' ? 'text-emerald-400' : 'text-rose-400'
    return (
        <div className={`card-block rounded-2xl p-5 flex flex-col gap-2 flex-1 ${ring}`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <span className={`self-start text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badgeCls}`}>
                {tone === 'emerald' ? 'Лидеры' : 'Отстающие'}
            </span>
            <ul className="flex-1 space-y-2">
                {items.map((b, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 text-sm">
                        <span className="flex items-start gap-1.5">
                            <span className={`${textCls} font-bold flex-shrink-0`}>{i + 1}.</span>
                            <span className="text-foreground leading-snug">{b.name}</span>
                        </span>
                        <span className={`font-bold ${textCls} flex-shrink-0`} style={MONO_FONT}>{fmt(b.value)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default function IndicatorsPage() {
    useRatingFonts()
    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <RatingHero
                eyebrow="Показатели по всем филиалам"
                title="Исполнение показателей"
                subtitle={`${ORG_NAME}: сравнение ${REGION_LABEL} с каждым филиалом по восьми плановым показателям занятости.`}
            />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <RatingNav />
                <ReportMeta date={REPORT_DATE} file={SOURCE_FILE} />
                {CHART_INDICATORS.map(ind => <IndicatorBlock key={ind.id} ind={ind} />)}
                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Организация, филиалы и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
