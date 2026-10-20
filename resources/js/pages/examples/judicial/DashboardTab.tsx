import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlarmClock, Activity, Ban, Banknote, ClipboardList, Hourglass, Layers, ListChecks, Scale, TrendingUp, Trophy, Users } from 'lucide-react'
import {
    COMPANIES, EXECUTORS, OUTCOME_LABEL, SPHERES, STATUS_LABEL, calcFin, daysBetween, fmtDate, fmtRub, isOverdue, mainNumber, shortName, todayIso,
    type Outcome, type Status,
} from './data'
import { CARD, StatTile, StatusBadge, TD, TR, Table, type Ctx } from './ui'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#64748b', '#06b6d4', '#f97316']

function Tip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="max-w-xs rounded-lg border border-border bg-card p-3 text-sm shadow-xl">
            {label && <p className="mb-1 font-semibold leading-tight">{label}</p>}
            {payload.map((p, i) => <p key={i} className="text-xs text-muted-foreground">{p.name}: <span className="font-medium text-foreground">{p.value}</span></p>)}
        </div>
    )
}

function Breakdown({ title, icon: Icon, data }: { title: string; icon: typeof Layers; data: { name: string; value: number }[] }) {
    const rows = data.filter(d => d.value > 0).sort((a, b) => b.value - a.value)
    return (
        <div className={`${CARD} p-5`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Icon size={16} className="text-sky-500" />{title}</h3>
            {rows.length === 0 ? <p className="text-sm text-muted-foreground">Нет данных</p> : (
                <div style={{ height: Math.max(120, rows.length * 38 + 20) }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                            <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.15)" />
                            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                            <Bar dataKey="value" name="Дел" radius={[0, 6, 6, 0]}>
                                {rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default function DashboardTab({ ctx }: { ctx: Ctx }) {
    const { cases, tasks, projects } = ctx.db

    const d = useMemo(() => {
        const today = todayIso()
        const closed = cases.filter(c => c.status === 'terminated' || c.status === 'effective' || c.status === 'enforcement')
        const durations = cases
            .filter(c => c.status !== 'in_progress' && c.instances.some(i => i.decisionDate))
            .map(c => daysBetween(c.receiptDate, c.instances.filter(i => i.decisionDate).map(i => i.decisionDate as string).sort().pop() as string))
        const fins = cases.map(calcFin)
        const month = today.slice(0, 7)

        const monthly = new Map<string, number>()
        for (let i = 11; i >= 0; i--) {
            const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i)
            monthly.set(dt.toISOString().slice(0, 7), 0)
        }
        cases.forEach(c => { const k = c.receiptDate.slice(0, 7); if (monthly.has(k)) monthly.set(k, (monthly.get(k) ?? 0) + 1) })

        const count = <T,>(items: T[], key: (x: T) => string) => {
            const m = new Map<string, number>()
            items.forEach(x => m.set(key(x), (m.get(key(x)) ?? 0) + 1))
            return Array.from(m, ([name, value]) => ({ name, value }))
        }

        return {
            total: cases.length,
            active: cases.filter(c => c.status === 'in_progress').length,
            inWork: cases.filter(c => c.status === 'in_progress' || c.status === 'enforcement').length,
            overdue: cases.filter(isOverdue).length,
            terminated: cases.filter(c => c.status === 'terminated').length,
            openTasks: tasks.filter(t => t.status !== 'done').length,
            overdueTasks: tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < today).length,
            closedMonth: closed.filter(c => c.history.some(h => h.at.slice(0, 7) === month)).length,
            avgDays: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
            forecast: fins.reduce((s, f) => s + f.forecast, 0),
            result: fins.reduce((s, f) => s + (f.result ?? 0), 0),
            effect: fins.reduce((s, f) => s + (f.effect ?? 0), 0),
            monthly: Array.from(monthly, ([k, value]) => ({ name: `${k.slice(5)}.${k.slice(2, 4)}`, value })),
            bySphere: SPHERES.map(s => ({ name: s.name, value: cases.filter(c => c.sphereId === s.id).length })),
            byStatus: (Object.keys(STATUS_LABEL) as Status[]).map(s => ({ name: STATUS_LABEL[s], value: cases.filter(c => c.status === s).length })),
            byOutcome: (Object.keys(OUTCOME_LABEL) as Outcome[]).map(o => ({ name: OUTCOME_LABEL[o], value: cases.filter(c => c.outcome === o).length })),
            byCompany: COMPANIES.map(c => ({ name: c.name, value: cases.filter(x => x.companyId === c.id).length })),
            byOpponent: count(cases.flatMap(c => c.parties.filter(p => !p.ours && (p.role === 'plaintiff' || p.role === 'defendant') && p.role !== (c.role === 'plaintiff' ? 'plaintiff' : 'defendant')).map(p => p.name)), x => x),
            ranking: EXECUTORS.map(e => {
                const own = cases.filter(c => c.executorId === e.id)
                return { name: shortName(e.name), total: own.length, active: own.filter(c => c.status === 'in_progress').length, overdue: own.filter(isOverdue).length, tasks: tasks.filter(t => t.executorId === e.id && t.status !== 'done').length }
            }).sort((a, b) => b.total - a.total),
            recent: [...cases].sort((a, b) => b.receiptDate.localeCompare(a.receiptDate)).slice(0, 5),
        }
    }, [cases, tasks])

    const effectCls = d.effect > 0 ? 'text-emerald-500' : d.effect < 0 ? 'text-rose-500' : ''

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                <StatTile title="Всего дел" icon={Scale} value={d.total} />
                <StatTile title="В работе" icon={Hourglass} value={d.active} />
                <StatTile title="В работе с исполнением" icon={Activity} value={d.inWork} />
                <StatTile title="Просрочено дел" icon={AlarmClock} tone="text-rose-500" value={d.overdue} />
                <StatTile title="Производство прекращено" icon={Ban} tone="text-slate-500" value={d.terminated} />
                <StatTile title="Проектов" icon={ListChecks} value={projects.length} />
                <StatTile title="Открытых поручений" icon={ClipboardList} value={d.openTasks} />
                <StatTile title="Просроченных поручений" icon={AlarmClock} tone="text-rose-500" value={d.overdueTasks} />
                <StatTile title="Средняя длительность дела" icon={Hourglass} value={d.avgDays === null ? '—' : `${d.avgDays} дн.`} />
                <StatTile title="Финансовый прогноз" icon={TrendingUp} value={fmtRub(d.forecast)} />
                <StatTile title="Финансовый результат" icon={Banknote} value={fmtRub(d.result)} />
                <StatTile title="Эффект для холдинга" icon={Banknote} tone={effectCls || 'text-sky-500'} value={<span className={effectCls}>{d.effect > 0 ? '+' : ''}{fmtRub(d.effect)}</span>} />
            </div>

            <div className={`${CARD} p-5`}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><TrendingUp size={16} className="text-sky-500" />Динамика поступления дел по месяцам</h3>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={d.monthly} margin={{ left: 0, right: 16, top: 8, bottom: 4 }}>
                            <CartesianGrid stroke="rgba(148,163,184,0.15)" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} width={28} />
                            <Tooltip content={<Tip />} />
                            <Line type="monotone" dataKey="value" name="Поступило дел" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
                <Breakdown title="По сферам" icon={Layers} data={d.bySphere} />
                <Breakdown title="По статусам" icon={ListChecks} data={d.byStatus} />
                <Breakdown title="По результату" icon={Trophy} data={d.byOutcome} />
                <Breakdown title="По компаниям группы" icon={Users} data={d.byCompany} />
                <Breakdown title="По оппоненту" icon={Scale} data={d.byOpponent} />
            </div>

            <div className={`${CARD} p-5`}>
                <h3 className="mb-3 flex items-center gap-2 font-semibold"><Users size={16} className="text-sky-500" />Рейтинг исполнителей</h3>
                <Table head={['Исполнитель', 'Всего дел', 'В работе', 'Просрочено', 'Открытых поручений']}>
                    {d.ranking.map(r => (
                        <tr key={r.name} className={TR}>
                            <td className={`${TD} font-medium`}>{r.name}</td>
                            <td className={TD}>{r.total}</td>
                            <td className={TD}>{r.active}</td>
                            <td className={`${TD} ${r.overdue ? 'text-rose-500' : ''}`}>{r.overdue}</td>
                            <td className={TD}>{r.tasks}</td>
                        </tr>
                    ))}
                </Table>
            </div>

            <div className={`${CARD} p-5`}>
                <h3 className="mb-3 font-semibold">Последние поступившие дела</h3>
                <ul className="divide-y divide-border">
                    {d.recent.map(c => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                            <button type="button" className="min-w-0 flex-1 text-left hover:text-sky-500" onClick={() => ctx.openCase(c.id)}>
                                <span className="font-medium">{mainNumber(c)}</span> · {c.subject}
                            </button>
                            <span className="flex items-center gap-3 text-xs text-muted-foreground">{fmtDate(c.receiptDate)}<StatusBadge status={c.status} /></span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
