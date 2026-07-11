import { useMemo, useState } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine, LabelList, Cell,
} from 'recharts'
import {
    SECTIONS, CATEGORIES, REGION_NAMES, OWN_INDEX, DISTRICT_NAME_GEN, UPDATED_AT,
    Category, districtAvg, districtRank, fmtVal, fmtDev,
} from './data'
import {
    ACCENT, useStatFonts, StatisticsNav, StatisticsHero, ReadoutStrip, ReadoutField,
    DevBadge, ChartTooltip, ChartCard,
} from './ui'

const REGION_NAME = REGION_NAMES[OWN_INDEX]

function CategoryCard({ cat }: { cat: Category }) {
    const irkVal = cat.values[OWN_INDEX]
    const sfoVal = districtAvg(cat)
    const isAbove = irkVal >= sfoVal
    const { rank, count } = districtRank(cat)

    return (
        <div className={`card-block rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5 hover:shadow-md border-l-4 ${
            isAbove ? 'border-l-emerald-500' : 'border-l-rose-500'
        }`}>
            <div className="flex justify-between items-center border-b border-dashed border-border pb-2">
                <span className="font-mono text-[0.65rem] font-semibold bg-[var(--stat-lime)]/15 text-[var(--stat-lime-dim)] px-2 py-0.5 rounded-full">
                    {cat.code}
                </span>
                <span className="text-[0.65rem] text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full">{cat.unit}</span>
            </div>

            <p className="font-bold text-foreground text-sm leading-snug">{cat.name}</p>

            <div className="flex gap-2">
                {([
                    { label: 'Онежская обл.', val: irkVal },
                    { label: 'Страна', val: cat.country },
                    { label: 'Округ', val: sfoVal },
                ] as const).map(({ label, val }) => (
                    <div key={label} className="flex-1 text-center bg-foreground/5 rounded-xl py-2 px-1">
                        <p className="text-[0.58rem] uppercase text-muted-foreground tracking-wide leading-none">{label}</p>
                        <p className="font-bold text-foreground text-base mt-1" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{fmtVal(val, cat.unit)}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs bg-[var(--stat-lime)]/15 text-[var(--stat-lime-dim)] px-3 py-1 rounded-full font-semibold">
                    место в округе: {rank} / {count}
                </span>
                <span className={`text-xs font-semibold ${isAbove ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isAbove ? '▲ выше округа' : '▼ ниже округа'}
                </span>
            </div>
        </div>
    )
}

export default function StatisticsOverview() {
    useStatFonts()
    const [sectionId, setSectionId] = useState<number>(SECTIONS[0].id)

    const sectionCategories = useMemo(() => CATEGORIES.filter(c => c.sectionId === sectionId), [sectionId])
    const sectionName = SECTIONS.find(s => s.id === sectionId)?.name ?? ''

    const { aboveData, belowData } = useMemo(() => {
        const withDev = sectionCategories.map(c => {
            const sfoVal = districtAvg(c)
            const devRf = c.country > 0 ? (c.values[OWN_INDEX] / c.country - 1) * 100 : 0
            const devSfo = sfoVal > 0 ? (c.values[OWN_INDEX] / sfoVal - 1) * 100 : 0
            return { name: c.name, devRf, devSfo, isAbove: c.values[OWN_INDEX] >= sfoVal }
        })
        const above = withDev.filter(c => c.isAbove).sort((a, b) => (b.devRf + b.devSfo) - (a.devRf + a.devSfo))
            .map(c => ({ name: c.name, rf: +c.devRf.toFixed(1), sfo: +c.devSfo.toFixed(1) }))
        const below = withDev.filter(c => !c.isAbove).sort((a, b) => (a.devRf + a.devSfo) - (b.devRf + b.devSfo))
            .map(c => ({ name: c.name, rf: +c.devRf.toFixed(1), sfo: +c.devSfo.toFixed(1) }))
        return { aboveData: above, belowData: below }
    }, [sectionCategories])

    const histCat = sectionCategories[0]
    const histData = useMemo(() => {
        if (!histCat) return []
        const avg = districtAvg(histCat)
        return REGION_NAMES.map((name, i) => ({
            name: name.replace(' область', ' обл.').replace(' край', ' кр.'),
            dev: +(histCat.values[i] - avg).toFixed(1),
        })).sort((a, b) => b.dev - a.dev)
    }, [histCat])

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <StatisticsHero
                eyebrow={`Статистическое наблюдение · ${sectionName}`}
                title="Статистические данные"
                subtitle={`Ключевые социально-экономические показатели ${REGION_NAME} в сравнении со страной и ${DISTRICT_NAME_GEN}.`}
            >
                <ReadoutStrip>
                    <ReadoutField label="Раздел" value={sectionName} />
                    <ReadoutField label="Регионов в выборке" value={String(REGION_NAMES.length)} />
                    <ReadoutField label="Обновлено" value={UPDATED_AT} />
                    <ReadoutField label="Статус" value="В эфире" />
                </ReadoutStrip>
            </StatisticsHero>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <StatisticsNav />

                {/* Выбор раздела */}
                <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap gap-2">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setSectionId(s.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
                            style={sectionId === s.id
                                ? { background: 'var(--stat-lime)', color: '#0e1a22', borderColor: 'var(--stat-lime)' }
                                : { borderColor: 'transparent' }}
                        >
                            <span className={sectionId === s.id ? '' : 'text-muted-foreground hover:text-foreground'}>{s.name}</span>
                        </button>
                    ))}
                </div>

                {/* Карточки показателей */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                    {sectionCategories.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                </div>

                {/* Графики отклонений */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {aboveData.length > 0 && (
                        <ChartCard title="Выше среднего" subtitle="Отклонение от страны и округа, %">
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={aboveData} margin={{ top: 24, right: 16, left: 0, bottom: 90 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" />
                                    <Bar dataKey="rf" name="от страны" fill="var(--stat-lime)" radius={[4, 4, 0, 0]} barSize={18}>
                                        <LabelList dataKey="rf" position="top" formatter={(v: any) => fmtDev(v)} style={{ fontSize: 9, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                    <Bar dataKey="sfo" name="от округа" fill="var(--stat-lime-dim)" radius={[4, 4, 0, 0]} barSize={18}>
                                        <LabelList dataKey="sfo" position="top" formatter={(v: any) => fmtDev(v)} style={{ fontSize: 9, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}
                    {belowData.length > 0 && (
                        <ChartCard title="Ниже среднего" subtitle="Отклонение от страны и округа, %">
                            <ResponsiveContainer width="100%" height={340}>
                                <BarChart data={belowData} margin={{ top: 24, right: 16, left: 0, bottom: 90 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor' }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
                                    <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    <ReferenceLine y={0} stroke="rgba(148,163,184,0.4)" />
                                    <Bar dataKey="rf" name="от страны" fill="#b1493f" radius={[4, 4, 0, 0]} barSize={18}>
                                        <LabelList dataKey="rf" position="top" formatter={(v: any) => fmtDev(v)} style={{ fontSize: 9, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                    <Bar dataKey="sfo" name="от округа" fill="#d98b7f" radius={[4, 4, 0, 0]} barSize={18}>
                                        <LabelList dataKey="sfo" position="top" formatter={(v: any) => fmtDev(v)} style={{ fontSize: 9, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    )}
                </div>

                {/* Гистограмма регионов округа */}
                {histCat && (
                    <div className="card-block rounded-2xl p-5 mb-6">
                        <h3 className="font-semibold text-foreground" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                            Регионы округа — отклонение от среднего
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 mb-4">
                            {histCat.name} · среднее по округу: <strong className="text-foreground">{fmtVal(districtAvg(histCat), histCat.unit)}</strong>
                        </p>
                        <ResponsiveContainer width="100%" height={Math.max(260, histData.length * 42)}>
                            <BarChart data={histData} layout="vertical" margin={{ top: 0, right: 70, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                                <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={v => `${v > 0 ? '+' : ''}${v}`} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} width={130} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                <ReferenceLine x={0} stroke="rgba(148,163,184,0.5)" strokeWidth={1.5} />
                                <Bar dataKey="dev" name="Отклонение" radius={[0, 4, 4, 0]} barSize={20}>
                                    {histData.map((row, i) => (
                                        <Cell key={i} fill={row.dev >= 0 ? '#2f6f5e' : '#b1493f'} />
                                    ))}
                                    <LabelList dataKey="dev" position="right" formatter={(v: any) => `${v > 0 ? '+' : ''}${v}`} style={{ fontSize: 10, fill: 'currentColor' } as React.CSSProperties} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Отклонение (п.п.) от среднего по округу. Зелёный текст — выше среднего, ниже нуля — красный.
                        </p>
                    </div>
                )}

                <p className="text-center text-xs text-muted-foreground pb-4">
                    * Регион, округ и все показатели вымышлены — интерактивный пример вёрстки для портфолио.
                </p>
            </div>
        </div>
    )
}
