import { useState, type ReactNode } from 'react'
import { ArrowLeft, Banknote, CalendarPlus, ClipboardList, Gavel, History, Link2, NotebookPen, Plus, ShieldCheck, Trash2, Users } from 'lucide-react'
import {
    COMPANIES, EXECUTORS, INSTANCE_LABEL, INSTANCE_ORDER, OUTCOME_CLS, OUTCOME_LABEL, PARTY_ROLE_LABEL, PROGRAMS, ROLE_LABEL, SPHERES, STATUS_LABEL,
    TASK_CLS, TASK_LABEL, TRANSFER_LABEL, calcFin, companyName, emptyInstance, execName, fmtDate, fmtRub, mainNumber, shortName, sphereName, todayIso,
    deadlineColor, withHistory,
    type Case, type InstanceType, type Outcome, type PartyRole, type Status, type TransferTarget,
} from './data'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, Badge, CARD, Dot, FIELD, Field, StatusBadge, type Ctx } from './ui'

function Card({ title, icon: Icon, action, children }: { title: string; icon: typeof Gavel; action?: ReactNode; children: ReactNode }) {
    return (
        <section className={`${CARD} p-5`}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold"><Icon size={17} className="text-sky-500" />{title}</h2>
                {action}
            </div>
            {children}
        </section>
    )
}

const money = (v: string) => (v === '' ? null : Number(v.replace(/\s/g, '')) || 0)

export default function CaseDetail({ ctx, caseId }: { ctx: Ctx; caseId: number }) {
    const { db } = ctx
    const c = db.cases.find(x => x.id === caseId)
    const [hearingFor, setHearingFor] = useState<InstanceType | null>(null)
    const [hearing, setHearing] = useState({ date: '', plan: '' })
    const [party, setParty] = useState({ role: 'other' as PartyRole, name: '', inn: '' })
    const [addingParty, setAddingParty] = useState(false)
    const [note, setNote] = useState({ date: '', text: '' })
    const [task, setTask] = useState({ title: '', executorId: 1, deadline: '' })

    if (!c) {
        return (
            <div className={`${CARD} p-6`}>
                <button type="button" className={BTN_GHOST} onClick={() => ctx.openCase(null)}><ArrowLeft size={15} /> К списку дел</button>
                <p className="mt-4 text-sm text-muted-foreground">Дело не найдено.</p>
            </div>
        )
    }

    /** Применить правку к делу и записать её в историю */
    const edit = (text: string, fn: (x: Case) => Case) => {
        ctx.setDb(d => {
            const seq = d.seq + 1
            return { ...d, seq, cases: d.cases.map(x => (x.id === c.id ? withHistory(fn(x), seq, text) : x)) }
        })
    }
    const patch = (text: string, p: Partial<Case>) => edit(text, x => ({ ...x, ...p }))
    const patchSilent = (p: Partial<Case>) => ctx.setDb(d => ({ ...d, cases: d.cases.map(x => (x.id === c.id ? { ...x, ...p } : x)) }))

    const fin = calcFin(c)
    const tasks = db.tasks.filter(t => t.entity === 'case' && t.entityId === c.id)
    const linked = c.linkedIds.map(id => db.cases.find(x => x.id === id)).filter((x): x is Case => !!x)
    const project = db.projects.find(p => p.id === c.projectId)
    const hasFirst = c.instances.some(i => i.type === 'first')
    const nextInstance = INSTANCE_ORDER.find(t => !c.instances.some(i => i.type === t))

    const updateInstance = (type: InstanceType, p: Partial<Case['instances'][number]>, text?: string) => {
        const fn = (x: Case) => ({ ...x, instances: x.instances.map(i => (i.type === type ? { ...i, ...p } : i)) })
        if (text) edit(text, fn)
        else ctx.setDb(d => ({ ...d, cases: d.cases.map(x => (x.id === c.id ? fn(x) : x)) }))
    }

    const addHearing = (type: InstanceType) => {
        if (!hearing.date) { ctx.notify('Укажите дату заседания'); return }
        const id = db.seq + 1
        edit('Добавлено заседание', x => ({
            ...x,
            instances: x.instances.map(i => (i.type === type
                ? { ...i, nextHearing: hearing.date >= todayIso() ? hearing.date : i.nextHearing, nextTask: hearing.plan || i.nextTask, hearings: [...i.hearings, { id, date: hearing.date, plan: hearing.plan, result: '' }].sort((a, b) => a.date.localeCompare(b.date)) }
                : i)),
        }))
        setHearing({ date: '', plan: '' })
        setHearingFor(null)
    }

    const setFin = (p: Partial<Case['fin']>) => ctx.setDb(d => ({ ...d, cases: d.cases.map(x => (x.id === c.id ? { ...x, fin: { ...x.fin, ...p } } : x)) }))
    const setEnf = (p: Partial<Case['enforcement']>) => ctx.setDb(d => ({ ...d, cases: d.cases.map(x => (x.id === c.id ? { ...x, enforcement: { ...x.enforcement, ...p } } : x)) }))

    const addTask = () => {
        if (!task.title.trim()) { ctx.notify('Опишите, что нужно сделать'); return }
        ctx.setDb(d => ({
            ...d, seq: d.seq + 1,
            tasks: [{ id: d.seq + 1, entity: 'case', entityId: c.id, title: task.title.trim(), description: '', executorId: task.executorId, deadline: task.deadline || null, status: 'open', result: '', createdAt: todayIso() }, ...d.tasks],
        }))
        setTask({ title: '', executorId: 1, deadline: '' })
        ctx.notify('Поручение добавлено')
    }

    const showEnforcement = c.status === 'enforcement' || c.status === 'effective' || c.enforcement.writIssued

    return (
        <div className="space-y-5">
            <button type="button" className={BTN_GHOST} onClick={() => ctx.openCase(null)}><ArrowLeft size={15} /> К списку дел</button>

            <section className={`${CARD} p-5 sm:p-6`}>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={c.status} />
                    {c.outcome && <Badge cls={OUTCOME_CLS[c.outcome]}>{c.outcome} · {OUTCOME_LABEL[c.outcome]}</Badge>}
                    {c.directorControl && <Badge cls="bg-violet-500/15 text-violet-500 dark:text-violet-400">На контроле директора</Badge>}
                </div>
                <h2 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{c.subject}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {mainNumber(c)} · {sphereName(c.sphereId)} · {c.proceeding} · поступило {fmtDate(c.receiptDate)}
                    {project && <> · проект «{project.name}»</>}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Статус дела">
                        <select className={FIELD} value={c.status} onChange={e => patch(`Статус изменён: ${STATUS_LABEL[e.target.value as Status]}`, { status: e.target.value as Status })}>
                            {(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                    </Field>
                    <Field label="Исполнитель">
                        <select className={FIELD} value={c.executorId} onChange={e => patch(`Исполнитель изменён: ${shortName(execName(Number(e.target.value)))}`, { executorId: Number(e.target.value) })}>
                            {EXECUTORS.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Компания группы">
                        <select className={FIELD} value={c.companyId} onChange={e => patch('Изменена компания группы', { companyId: Number(e.target.value) })}>
                            {COMPANIES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Сфера">
                        <select className={FIELD} value={c.sphereId} onChange={e => patch('Изменена сфера', { sphereId: Number(e.target.value) })}>
                            {SPHERES.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Актуальная задача" className="sm:col-span-2">
                        <input className={FIELD} value={c.currentTask} onChange={e => patchSilent({ currentTask: e.target.value })} onBlur={() => edit('Изменена актуальная задача', x => x)} />
                    </Field>
                    <Field label="Срок задачи">
                        <div className="flex items-center gap-2">
                            <Dot date={c.currentTaskDate} done={c.status === 'terminated'} />
                            <input type="date" className={FIELD} value={c.currentTaskDate ?? ''} onChange={e => patch('Изменён срок актуальной задачи', { currentTaskDate: e.target.value || null })} />
                        </div>
                    </Field>
                    <label className="flex cursor-pointer items-center gap-2 self-end pb-2.5 text-sm">
                        <input type="checkbox" className="h-4 w-4" checked={c.directorControl} onChange={e => patch(e.target.checked ? 'Дело взято на контроль директора' : 'Контроль директора снят', { directorControl: e.target.checked })} />
                        На контроле директора
                    </label>
                </div>

                {(c.status !== 'in_progress' || c.outcome) && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <Field label="Код исхода">
                            <select className={FIELD} value={c.outcome ?? ''} onChange={e => patch('Указан исход дела', { outcome: (e.target.value || null) as Outcome | null })}>
                                <option value="">— не указан —</option>
                                {(Object.keys(OUTCOME_LABEL) as Outcome[]).map(o => <option key={o} value={o}>{o} — {OUTCOME_LABEL[o]}</option>)}
                            </select>
                        </Field>
                        <Field label="Комментарий к исходу">
                            <input className={FIELD} value={c.outcomeComment} onChange={e => patchSilent({ outcomeComment: e.target.value })} />
                        </Field>
                    </div>
                )}
                {c.programs.length > 0 && (
                    <p className="mt-4 text-xs text-muted-foreground">Корпоративные программы: {c.programs.join(', ')}</p>
                )}
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-5 lg:col-span-2">
                    <Card
                        title="Судебные инстанции"
                        icon={Gavel}
                        action={nextInstance && (
                            <button type="button" className={BTN_GHOST} onClick={() => edit(`Добавлена инстанция: ${INSTANCE_LABEL[nextInstance]}`, x => ({ ...x, instances: [...x.instances, emptyInstance(nextInstance)] }))}>
                                <Plus size={14} /> {INSTANCE_LABEL[nextInstance]}
                            </button>
                        )}
                    >
                        {!hasFirst && <p className="text-sm text-muted-foreground">Инстанции не заведены.</p>}
                        <div className="space-y-4">
                            {c.instances.map(i => (
                                <div key={i.type} className="rounded-xl border border-border bg-foreground/[0.03] p-4">
                                    <p className="text-sm font-semibold">{INSTANCE_LABEL[i.type]}</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <Field label="Суд"><input className={FIELD} value={i.court} onChange={e => updateInstance(i.type, { court: e.target.value })} /></Field>
                                        <Field label="Судья"><input className={FIELD} value={i.judge} onChange={e => updateInstance(i.type, { judge: e.target.value })} /></Field>
                                        <Field label="Номер дела"><input className={FIELD} value={i.number} onChange={e => updateInstance(i.type, { number: e.target.value })} /></Field>
                                        <Field label="Дата решения"><input type="date" className={FIELD} value={i.decisionDate ?? ''} onChange={e => updateInstance(i.type, { decisionDate: e.target.value || null }, 'Указана дата решения')} /></Field>
                                        <Field label="Срок обжалования">
                                            <div className="flex items-center gap-2">
                                                <Dot date={i.appealDeadline} />
                                                <input type="date" className={FIELD} value={i.appealDeadline ?? ''} onChange={e => updateInstance(i.type, { appealDeadline: e.target.value || null }, 'Изменён срок обжалования')} />
                                            </div>
                                        </Field>
                                        <Field label="Следующее заседание"><input type="date" className={FIELD} value={i.nextHearing ?? ''} onChange={e => updateInstance(i.type, { nextHearing: e.target.value || null }, 'Изменена дата следующего заседания')} /></Field>
                                        <Field label="Что будет на заседании" className="sm:col-span-2"><input className={FIELD} value={i.nextTask} onChange={e => updateInstance(i.type, { nextTask: e.target.value })} /></Field>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Заседания</p>
                                            <button type="button" className={BTN_GHOST} onClick={() => setHearingFor(hearingFor === i.type ? null : i.type)}><CalendarPlus size={14} /> Добавить</button>
                                        </div>
                                        {hearingFor === i.type && (
                                            <div className="mt-2 grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                                                <input type="date" className={FIELD} value={hearing.date} onChange={e => setHearing({ ...hearing, date: e.target.value })} />
                                                <input className={FIELD} placeholder="План заседания" value={hearing.plan} onChange={e => setHearing({ ...hearing, plan: e.target.value })} />
                                                <button type="button" className={BTN} onClick={() => addHearing(i.type)}>Сохранить</button>
                                            </div>
                                        )}
                                        {i.hearings.length === 0 ? (
                                            <p className="mt-2 text-sm text-muted-foreground">Заседаний пока не было.</p>
                                        ) : (
                                            <ul className="mt-2 divide-y divide-border">
                                                {i.hearings.map(h => (
                                                    <li key={h.id} className="grid gap-1 py-2 text-sm sm:grid-cols-[7rem_1fr_1.4fr] sm:gap-3">
                                                        <span className="font-medium">{fmtDate(h.date)}</span>
                                                        <span>{h.plan || '—'}</span>
                                                        <input
                                                            className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-muted-foreground outline-none hover:border-border focus:border-sky-500/60"
                                                            placeholder="Результат заседания"
                                                            value={h.result}
                                                            onChange={e => updateInstance(i.type, { hearings: i.hearings.map(x => (x.id === h.id ? { ...x, result: e.target.value } : x)) })}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <Card
                    title="Участники"
                    icon={Users}
                    action={<button type="button" className={BTN_GHOST} onClick={() => setAddingParty(v => !v)}><Plus size={14} /> Добавить</button>}
                >
                    {addingParty && (
                        <div className="mb-3 grid gap-2 sm:grid-cols-[9rem_1fr_9rem_auto]">
                            <select className={FIELD} value={party.role} onChange={e => setParty({ ...party, role: e.target.value as PartyRole })}>
                                {(Object.keys(PARTY_ROLE_LABEL) as PartyRole[]).map(r => <option key={r} value={r}>{PARTY_ROLE_LABEL[r]}</option>)}
                            </select>
                            <input className={FIELD} placeholder="Наименование или ФИО" value={party.name} onChange={e => setParty({ ...party, name: e.target.value })} />
                            <input className={FIELD} placeholder="ИНН" inputMode="numeric" value={party.inn} onChange={e => setParty({ ...party, inn: e.target.value.replace(/\D/g, '').slice(0, 12) })} />
                            <button
                                type="button"
                                className={BTN}
                                onClick={() => {
                                    if (!party.name.trim()) { ctx.notify('Укажите участника'); return }
                                    const id = db.seq + 1
                                    edit(`Добавлен участник: ${party.name.trim()}`, x => ({ ...x, parties: [...x.parties, { id, role: party.role, name: party.name.trim(), inn: party.inn, ours: false }] }))
                                    setParty({ role: 'other', name: '', inn: '' })
                                    setAddingParty(false)
                                }}
                            >Добавить</button>
                        </div>
                    )}
                    <ul className="divide-y divide-border">
                        {c.parties.map(p => (
                            <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <div className="min-w-0">
                                    <p className="font-medium">{p.name} {p.ours && <Badge cls="bg-sky-500/15 text-sky-500 dark:text-sky-400">наша компания</Badge>}</p>
                                    <p className="text-xs text-muted-foreground">{PARTY_ROLE_LABEL[p.role]}{p.inn && <> · ИНН {p.inn}</>}</p>
                                </div>
                                {!p.ours && (
                                    <button type="button" aria-label="Удалить участника" className={BTN_DANGER_ICON} onClick={() => edit(`Удалён участник: ${p.name}`, x => ({ ...x, parties: x.parties.filter(y => y.id !== p.id) }))}><Trash2 size={15} /></button>
                                )}
                            </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">Роль компании группы в деле: {ROLE_LABEL[c.role]} · {companyName(c.companyId)}</p>
                </Card>

                <Card title="Финансовые требования" icon={Banknote}>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Сумма требований, ₽"><input inputMode="numeric" className={FIELD} value={c.fin.claim || ''} onChange={e => setFin({ claim: money(e.target.value) ?? 0 })} /></Field>
                        <Field label="Судебные расходы, ₽"><input inputMode="numeric" className={FIELD} value={c.fin.costs || ''} onChange={e => setFin({ costs: money(e.target.value) ?? 0 })} /></Field>
                        <Field label="Присуждено по требованиям, ₽"><input inputMode="numeric" className={FIELD} value={c.fin.awarded ?? ''} onChange={e => setFin({ awarded: money(e.target.value) })} placeholder="решения ещё нет" /></Field>
                        <Field label="Присуждено расходов, ₽"><input inputMode="numeric" className={FIELD} value={c.fin.awardedCosts ?? ''} onChange={e => setFin({ awardedCosts: money(e.target.value) })} /></Field>
                    </div>
                    <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                        {[
                            ['Финансовый прогноз', fmtRub(fin.forecast), ''],
                            ['Финансовый результат', fmtRub(fin.result), ''],
                            [
                                'Эффект для компании', fin.effect === null ? '—' : `${fin.effect > 0 ? '+' : ''}${fmtRub(fin.effect)}`,
                                fin.effect === null || fin.effect === 0 ? '' : fin.effect > 0 ? 'text-emerald-500' : 'text-rose-500',
                            ],
                        ].map(([t, v, cls]) => (
                            <div key={t} className="rounded-xl border border-border bg-foreground/[0.03] p-3">
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t}</dt>
                                <dd className={`mt-1 text-lg font-semibold ${cls}`}>{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-3 text-xs text-muted-foreground">
                        {c.role === 'plaintiff' ? 'Истец: эффект — присуждённая сумма минус заявленные требования.' : 'Ответчик: эффект — заявленные требования минус сумма, которую придётся заплатить.'}
                    </p>
                </Card>

                {showEnforcement && (
                    <Card title="Исполнение решения" icon={ShieldCheck}>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
                                <input type="checkbox" className="h-4 w-4" checked={c.enforcement.writIssued} onChange={e => setEnf({ writIssued: e.target.checked })} />
                                Исполнительный лист получен
                            </label>
                            <Field label="Куда передан">
                                <select className={FIELD} value={c.enforcement.transferredTo} onChange={e => setEnf({ transferredTo: e.target.value as TransferTarget })}>
                                    {(Object.keys(TRANSFER_LABEL) as TransferTarget[]).map(t => <option key={t} value={t}>{TRANSFER_LABEL[t]}</option>)}
                                </select>
                            </Field>
                            <Field label="Срок исполнения"><input type="date" className={FIELD} value={c.enforcement.deadline ?? ''} onChange={e => setEnf({ deadline: e.target.value || null })} /></Field>
                            <Field label="Ход исполнения" className="sm:col-span-2"><textarea rows={2} className={FIELD} value={c.enforcement.note} onChange={e => setEnf({ note: e.target.value })} /></Field>
                        </div>
                    </Card>
                )}

                <Card title="Поручения по делу" icon={ClipboardList}>
                    <div className="grid gap-2 sm:grid-cols-[1fr_11rem_9.5rem_auto]">
                        <input className={FIELD} placeholder="Что нужно сделать" value={task.title} onChange={e => setTask({ ...task, title: e.target.value })} />
                        <select className={FIELD} value={task.executorId} onChange={e => setTask({ ...task, executorId: Number(e.target.value) })}>{EXECUTORS.map(x => <option key={x.id} value={x.id}>{shortName(x.name)}</option>)}</select>
                        <input type="date" className={FIELD} value={task.deadline} onChange={e => setTask({ ...task, deadline: e.target.value })} />
                        <button type="button" className={BTN} onClick={addTask}>Поручить</button>
                    </div>
                    {tasks.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Поручений нет.</p> : (
                        <ul className="mt-3 divide-y divide-border">
                            {tasks.map(t => (
                                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                    <div className="flex min-w-0 items-start gap-2">
                                        <span className="mt-1.5"><Dot date={t.deadline} done={t.status === 'done'} /></span>
                                        <div className="min-w-0">
                                            <p className="font-medium">{t.title}</p>
                                            <p className="text-xs text-muted-foreground">{shortName(execName(t.executorId))} · до {fmtDate(t.deadline)}</p>
                                        </div>
                                    </div>
                                    <Badge cls={TASK_CLS[t.status]}>{TASK_LABEL[t.status]}</Badge>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card title="Заметки календаря" icon={NotebookPen}>
                    <div className="grid gap-2 sm:grid-cols-[9.5rem_1fr_auto]">
                        <input type="date" className={FIELD} value={note.date} onChange={e => setNote({ ...note, date: e.target.value })} />
                        <input className={FIELD} placeholder="Заметка к дате" value={note.text} onChange={e => setNote({ ...note, text: e.target.value })} />
                        <button
                            type="button"
                            className={BTN}
                            onClick={() => {
                                if (!note.date || !note.text.trim()) { ctx.notify('Укажите дату и текст заметки'); return }
                                const id = db.seq + 1
                                edit('Добавлена заметка в календарь', x => ({ ...x, notes: [...x.notes, { id, date: note.date, text: note.text.trim() }].sort((a, b) => a.date.localeCompare(b.date)) }))
                                setNote({ date: '', text: '' })
                            }}
                        >Добавить</button>
                    </div>
                    {c.notes.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Заметок нет.</p> : (
                        <ul className="mt-3 divide-y divide-border">
                            {c.notes.map(n => (
                                <li key={n.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                    <span><span className="font-medium">{fmtDate(n.date)}</span> · {n.text}</span>
                                    <button type="button" aria-label="Удалить заметку" className={BTN_DANGER_ICON} onClick={() => edit('Удалена заметка', x => ({ ...x, notes: x.notes.filter(y => y.id !== n.id) }))}><Trash2 size={15} /></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                {linked.length > 0 && (
                    <Card title="Связанные дела" icon={Link2}>
                        <ul className="divide-y divide-border">
                            {linked.map(l => (
                                <li key={l.id} className="py-2">
                                    <button type="button" className="text-left text-sm hover:text-sky-500" onClick={() => ctx.openCase(l.id)}>
                                        <span className="font-medium">{mainNumber(l)}</span> · {l.subject}
                                        <span className="ml-2 inline-block align-middle"><StatusBadge status={l.status} /></span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}

                <div className="lg:col-span-2">
                    <Card title="История изменений" icon={History}>
                        <ul className="divide-y divide-border">
                            {c.history.map(h => (
                                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                                    <span>{h.text}</span>
                                    <span className="text-xs text-muted-foreground">{h.user} · {fmtDate(h.at.slice(0, 10))} {h.at.slice(11, 16)}</span>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    )
}

