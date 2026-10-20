import { useMemo } from 'react'
import { BarChart3 } from 'lucide-react'
import { KIND_LABEL, EVENT_LABELS, activeIn, areaName, fmtDate, platformName, quotaOf, ruleLabel, type CandEvent, type ListKind } from './data'
import { Badge, Empty, Section, TD, TR, Table, type Ctx } from './ui'

type State = 'ok' | 'missing' | 'pending' | 'mismatch'
const STATE: Record<State, { label: string; cls: string }> = {
    ok: { label: 'В порядке', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
    missing: { label: 'Список не принят', cls: 'bg-rose-500/15 text-rose-500 dark:text-rose-400' },
    pending: { label: 'Ждёт решения', cls: 'bg-sky-500/15 text-sky-500 dark:text-sky-400' },
    mismatch: { label: 'Численность ≠ плану', cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400' },
}

export default function ReportsTab({ ctx }: { ctx: Ctx }) {
    const { db } = ctx

    const completeness = useMemo(() => db.areas.flatMap(a => (['main', 'reserve'] as ListKind[]).map(kind => {
        const subs = db.submissions.filter(s => s.areaId === a.id && s.kind === kind)
        const active = activeIn(db, a.id, kind).length
        const plan = quotaOf(db, a.id, kind)
        const listAccepted = subs.some(s => s.type === 'list' && s.status === 'accepted')
        const pending = subs.filter(s => s.status === 'checked').length
        const state: State = !listAccepted ? 'missing' : pending > 0 ? 'pending' : active !== plan ? 'mismatch' : 'ok'
        const last = subs.map(s => s.uploadedAt).sort().pop() ?? null
        return { area: a.id, kind, plan, active, changes: subs.filter(s => s.type === 'changes' && s.status === 'accepted').length, pending, last, state }
    })), [db])

    const removals = useMemo(() => {
        const m = new Map<string, number>()
        db.candidates.filter(c => c.status === 'removed').forEach(c => m.set(c.removalReason ?? '—', (m.get(c.removalReason ?? '—') ?? 0) + 1))
        return Array.from(m, ([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
    }, [db.candidates])

    const rules = useMemo(() => {
        const m = new Map<string, { rule: string; severity: string; count: number; open: number }>()
        db.submissions.forEach(s => s.findings.forEach(f => {
            const k = `${f.rule}|${f.severity}`
            const cur = m.get(k) ?? { rule: f.rule, severity: f.severity, count: 0, open: 0 }
            cur.count++
            if (f.resolution === 'open') cur.open++
            m.set(k, cur)
        }))
        return Array.from(m.values()).sort((a, b) => b.count - a.count)
    }, [db.submissions])

    const dynamics = useMemo(() => {
        const months = new Map<string, Partial<Record<CandEvent['type'], number>>>()
        db.events.forEach(e => {
            const key = e.at.slice(0, 7)
            const row = months.get(key) ?? {}
            row[e.type] = (row[e.type] ?? 0) + 1
            months.set(key, row)
        })
        return Array.from(months).sort(([a], [b]) => a.localeCompare(b))
    }, [db.events])
    const types: CandEvent['type'][] = ['included', 'removed', 'updated', 'reg_no_assigned', 'manual_edit']

    const byArea = db.areas.map(a => ({
        a, active: db.candidates.filter(c => c.areaId === a.id && c.status === 'active').length,
        removed: db.candidates.filter(c => c.areaId === a.id && c.status === 'removed').length,
    }))
    const links = { auto: 0, confirmed: 0, rejected: 0 }
    db.links.forEach(l => links[l.confidence]++)

    return (
        <div className="space-y-6">
            <Section title="Комплектность цикла" hint={`Цикл составления: ${fmtDate(db.cycles[0].dateFrom)} — ${fmtDate(db.cycles[0].dateTo)}`}>
                <Table head={['Комиссия', 'Площадка', 'Вид', 'План', 'Действует', 'Принято изменений', 'Ждёт решения', 'Последняя загрузка', 'Состояние']}>
                    {completeness.map(r => (
                        <tr key={`${r.area}-${r.kind}`} className={TR}>
                            <td className={TD}>{areaName(db, r.area)}</td>
                            <td className={TD}>{platformName(db, db.areas.find(a => a.id === r.area)!.platformId)}</td>
                            <td className={`${TD} whitespace-nowrap`}>{KIND_LABEL[r.kind].toLowerCase()}</td>
                            <td className={TD}>{r.plan}</td>
                            <td className={TD}>{r.active}</td>
                            <td className={TD}>{r.changes}</td>
                            <td className={TD}>{r.pending}</td>
                            <td className={`${TD} whitespace-nowrap`}>{r.last ? fmtDate(r.last) : '—'}</td>
                            <td className={TD}><Badge cls={STATE[r.state].cls}>{STATE[r.state].label}</Badge></td>
                        </tr>
                    ))}
                </Table>
            </Section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Section title="Основания исключения">
                    {removals.length === 0 ? <Empty icon={BarChart3} text="Исключённых кандидатов нет" /> : (
                        <Table head={['Основание', 'Исключено']}>
                            {removals.map(r => <tr key={r.reason} className={TR}><td className={TD}>{r.reason}</td><td className={TD}>{r.count}</td></tr>)}
                        </Table>
                    )}
                </Section>
                <Section title="Кандидаты по комиссиям">
                    <Table head={['Комиссия', 'Действует', 'Исключено']}>
                        {byArea.map(r => <tr key={r.a.id} className={TR}><td className={TD}>{r.a.name}</td><td className={TD}>{r.active}</td><td className={TD}>{r.removed}</td></tr>)}
                    </Table>
                </Section>
            </div>

            <Section title="Замечания проверки по правилам">
                {rules.length === 0 ? <Empty icon={BarChart3} text="Замечаний пока нет" /> : (
                    <Table head={['Правило', 'Уровень', 'Всего', 'Не решено']}>
                        {rules.map(r => (
                            <tr key={`${r.rule}-${r.severity}`} className={TR}>
                                <td className={TD}>{ruleLabel(r.rule)}</td><td className={TD}>{r.severity === 'error' ? 'Ошибка' : 'Вопрос'}</td><td className={TD}>{r.count}</td><td className={TD}>{r.open}</td>
                            </tr>
                        ))}
                    </Table>
                )}
            </Section>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Section title="Динамика изменений по месяцам">
                    <Table head={['Месяц', ...types.map(t => EVENT_LABELS[t])]}>
                        {dynamics.map(([m, row]) => (
                            <tr key={m} className={TR}><td className={`${TD} whitespace-nowrap`}>{m.slice(5)}.{m.slice(0, 4)}</td>{types.map(t => <td key={t} className={TD}>{row[t] ?? 0}</td>)}</tr>
                        ))}
                    </Table>
                </Section>
                <Section title="Связи между списками площадок">
                    <Table head={['Статус', 'Пар']}>
                        <tr className={TR}><td className={TD}>Ждут подтверждения</td><td className={TD}>{links.auto}</td></tr>
                        <tr className={TR}><td className={TD}>Подтверждены</td><td className={TD}>{links.confirmed}</td></tr>
                        <tr className={TR}><td className={TD}>Отклонены</td><td className={TD}>{links.rejected}</td></tr>
                    </Table>
                </Section>
            </div>
        </div>
    )
}
