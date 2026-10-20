import { useState } from 'react'
import { ArrowLeft, FolderKanban, Plus } from 'lucide-react'
import { EXECUTORS, SPHERES, TASK_CLS, TASK_LABEL, execName, fmtDate, mainNumber, shortName, sphereName, todayIso, type Project, type ProjectStatus } from './data'
import { BTN, BTN_GHOST, Badge, CARD, Dot, Empty, FIELD, Field, Segmented, Sheet, StatusBadge, type Ctx } from './ui'

const STATUS: Record<ProjectStatus, { label: string; cls: string }> = {
    in_progress: { label: 'В работе', cls: 'bg-sky-500/15 text-sky-500 dark:text-sky-400' },
    completed: { label: 'Завершён', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
}

export default function ProjectsTab({ ctx }: { ctx: Ctx }) {
    const { projects, cases, tasks } = ctx.db
    const [openId, setOpenId] = useState<number | null>(null)
    const [filter, setFilter] = useState<'all' | ProjectStatus>('all')
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [goal, setGoal] = useState('')

    const project = projects.find(p => p.id === openId)
    const patch = (id: number, p: Partial<Project>) => ctx.setDb(d => ({ ...d, projects: d.projects.map(x => (x.id === id ? { ...x, ...p } : x)) }))

    if (project) {
        const pc = cases.filter(c => c.projectId === project.id)
        const pt = tasks.filter(t => t.entity === 'project' && t.entityId === project.id)
        const free = cases.filter(c => c.projectId === null)
        return (
            <div className="space-y-5">
                <button type="button" className={BTN_GHOST} onClick={() => setOpenId(null)}><ArrowLeft size={15} /> К проектам</button>
                <section className={`${CARD} p-5 sm:p-6`}>
                    <Badge cls={STATUS[project.status].cls}>{STATUS[project.status].label}</Badge>
                    <input className="mt-3 w-full bg-transparent text-xl font-semibold outline-none sm:text-2xl" value={project.name} onChange={e => patch(project.id, { name: e.target.value })} aria-label="Название проекта" />
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <Field label="Статус">
                            <select className={FIELD} value={project.status} onChange={e => patch(project.id, { status: e.target.value as ProjectStatus })}>
                                <option value="in_progress">В работе</option><option value="completed">Завершён</option>
                            </select>
                        </Field>
                        <Field label="Сфера">
                            <select className={FIELD} value={project.sphereId} onChange={e => patch(project.id, { sphereId: Number(e.target.value) })}>{SPHERES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </Field>
                        <Field label="Ответственный">
                            <select className={FIELD} value={project.responsibleId} onChange={e => patch(project.id, { responsibleId: Number(e.target.value) })}>{EXECUTORS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
                        </Field>
                        <Field label="Цель" className="sm:col-span-3"><textarea rows={2} className={FIELD} value={project.goal} onChange={e => patch(project.id, { goal: e.target.value })} /></Field>
                        <Field label="Описание" className="sm:col-span-3"><textarea rows={3} className={FIELD} value={project.description} onChange={e => patch(project.id, { description: e.target.value })} /></Field>
                        <Field label="Риски" className="sm:col-span-3"><textarea rows={2} className={FIELD} value={project.risks} onChange={e => patch(project.id, { risks: e.target.value })} /></Field>
                        <Field label="Актуальная задача" className="sm:col-span-3"><input className={FIELD} value={project.currentTask} onChange={e => patch(project.id, { currentTask: e.target.value })} /></Field>
                    </div>
                </section>

                <section className={`${CARD} p-5`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">Дела проекта ({pc.length})</h3>
                        {free.length > 0 && (
                            <select
                                className={`${FIELD} !w-auto max-w-full`}
                                value=""
                                onChange={e => { const id = Number(e.target.value); ctx.setDb(d => ({ ...d, cases: d.cases.map(c => (c.id === id ? { ...c, projectId: project.id } : c)) })); ctx.notify('Дело добавлено в проект') }}
                                aria-label="Добавить дело в проект"
                            >
                                <option value="">+ Добавить дело…</option>
                                {free.map(c => <option key={c.id} value={c.id}>{mainNumber(c)} — {c.subject.slice(0, 50)}</option>)}
                            </select>
                        )}
                    </div>
                    {pc.length === 0 ? <Empty icon={FolderKanban} text="В проекте пока нет дел" /> : (
                        <ul className="mt-3 divide-y divide-border">
                            {pc.map(c => (
                                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                                    <button type="button" className="min-w-0 flex-1 text-left hover:text-sky-500" onClick={() => ctx.openCase(c.id)}><span className="font-medium">{mainNumber(c)}</span> · {c.subject}</button>
                                    <StatusBadge status={c.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className={`${CARD} p-5`}>
                    <h3 className="font-semibold">Поручения по проекту ({pt.length})</h3>
                    {pt.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Поручений нет.</p> : (
                        <ul className="mt-3 divide-y divide-border">
                            {pt.map(t => (
                                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                                    <div className="flex items-start gap-2"><span className="mt-1.5"><Dot date={t.deadline} done={t.status === 'done'} /></span><div><p className="font-medium">{t.title}</p><p className="text-xs text-muted-foreground">{shortName(execName(t.executorId))} · до {fmtDate(t.deadline)}</p></div></div>
                                    <Badge cls={TASK_CLS[t.status]}>{TASK_LABEL[t.status]}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        )
    }

    const list = projects.filter(p => filter === 'all' || p.status === filter)

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented<'all' | ProjectStatus> value={filter} onChange={setFilter} options={[{ id: 'all', label: 'Все' }, { id: 'in_progress', label: 'В работе' }, { id: 'completed', label: 'Завершённые' }]} />
                <button type="button" className={BTN} onClick={() => setCreating(true)}><Plus size={15} /> Новый проект</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {list.map(p => {
                    const n = cases.filter(c => c.projectId === p.id)
                    return (
                        <button key={p.id} type="button" onClick={() => setOpenId(p.id)} className={`${CARD} p-5 text-left transition-colors hover:bg-foreground/5`}>
                            <div className="flex items-start justify-between gap-3">
                                <h3 className="font-semibold leading-snug">{p.name}</h3>
                                <Badge cls={STATUS[p.status].cls}>{STATUS[p.status].label}</Badge>
                            </div>
                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.goal}</p>
                            <p className="mt-3 text-xs text-muted-foreground">{sphereName(p.sphereId)} · {shortName(execName(p.responsibleId))} · дел: {n.length}</p>
                            {p.currentTask && <p className="mt-2 text-xs"><span className="text-muted-foreground">Сейчас:</span> {p.currentTask}</p>}
                        </button>
                    )
                })}
            </div>
            {list.length === 0 && <div className={`${CARD} p-4`}><Empty icon={FolderKanban} text="Проектов нет" /></div>}

            {creating && (
                <Sheet
                    title={<h2 className="text-lg font-semibold">Новый проект</h2>}
                    onClose={() => setCreating(false)}
                    footer={<><button type="button" className={BTN_GHOST} onClick={() => setCreating(false)}>Отмена</button>
                        <button type="button" className={BTN} onClick={() => {
                            if (!name.trim()) { ctx.notify('Укажите название проекта'); return }
                            ctx.setDb(d => ({ ...d, seq: d.seq + 1, projects: [{ id: d.seq + 1, name: name.trim(), goal: goal.trim(), description: '', risks: '', status: 'in_progress', sphereId: 1, responsibleId: 1, currentTask: '' }, ...d.projects] }))
                            setName(''); setGoal(''); setCreating(false); ctx.notify(`Проект создан · ${todayIso().slice(0, 4)}`)
                        }}>Создать</button></>}
                >
                    <div className="space-y-3">
                        <Field label="Название *"><input className={FIELD} value={name} onChange={e => setName(e.target.value)} /></Field>
                        <Field label="Цель"><textarea rows={3} className={FIELD} value={goal} onChange={e => setGoal(e.target.value)} /></Field>
                    </div>
                </Sheet>
            )}
        </div>
    )
}
