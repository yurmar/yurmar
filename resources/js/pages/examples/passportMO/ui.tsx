import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowDown, ArrowUp, ChevronDown, Inbox, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react'
import { CartesianGrid, Cell, Line, LineChart, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { type Passport, type Territory } from './data'

export { BTN, BTN_GHOST, BTN_ICON, BTN_DANGER_ICON, CHIP, FIELD } from '../polls/ui'
export { CARD, Table, TD, TR } from '../jurors/ui'

export interface Ctx {
    territories: Territory[]
    setTerritories: (f: (t: Territory[]) => Territory[]) => void
    notify: (text: string) => void
}

// ==================== Форматирование ====================

export const fmtNum = (v: number | null | undefined, digits = 0): string =>
    typeof v !== 'number' || !Number.isFinite(v) ? '—' : v.toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: 0 })
export const fmtPct = (v: number | null | undefined, digits = 1): string => (v === null || v === undefined ? '—' : `${fmtNum(v, digits)}%`)
export const fmtSigned = (v: number | null | undefined, digits = 0): string => {
    if (v === null || v === undefined) return '—'
    const abs = fmtNum(Math.abs(v), digits)
    return v > 0 ? `+${abs}` : v < 0 ? `−${abs}` : abs
}
export const fmtSize = (b: number): string => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} МБ` : `${Math.max(1, Math.round(b / 1024))} КБ`)
export const fileExt = (name: string): string => /\.([a-z0-9]{1,5})$/i.exec(name.trim())?.[1].toUpperCase() ?? '—'

export const VIZ = ['#3b82f6', '#22c55e', '#f59e0b', '#94a3b8', '#ef4444', '#a855f7']
const GRID = 'rgba(148,163,184,0.2)'

// ==================== Заполненность ====================

const isFilled = (v: unknown): boolean => v !== null && v !== undefined && (typeof v === 'string' ? v.trim() !== '' : Array.isArray(v) ? v.length > 0 : true)

export const sectionFill = (data: unknown): number | null => {
    if (data === null || data === undefined || typeof data !== 'object') return null
    let total = 0
    let filled = 0
    const walk = (v: unknown): void => {
        if (v && typeof v === 'object' && !Array.isArray(v)) Object.values(v as Record<string, unknown>).forEach(walk)
        else { total += 1; if (isFilled(v)) filled += 1 }
    }
    walk(data)
    return total === 0 ? null : filled / total
}

export const tabFill = (sections: string[] | undefined, p: Passport): number | undefined => {
    if (!sections) return undefined
    const parts = sections.map(k => sectionFill((p as unknown as Record<string, unknown>)[k])).filter((x): x is number => x !== null)
    return parts.length === 0 ? 0 : parts.reduce((a, b) => a + b, 0) / parts.length
}

export const fillDot = (f: number | undefined): { cls: string; title: string } | null => {
    if (f === undefined) return null
    const pct = Math.round(f * 100)
    if (pct >= 90) return { cls: 'bg-emerald-500', title: `Заполнено ${pct}%` }
    if (pct > 0) return { cls: 'bg-amber-500', title: `Заполнено ${pct}%` }
    return { cls: 'bg-foreground/25', title: 'Не заполнено' }
}

// ==================== Блоки ====================

export const Missing = () => <span className="text-muted-foreground">—<span className="sr-only"> нет данных</span></span>

export function CardBlock({ title, icon: Icon, children, bg = false }: { title: string; icon: LucideIcon; children: ReactNode; bg?: boolean }) {
    return (
        <div className="card-block overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2.5 border-b border-border px-5 py-3.5">
                <Icon size={16} className="text-sky-500" aria-hidden />
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className={bg ? 'p-5' : ''}>{children}</div>
        </div>
    )
}

export function Stat({ label, value, suffix, hint, icon: Icon, digits = 0 }: { label: string; value: number | string | null | undefined; suffix?: string; hint?: ReactNode; icon?: LucideIcon; digits?: number }) {
    const empty = value === null || value === undefined || value === ''
    return (
        <div className="card-block rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {Icon && <Icon size={15} className="flex-shrink-0 text-sky-500" aria-hidden />}
                <span>{label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums">
                {empty ? <Missing /> : typeof value === 'number' ? fmtNum(value, digits) : value}
                {!empty && suffix && <span className="ml-1 text-sm font-medium text-muted-foreground">{suffix}</span>}
            </div>
            {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
    )
}

export const StatGrid = ({ children, cols = 4 }: { children: ReactNode; cols?: 2 | 3 | 4 }) => (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${cols === 4 ? 'lg:grid-cols-4' : cols === 3 ? 'lg:grid-cols-3' : ''}`}>{children}</div>
)

export const Fact = ({ label, children }: { label: string; children?: ReactNode }) => (
    <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words font-medium">{children ?? <Missing />}</dd>
    </div>
)

export const FactGrid = ({ children }: { children: ReactNode }) => <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>

export const EmptyHint = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Inbox size={30} className="text-sky-500" aria-hidden />
        <p className="text-sm text-muted-foreground">{text}</p>
    </div>
)

export function Collapsible({ title, children }: { title: string; children: ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="card-block rounded-2xl">
            <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left font-semibold">
                {title}
                <ChevronDown size={16} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {open && <div className="border-t border-border px-5 py-4">{children}</div>}
        </div>
    )
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[]; label: string }) {
    return (
        <div role="group" aria-label={label} className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-foreground/5 p-1">
            {options.map(o => (
                <button
                    key={o.id}
                    type="button"
                    aria-pressed={value === o.id}
                    onClick={() => onChange(o.id)}
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${value === o.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}

// ==================== Статусы ====================

export type Tone = 'ok' | 'warn' | 'bad' | 'none'
const TONE: Record<Tone, { cls: string; Icon: LucideIcon }> = {
    ok: { cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 },
    warn: { cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', Icon: AlertTriangle },
    bad: { cls: 'bg-rose-500/15 text-rose-600 dark:text-rose-400', Icon: XCircle },
    none: { cls: 'bg-sky-500/15 text-sky-600 dark:text-sky-400', Icon: MinusCircle },
}

export function StatusBadge({ tone, text }: { tone: Tone; text: string }) {
    const { cls, Icon } = TONE[tone]
    return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}><Icon size={12} aria-hidden />{text}</span>
}

// ==================== Полосы ====================

export interface BarItem { label: string; value: number | null; display?: string; color?: string }

export function BarRows({ items, max, unit = '' }: { items: BarItem[]; max?: number; unit?: string }) {
    const top = max ?? Math.max(1, ...items.map(i => i.value ?? 0))
    return (
        <ul className="space-y-3">
            {items.map((it, i) => {
                const pct = it.value === null ? 0 : Math.max(0, Math.min(100, (it.value / top) * 100))
                return (
                    <li key={`${it.label}-${i}`}>
                        <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                            <span className="min-w-0 break-words">{it.label}</span>
                            <span className="flex-shrink-0 font-semibold tabular-nums">
                                {it.value === null ? <Missing /> : <>{it.display ?? fmtNum(it.value, 1)}{unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}</>}
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: it.color ?? VIZ[0] }} />
                        </div>
                    </li>
                )
            })}
        </ul>
    )
}

export function StackedBar({ items }: { items: { label: string; value: number | null; color?: string }[] }) {
    const valid = items.filter((i): i is { label: string; value: number; color?: string } => i.value !== null && i.value > 0)
    const sum = valid.reduce((a, b) => a + b.value, 0)
    return (
        <div>
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-foreground/10" aria-hidden>
                {valid.map((i, idx) => <div key={i.label} style={{ width: `${(i.value / Math.max(sum, 100)) * 100}%`, backgroundColor: i.color ?? VIZ[idx % VIZ.length] }} />)}
            </div>
            <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm">
                {items.map((i, idx) => (
                    <li key={i.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: i.color ?? VIZ[idx % VIZ.length] }} aria-hidden />
                        <span className="min-w-0 flex-1 break-words">{i.label}</span>
                        <span className="font-semibold tabular-nums">{i.value === null ? <Missing /> : `${fmtNum(i.value, 1)}%`}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ==================== Графики ====================

function ChartTip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string | number; unit?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-lg">
            <p className="mb-0.5 font-semibold leading-tight">{label ?? payload[0].name}</p>
            <p className="font-medium">{fmtNum(payload[0].value, 1)}{unit ? ` ${unit}` : ''}</p>
        </div>
    )
}

type PieLabel = { percent?: number; cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number }

export function Donut({ data, centerLabel, centerValue, unit }: { data: { name: string; value: number }[]; centerLabel?: string; centerValue?: string; unit?: string }) {
    const total = data.reduce((a, b) => a + b.value, 0)
    return (
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
            <div className="relative mx-auto h-48 w-48 [&_*:focus]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart accessibilityLayer={false}>
                        <Pie
                            data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} strokeWidth={0} labelLine={false}
                            label={(e: PieLabel) => {
                                if (!e.percent || e.percent < 0.07 || e.cx === undefined || e.cy === undefined || e.midAngle === undefined || e.innerRadius === undefined || e.outerRadius === undefined) return null
                                const r = (e.innerRadius + e.outerRadius) / 2
                                const a = (-e.midAngle * Math.PI) / 180
                                return <text x={e.cx + r * Math.cos(a)} y={e.cy + r * Math.sin(a)} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600} fill="#fff">{Math.round(e.percent * 100)}%</text>
                            }}
                        >
                            {data.map((d, i) => <Cell key={d.name} fill={VIZ[i % VIZ.length]} />)}
                        </Pie>
                        <Tooltip content={<ChartTip unit={unit} />} />
                    </PieChart>
                </ResponsiveContainer>
                {centerValue && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-bold tabular-nums">{centerValue}</span>
                        {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
                    </div>
                )}
            </div>
            <ul className="space-y-1.5 text-sm">
                {data.map((d, i) => (
                    <li key={d.name} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: VIZ[i % VIZ.length] }} aria-hidden />
                        <span className="min-w-0 flex-1 break-words">{d.name}</span>
                        <span className="font-semibold tabular-nums">{fmtNum(d.value, 1)}{unit ? ` ${unit}` : ''}</span>
                        {total > 0 && <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{fmtNum((d.value / total) * 100, 1)}%</span>}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function TrendChart({ data, unit, color = VIZ[0] }: { data: { x: string | number; y: number }[]; unit?: string; color?: string }) {
    return (
        <div>
            <div className="h-56 [&_*:focus]:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 22, right: 24, bottom: 0, left: 0 }} accessibilityLayer={false}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                        <XAxis dataKey="x" padding={{ left: 36, right: 36 }} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => fmtNum(v)} />
                        <Tooltip content={<ChartTip unit={unit} />} cursor={{ stroke: GRID }} />
                        <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} activeDot={{ r: 5 }}>
                            <LabelList dataKey="y" position="top" offset={8} formatter={(v: unknown) => fmtNum(Number(v), 1)} style={{ fontSize: 11, fill: 'currentColor' }} />
                        </Line>
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <ul className="sr-only">{data.map(d => <li key={String(d.x)}>{d.x}: {fmtNum(d.y, 1)} {unit}</li>)}</ul>
        </div>
    )
}

// ==================== Таблица с сортировкой ====================

export interface Column<T> { key: string; header: string; render: (row: T) => ReactNode; sortValue?: (row: T) => number | string; align?: 'right' }

export function DataTable<T>({ rows, columns, rowKey, defaultSort, empty }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T, i: number) => string | number; defaultSort?: { key: string; dir: 'asc' | 'desc' }; empty: string }) {
    const [sort, setSort] = useState(defaultSort ?? null)
    const sorted = useMemo(() => {
        const sv = columns.find(c => c.key === sort?.key)?.sortValue
        if (!sort || !sv) return rows
        return [...rows].sort((a, b) => {
            const x = sv(a)
            const y = sv(b)
            const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ru')
            return sort.dir === 'asc' ? r : -r
        })
    }, [rows, columns, sort])

    if (rows.length === 0) return <EmptyHint text={empty} />

    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
                <thead className="bg-foreground/5">
                    <tr>
                        {columns.map(c => {
                            const active = sort?.key === c.key
                            return (
                                <th key={c.key} scope="col" aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : undefined} className={`whitespace-nowrap px-3 py-2.5 text-xs font-semibold ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                                    {c.sortValue ? (
                                        <button type="button" onClick={() => setSort({ key: c.key, dir: active && sort?.dir === 'desc' ? 'asc' : 'desc' })} className="inline-flex items-center gap-1 hover:underline">
                                            {c.header}
                                            {active && (sort?.dir === 'asc' ? <ArrowUp size={12} aria-hidden /> : <ArrowDown size={12} aria-hidden />)}
                                        </button>
                                    ) : c.header}
                                </th>
                            )
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {sorted.map((row, i) => (
                        <tr key={rowKey(row, i)} className="odd:bg-foreground/[0.03] hover:bg-foreground/[0.06]">
                            {columns.map(c => <td key={c.key} className={`px-3 py-2.5 ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.render(row)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export const Timeline = ({ items }: { items: string[] }) => (
    <ol className="relative space-y-4 border-l-2 border-border pl-5">
        {items.map((t, i) => (
            <li key={i} className="relative text-sm leading-relaxed">
                <span className="absolute -left-[27px] top-1.5 h-2.5 w-2.5 rounded-full bg-sky-500" aria-hidden />
                {t}
            </li>
        ))}
    </ol>
)
