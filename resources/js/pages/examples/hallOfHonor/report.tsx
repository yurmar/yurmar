import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList,
} from 'recharts'
import { ArrowLeft, BrushCleaning, Printer, Award } from 'lucide-react'
import { HonorNav } from './HonorNav'
import { INITIAL_HONOREES, NOMINATIONS, FIELDS, BRANCHES, APPROVAL_DECISIONS, Honoree } from './data'
import { ACCENT, SPACE_GROTESK, useSpaceGrotesk } from './ui'

const PIE_COLORS = ['#ff6b4a', '#0f8a80', '#ffb199', '#134e4a', '#f4a261']
const BAR_COLORS = { year: '#0f3d3e', field: '#ff6b4a', branch: '#2d7d7a' }

function truncate(s: string, n = 28) { return s.length > n ? s.slice(0, n) + '…' : s }

function topN<K>(map: Map<K, number>, n: number): [K, number][] {
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, n)
}

function ReportTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    const name = label ?? payload[0]?.name
    const val = payload[0]?.value
    const color = payload[0]?.fill || payload[0]?.color
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-xs">
            <p className="font-semibold mb-1 text-foreground leading-tight">{name}</p>
            <p className="font-medium" style={{ color }}>{val}</p>
        </div>
    )
}

function KpiCard({ label, value, sub, color, items, onItemClick }: {
    label: string; value: number; sub: string; color: string
    items?: { id: number; name: string; value: number }[]
    onItemClick?: (id: number) => void
}) {
    const [open, setOpen] = useState(false)
    return (
        <div className="card-block rounded-2xl p-4 flex flex-col min-h-[9rem]">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-1 font-mono tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            {items && items.length > 0 && (
                <>
                    <button onClick={() => setOpen(o => !o)} className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-2 flex items-center gap-1 self-start">
                        {open ? 'Скрыть список' : 'Показать список'}
                        <span className="inline-block transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </button>
                    {open && (
                        <ul className="w-full mt-1 space-y-1 text-xs text-left max-h-[200px] overflow-y-auto pr-1">
                            {items.map(item => (
                                <li key={item.id} onClick={() => onItemClick?.(item.id)}
                                    className={`flex items-start justify-between gap-2 rounded px-1 py-0.5 transition-colors ${onItemClick ? 'cursor-pointer hover:bg-foreground/5' : ''}`}>
                                    <span className="flex items-start gap-1.5 min-w-0">
                                        <span style={{ color }} className="mt-0.5 flex-shrink-0">▸</span>
                                        <span className="text-foreground/80 break-words">{item.name}</span>
                                    </span>
                                    <span className="font-medium flex-shrink-0" style={{ color }}>{item.value}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    )
}

function BranchAxisTick({ x, y, payload }: any) {
    const text: string = payload?.value ?? ''
    const maxChars = 24
    const lines: string[] = []
    if (text.length <= maxChars) lines.push(text)
    else {
        const words = text.split(' ')
        let line = ''
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word
            if (candidate.length > maxChars && line) { lines.push(line); line = word } else line = candidate
        }
        if (line) lines.push(line)
    }
    const lineH = 13
    return (
        <g transform={`translate(${x},${y})`}>
            {lines.map((l, i) => (
                <text key={i} x={-4} y={(i - (lines.length - 1) / 2) * lineH} textAnchor="end" dominantBaseline="central" fill="currentColor" fontSize={9}>{l}</text>
            ))}
        </g>
    )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="card-block rounded-2xl p-4">
            <p className="font-semibold mb-3 text-foreground text-sm">{title}</p>
            {children}
        </div>
    )
}

function EmptyChart() {
    return <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Нет данных для отображения</div>
}

export default function HallOfHonorReport() {
    useSpaceGrotesk()

    const rawHonorees: Honoree[] = INITIAL_HONOREES

    const [yearFilter, setYearFilter] = useState<number | null>(null)
    const [branchFilter, setBranchFilter] = useState<number | null>(null)
    const [awardFilter, setAwardFilter] = useState<number | null>(null)
    const [decisionFilter, setDecisionFilter] = useState<number | null>(null)
    const [fieldFilter, setFieldFilter] = useState<number | null>(null)

    const filtered = useMemo(() => rawHonorees.filter(u => {
        if (yearFilter !== null && u.year !== yearFilter) return false
        if (branchFilter !== null && u.branchId !== branchFilter) return false
        if (awardFilter !== null && u.awardId !== awardFilter) return false
        if (decisionFilter !== null && u.decisionAuthorityId !== decisionFilter) return false
        if (fieldFilter !== null && u.fieldId !== fieldFilter) return false
        return true
    }), [rawHonorees, yearFilter, branchFilter, awardFilter, decisionFilter, fieldFilter])

    const filteredAllYears = useMemo(() => rawHonorees.filter(u => {
        if (branchFilter !== null && u.branchId !== branchFilter) return false
        if (awardFilter !== null && u.awardId !== awardFilter) return false
        if (decisionFilter !== null && u.decisionAuthorityId !== decisionFilter) return false
        if (fieldFilter !== null && u.fieldId !== fieldFilter) return false
        return true
    }), [rawHonorees, branchFilter, awardFilter, decisionFilter, fieldFilter])

    const kpi = useMemo(() => ({
        total: filtered.length,
        uniqueAwards: new Set(filtered.filter(u => u.awardId).map(u => u.awardId)).size,
        uniqueBranches: new Set(filtered.filter(u => u.branchId).map(u => u.branchId)).size,
        uniqueFields: new Set(filtered.filter(u => u.fieldId).map(u => u.fieldId)).size,
    }), [filtered])

    const awardItems = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.awardId) m.set(u.awardId, (m.get(u.awardId) ?? 0) + 1) })
        return Array.from(m.entries()).map(([id, value]) => ({ id, name: NOMINATIONS.find(a => a.id === id)?.title ?? '', value })).filter(i => i.name).sort((a, b) => b.value - a.value)
    }, [filtered])

    const branchItems = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.branchId) m.set(u.branchId, (m.get(u.branchId) ?? 0) + 1) })
        return Array.from(m.entries()).map(([id, value]) => ({ id, name: BRANCHES.find(r => r.id === id)?.title ?? '', value })).filter(i => i.name).sort((a, b) => b.value - a.value)
    }, [filtered])

    const fieldItems = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.fieldId) m.set(u.fieldId, (m.get(u.fieldId) ?? 0) + 1) })
        return Array.from(m.entries()).map(([id, value]) => ({ id, name: FIELDS.find(f => f.id === id)?.title ?? '', value })).filter(i => i.name).sort((a, b) => b.value - a.value)
    }, [filtered])

    const yearChartData = useMemo(() => {
        const m = new Map<number, number>()
        filteredAllYears.forEach(u => m.set(u.year, (m.get(u.year) ?? 0) + 1))
        return Array.from(m.entries()).sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count }))
    }, [filteredAllYears])

    const awardPieData = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.awardId) m.set(u.awardId, (m.get(u.awardId) ?? 0) + 1) })
        return topN(m, 5).map(([id, value]) => ({ name: truncate(NOMINATIONS.find(a => a.id === id)?.title ?? '', 34), value })).filter(d => d.name !== '')
    }, [filtered])

    const fieldChartData = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.fieldId) m.set(u.fieldId, (m.get(u.fieldId) ?? 0) + 1) })
        return topN(m, 6).map(([id, count]) => ({ name: truncate(FIELDS.find(f => f.id === id)?.title ?? '—', 26), count }))
    }, [filtered])

    const branchChartData = useMemo(() => {
        const m = new Map<number, number>()
        filtered.forEach(u => { if (u.branchId) m.set(u.branchId, (m.get(u.branchId) ?? 0) + 1) })
        return topN(m, 6).map(([id, count]) => ({ name: BRANCHES.find(r => r.id === id)?.title ?? '—', count }))
    }, [filtered])

    const resetFilters = () => { setYearFilter(null); setBranchFilter(null); setAwardFilter(null); setDecisionFilter(null); setFieldFilter(null) }

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2b2c 0%, #0f3d3e 55%, #0a2426 100%)' }}>
                <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                    <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                        <ArrowLeft size={13} /> Все примеры
                    </Link>
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff8f74]">
                            <Award size={13} /> Доска почёта · аналитика
                        </span>
                        <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight text-white" style={SPACE_GROTESK}>Аналитика</h1>
                        <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">
                            Динамика признания по годам, номинациям, направлениям деятельности и филиалам.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <HonorNav />

                <div className="card-block rounded-2xl p-4 mb-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Год</p>
                            <select value={yearFilter ?? ''} onChange={e => setYearFilter(e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все года</option>
                                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Филиал</p>
                            <select value={branchFilter ?? ''} onChange={e => setBranchFilter(e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все</option>
                                {BRANCHES.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Номинация</p>
                            <select value={awardFilter ?? ''} onChange={e => setAwardFilter(e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все</option>
                                {NOMINATIONS.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Решение подразделения</p>
                            <select value={decisionFilter ?? ''} onChange={e => setDecisionFilter(e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все</option>
                                {APPROVAL_DECISIONS.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Направление деятельности</p>
                            <select value={fieldFilter ?? ''} onChange={e => setFieldFilter(e.target.value ? Number(e.target.value) : null)} className="w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все</option>
                                {FIELDS.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between mt-3">
                        <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-sm text-white flex items-center gap-2" style={{ background: 'var(--honor-ink)' }}>
                            <Printer size={14} /> Распечатать PDF
                        </button>
                        <button onClick={resetFilters} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2">
                            <BrushCleaning size={14} /> Сбросить фильтры
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 items-start">
                    <KpiCard label="Всего номинаций" value={kpi.total} sub="записей в реестре" color="var(--honor-coral)" />
                    <KpiCard label="Видов номинаций" value={kpi.uniqueAwards} sub="различных наименований" color="#0f8a80" items={awardItems} onItemClick={setAwardFilter} />
                    <KpiCard label="Охвачено филиалов" value={kpi.uniqueBranches} sub="из 6 филиалов" color="#f4a261" items={branchItems} onItemClick={setBranchFilter} />
                    <KpiCard label="Направлений деятельности" value={kpi.uniqueFields} sub="задействованных направлений" color="#7c6fd4" items={fieldItems} onItemClick={setFieldFilter} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <ChartCard title="Динамика номинаций по годам">
                        {yearChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={yearChartData} margin={{ top: 20, right: 16, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    <Bar dataKey="count" name="Номинаций" fill={BAR_COLORS.year} radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey="count" position="top" style={{ fontSize: 11, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart />}
                    </ChartCard>

                    <ChartCard title="Топ-5 номинаций">
                        {awardPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie data={awardPieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={90} strokeWidth={0} labelLine={false}
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                            if (!percent || percent < 0.04) return null
                                            const RADIAN = Math.PI / 180
                                            const angle = midAngle ?? 0
                                            const r = innerRadius + (outerRadius - innerRadius) * 0.55
                                            const x = cx + r * Math.cos(-angle * RADIAN)
                                            const y = cy + r * Math.sin(-angle * RADIAN)
                                            return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
                                        }}>
                                        {awardPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<ReportTooltip />} />
                                    <Legend iconSize={10} wrapperStyle={{ paddingTop: 8, fontSize: 11 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart />}
                    </ChartCard>

                    <ChartCard title="Направления деятельности (топ-6)">
                        {fieldChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={fieldChartData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    <Bar dataKey="count" name="Номинаций" fill={BAR_COLORS.field} radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart />}
                    </ChartCard>

                    <ChartCard title="Филиалы-лидеры (топ-6)">
                        {branchChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={branchChartData} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" width={180} tick={<BranchAxisTick />} tickLine={false} axisLine={false} />
                                    <Tooltip content={<ReportTooltip />} cursor={{ fill: 'rgba(148,163,184,0.06)' }} />
                                    <Bar dataKey="count" name="Количество" fill={BAR_COLORS.branch} radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="count" position="right" style={{ fontSize: 11, fill: 'currentColor' } as React.CSSProperties} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <EmptyChart />}
                    </ChartCard>
                </div>
            </div>
        </div>
    )
}
