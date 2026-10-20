import { useMemo, useState } from 'react'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import { EXECUTORS, TASK_CLS, TASK_LABEL, execName, fmtDate, mainNumber, shortName, todayIso, type TaskStatus } from './data'
import { BTN_GHOST, Badge, CARD, Dot, Empty, FIELD, Segmented, type Ctx } from './ui'

export default function TasksTab({ ctx }: { ctx: Ctx }) {
    const { tasks, cases, projects } = ctx.db
    const [status, setStatus] = useState<'all' | TaskStatus | 'overdue'>('all')
    const [executor, setExecutor] = useState('')

    const rows = useMemo(() => {
        const today = todayIso()
        return tasks
            .filter(t => (executor ? t.executorId === Number(executor) : true))
            .filter(t => (status === 'all' ? true : status === 'overdue' ? t.status !== 'done' && !!t.deadline && t.deadline < today : t.status === status))
            .sort((a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999'))
    }, [tasks, status, executor])

    const setTaskStatus = (id: number, next: TaskStatus) =>
        ctx.setDb(d => ({ ...d, tasks: d.tasks.map(t => (t.id === id ? { ...t, status: next } : t)) }))

    const target = (t: (typeof tasks)[number]) => {
        if (t.entity === 'case') {
            const c = cases.find(x => x.id === t.entityId)
            return c ? { label: `Дело ${mainNumber(c)}`, open: () => ctx.openCase(c.id) } : null
        }
        const p = projects.find(x => x.id === t.entityId)
        return p ? { label: `Проект «${p.name}»`, open: null } : null
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented<'all' | TaskStatus | 'overdue'>
                    value={status}
                    onChange={setStatus}
                    options={[{ id: 'all', label: 'Все' }, { id: 'open', label: 'Открытые' }, { id: 'review', label: 'На проверке' }, { id: 'done', label: 'Выполненные' }, { id: 'overdue', label: 'Просроченные' }]}
                />
                <select className={`${FIELD} !w-auto`} value={executor} onChange={e => setExecutor(e.target.value)} aria-label="Исполнитель">
                    <option value="">Все исполнители</option>
                    {EXECUTORS.map(e => <option key={e.id} value={e.id}>{shortName(e.name)}</option>)}
                </select>
            </div>

            {rows.length === 0 ? <div className={`${CARD} p-4`}><Empty icon={ClipboardList} text="Поручений по выбранным условиям нет" /></div> : (
                <div className="space-y-3">
                    {rows.map(t => {
                        const tg = target(t)
                        return (
                            <div key={t.id} className={`${CARD} flex flex-wrap items-start justify-between gap-3 p-4`}>
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span className="mt-1.5"><Dot date={t.deadline} done={t.status === 'done'} /></span>
                                    <div className="min-w-0">
                                        <p className="font-medium">{t.title}</p>
                                        {t.description && <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>}
                                        {t.result && <p className="mt-1 text-sm"><span className="text-muted-foreground">Результат:</span> {t.result}</p>}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {shortName(execName(t.executorId))} · срок {fmtDate(t.deadline)} ·{' '}
                                            {tg && (tg.open ? <button type="button" className="hover:text-sky-500" onClick={tg.open}>{tg.label}</button> : tg.label)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge cls={TASK_CLS[t.status]}>{TASK_LABEL[t.status]}</Badge>
                                    {t.status === 'open' && <button type="button" className={BTN_GHOST} onClick={() => setTaskStatus(t.id, 'review')}>На проверку</button>}
                                    {t.status === 'review' && <button type="button" className={BTN_GHOST} onClick={() => { setTaskStatus(t.id, 'done'); ctx.notify('Поручение выполнено') }}><CheckCircle2 size={14} /> Принять</button>}
                                    {t.status === 'done' && <button type="button" className={BTN_GHOST} onClick={() => setTaskStatus(t.id, 'open')}>Вернуть</button>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
