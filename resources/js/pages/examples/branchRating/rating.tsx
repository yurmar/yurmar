import { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
    ORG_NAME, REPORT_DATE, SOURCE_FILE, RATING_INDICATORS, buildRatingRows, fmt, RatingRow,
} from './data'
import {
    ACCENT, useRatingFonts, RatingNav, RatingHero, BoardStrip, BoardField,
    FlipBadge, RatingTooltip, XTickAngled, ReportMeta, DISPLAY_FONT, MONO_FONT,
} from './ui'

function RatingTooltipRow({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const valid = payload.filter((p: any) => p.value > 0)
    const avg = valid.length ? valid.reduce((s: number, p: any) => s + p.value, 0) / valid.length : 0
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-[260px]">
            <p className="font-semibold mb-2 text-foreground text-xs leading-snug">{label}</p>
            {valid.map((p: any, i: number) => (
                <div key={i} className="flex justify-between gap-2 text-xs py-0.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.fill }} />
                        <span className="text-muted-foreground truncate">{p.name}</span>
                    </span>
                    <span className="font-bold flex-shrink-0" style={MONO_FONT}>{fmt(p.value)}%</span>
                </div>
            ))}
            <div className="border-t border-border mt-2 pt-1 flex justify-between text-xs font-bold">
                <span>Средний балл</span>
                <span style={MONO_FONT}>{fmt(avg)}%</span>
            </div>
        </div>
    )
}

function BranchCard({ branch, rank, type }: { branch: RatingRow; rank: number; type: 'best' | 'worst' }) {
    const isBest = type === 'best'
    const ringCls = isBest
        ? 'ring-1 ring-emerald-500/30 shadow-[0_0_18px_2px_rgba(34,197,94,0.08)]'
        : 'ring-1 ring-rose-500/30 shadow-[0_0_18px_2px_rgba(244,63,94,0.08)]'
    const badgeCls = isBest ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
    const valueCls = isBest ? 'text-emerald-400' : 'text-rose-400'
    const heading = isBest ? 'Лучший филиал' : 'Худший филиал'
    const badge = isBest ? 'Лидер' : 'Отстающий'

    return (
        <div className={`card-block rounded-2xl p-5 flex flex-col gap-3 ${ringCls}`}>
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{heading}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${badgeCls}`}>{badge}</span>
            </div>

            <div className="flex items-center gap-3">
                <FlipBadge value={rank} size="lg" tone={isBest ? 'emerald' : 'rose'} />
                <p className="text-base font-bold leading-snug flex-1 text-foreground">{branch.name}</p>
            </div>

            <div className="flex items-end gap-4">
                <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Средний балл</p>
                    <p className={`text-3xl font-bold ${valueCls}`} style={MONO_FONT}>{fmt(branch.avg)}%</p>
                </div>
                <div className="pb-1">
                    <p className="text-[10px] text-muted-foreground mb-0.5">Показателей выполнено</p>
                    <p className="text-lg font-bold text-foreground" style={MONO_FONT}>
                        {branch.aboveCount} <span className="text-sm font-normal text-muted-foreground">из {RATING_INDICATORS.filter(c => c.threshold !== null).length}</span>
                    </p>
                </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
                {RATING_INDICATORS.map(cfg => {
                    const val = branch.scores[cfg.key]
                    const isAbove = cfg.threshold !== null && val >= cfg.threshold
                    const isBelow = cfg.threshold !== null && val < cfg.threshold
                    return (
                        <div key={cfg.key} className="flex items-center justify-between gap-2 text-xs">
                            <span className="flex items-center gap-1.5 min-w-0">
                                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: cfg.color }} />
                                <span className="text-muted-foreground truncate">{cfg.shortName}</span>
                            </span>
                            <span className={`font-bold flex-shrink-0 ${isAbove ? 'text-emerald-400' : isBelow ? 'text-rose-400' : 'text-foreground'}`} style={MONO_FONT}>
                                {fmt(val)}%{cfg.threshold !== null && <span className="text-[10px] ml-1 opacity-60">{isAbove ? '↑' : '↓'}</span>}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function BranchRatingPage() {
    useRatingFonts()
    const rows = useMemo(() => buildRatingRows(), [])
    const best = rows[0]
    const worst = rows[rows.length - 1]
    const minW = Math.max(560, rows.length * 78)

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <RatingHero
                eyebrow="Табло исполнения показателей"
                title="Рейтинг филиалов"
                subtitle={`${ORG_NAME}: сводный рейтинг филиалов по исполнению плановых показателей занятости.`}
            >
                <BoardStrip>
                    <BoardField label="Филиалов" value={String(rows.length)} />
                    <BoardField label="Лидер" value={best.name} />
                    <BoardField label="Отчёт от" value={REPORT_DATE} />
                    <BoardField label="Статус" value="Актуально" />
                </BoardStrip>
            </RatingHero>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <RatingNav />
                <ReportMeta date={REPORT_DATE} file={SOURCE_FILE} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <BranchCard branch={best} rank={1} type="best" />
                    <BranchCard branch={worst} rank={rows.length} type="worst" />
                </div>

                <div className="card-block rounded-2xl p-5 mb-6">
                    <h2 className="text-center text-2xl tracking-wide text-foreground" style={DISPLAY_FONT}>
                        Рейтинг филиалов по процентным показателям
                    </h2>
                    <p className="text-center text-xs text-muted-foreground mb-4">
                        Наборный столбец — значения показателей в %, сортировка по убыванию среднего балла
                    </p>

                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 mb-4 px-4 py-2.5 bg-foreground/5 rounded-xl">
                        {RATING_INDICATORS.map(cfg => (
                            <div key={cfg.key} className="flex items-center gap-1.5 text-xs">
                                <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: cfg.color }} />
                                <span className="font-medium">{cfg.shortName}</span>
                                {cfg.threshold !== null && <span className="text-muted-foreground">(план {cfg.threshold}%)</span>}
                            </div>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <div style={{ minWidth: minW }}>
                            <ResponsiveContainer width="100%" height={420}>
                                <BarChart data={rows.map(r => ({ name: r.name, ...r.scores }))} margin={{ top: 16, right: 16, left: 4, bottom: 110 }} barCategoryGap="28%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis dataKey="name" tick={<XTickAngled />} tickLine={false} axisLine={false} interval={0} />
                                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} width={44} />
                                    <Tooltip content={<RatingTooltipRow />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    {RATING_INDICATORS.map((cfg, i) => (
                                        <Bar key={cfg.key} dataKey={cfg.key} name={cfg.shortName} stackId="a" fill={cfg.color}
                                            radius={i === RATING_INDICATORS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="card-block rounded-2xl p-5 mb-6">
                    <h3 className="font-semibold mb-4 text-foreground" style={DISPLAY_FONT}>Сводная таблица рейтинга</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-border text-muted-foreground text-left">
                                    <th className="pb-2 pr-3 font-semibold w-8">#</th>
                                    <th className="pb-2 pr-4 font-semibold">Филиал</th>
                                    {RATING_INDICATORS.map(cfg => (
                                        <th key={cfg.key} className="pb-2 px-2 font-semibold text-center whitespace-nowrap">
                                            <span className="flex items-center justify-center gap-1">
                                                <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: cfg.color }} />
                                                {cfg.shortName}
                                            </span>
                                        </th>
                                    ))}
                                    <th className="pb-2 pl-3 font-semibold text-right whitespace-nowrap">Средний балл</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => {
                                    const isFirst = idx === 0
                                    const isLast = idx === rows.length - 1
                                    return (
                                        <tr key={row.name} className={`border-b border-border/50 transition-colors hover:bg-foreground/5 ${isFirst ? 'bg-emerald-500/5' : isLast ? 'bg-rose-500/5' : ''}`}>
                                            <td className="py-2 pr-3 font-bold text-muted-foreground">{idx + 1}</td>
                                            <td className="py-2 pr-4 font-medium text-foreground whitespace-nowrap">
                                                {row.name}
                                                {isFirst && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">★</span>}
                                                {isLast && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">↓</span>}
                                            </td>
                                            {RATING_INDICATORS.map(cfg => {
                                                const val = row.scores[cfg.key]
                                                const isAbove = cfg.threshold !== null && val >= cfg.threshold
                                                const isBelow = cfg.threshold !== null && val < cfg.threshold
                                                return (
                                                    <td key={cfg.key} className="py-2 px-2 text-center">
                                                        <span className={`font-medium ${isAbove ? 'text-emerald-400' : isBelow ? 'text-rose-400' : 'text-muted-foreground'}`} style={MONO_FONT}>
                                                            {fmt(val)}%
                                                        </span>
                                                    </td>
                                                )
                                            })}
                                            <td className="py-2 pl-3 text-right font-bold text-foreground" style={MONO_FONT}>{fmt(row.avg)}%</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Организация, филиалы и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
