import { useMemo, useState } from 'react'
import {
    Ban, Building, Calendar, Clock, Mail, Pencil, Phone, Send, Trash2, Users,
} from 'lucide-react'
import { BTN, BTN_GHOST, BTN_ICON, FIELD, Sheet } from '../polls/ui'
import {
    AUTHORITIES, MONTH_NAMES, RESPONSIBLES, TYPE_TABS, authorityName, daysInMonth, eventMonth, eventsWord,
    formatDateTime, formatYmd, monthLabel, shiftMonth, toYmd,
    type Authority, type MonthRef, type PlanEvent,
} from './data'

const LABEL = 'mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground'

// ── Форма мероприятия ──────────────────────────────────────────────────────

export interface EventFormData {
    authorityId: number
    responsible: string
    dateFrom: string
    dateTo: string
    title: string
    description: string
    address: string
    place: string
    timeFrom: string
    timeTo: string
}

export function EventFormModal({ event, plan, authorities, blockedIds, onSave, onDelete, onClose }: {
    event: PlanEvent | null
    plan: MonthRef
    /** ИОГВ, доступные в списке (для ответственного — только свой) */
    authorities: Authority[]
    /** ИОГВ с отметкой «Нет мероприятий» — добавлять им мероприятия нельзя */
    blockedIds: number[]
    onSave: (data: EventFormData) => void
    onDelete?: () => void
    onClose: () => void
}) {
    const [form, setForm] = useState<EventFormData>(() => event
        ? {
            authorityId: event.authorityId, responsible: event.responsible, dateFrom: event.dateFrom, dateTo: event.dateTo,
            title: event.title, description: event.description, address: event.address, place: event.place,
            timeFrom: event.timeFrom, timeTo: event.timeTo,
        }
        : {
            authorityId: authorities.find(a => !blockedIds.includes(a.id))?.id ?? 0, responsible: '', dateFrom: '', dateTo: '',
            title: '', description: '', address: '', place: '', timeFrom: '', timeTo: '',
        })
    const [error, setError] = useState('')

    const minDate = toYmd(plan, 1)
    const maxDate = toYmd(plan, daysInMonth(plan))
    const set = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => setForm(f => ({ ...f, [key]: value }))
    const responsibles = RESPONSIBLES.filter(r => r.authorityId === form.authorityId)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.authorityId) return setError('Выберите ИОГВ')
        if (!form.title.trim()) return setError('Укажите название мероприятия')
        if (!form.dateFrom) return setError('Укажите дату начала')
        if (form.dateFrom < minDate || form.dateFrom > maxDate) return setError(`Дата должна быть в месяце плана: ${monthLabel(plan)}`)
        if (form.dateTo && form.dateTo < form.dateFrom) return setError('Дата окончания раньше даты начала')
        if (!form.place.trim()) return setError('Укажите место проведения')
        if (!form.responsible.trim()) return setError('Укажите ответственного')
        onSave({ ...form, title: form.title.trim(), place: form.place.trim(), responsible: form.responsible.trim() })
    }

    return (
        <Sheet
            title={<h3 className="text-lg font-bold">{event ? 'Редактирование мероприятия' : 'Новое мероприятие'}</h3>}
            onClose={onClose}
            footer={
                <>
                    {onDelete && (
                        <button type="button" onClick={onDelete} className={`${BTN_GHOST} mr-auto !text-rose-500`}>
                            <Trash2 size={14} /> Удалить
                        </button>
                    )}
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Отмена</button>
                    <button type="submit" form="event-form" className={BTN}>{event ? 'Сохранить' : 'Добавить'}</button>
                </>
            }
        >
            <form id="event-form" onSubmit={submit} className="space-y-4">
                <div>
                    <label className={LABEL}>ИОГВ</label>
                    <select
                        className={FIELD}
                        value={form.authorityId}
                        disabled={authorities.length === 1}
                        onChange={e => setForm(f => ({ ...f, authorityId: Number(e.target.value), responsible: '' }))}
                    >
                        {authorities.map(a => (
                            <option key={a.id} value={a.id} disabled={blockedIds.includes(a.id) && a.id !== event?.authorityId}>
                                {a.name}{blockedIds.includes(a.id) ? ' — нет мероприятий' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={LABEL}>Название</label>
                    <input className={FIELD} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Название мероприятия" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className={LABEL}>Дата начала</label>
                        <input type="date" className={FIELD} min={minDate} max={maxDate} value={form.dateFrom} onChange={e => set('dateFrom', e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL}>Дата окончания</label>
                        <input type="date" className={FIELD} min={form.dateFrom || minDate} max={maxDate} value={form.dateTo} onChange={e => set('dateTo', e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL}>Время начала</label>
                        <input type="time" className={FIELD} value={form.timeFrom} onChange={e => set('timeFrom', e.target.value)} />
                    </div>
                    <div>
                        <label className={LABEL}>Время окончания</label>
                        <input type="time" className={FIELD} value={form.timeTo} onChange={e => set('timeTo', e.target.value)} />
                    </div>
                </div>

                <div>
                    <label className={LABEL}>Место проведения</label>
                    <input className={FIELD} value={form.place} onChange={e => set('place', e.target.value)} placeholder="Организация или площадка" />
                </div>
                <div>
                    <label className={LABEL}>Адрес</label>
                    <input className={FIELD} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Необязательно" />
                </div>

                <div>
                    <label className={LABEL}>Ответственный</label>
                    <input className={FIELD} list="events-plan-responsibles" value={form.responsible} onChange={e => set('responsible', e.target.value)} placeholder="ФИО" />
                    <datalist id="events-plan-responsibles">
                        {responsibles.map(r => <option key={r.id} value={r.name} />)}
                    </datalist>
                </div>

                <div>
                    <label className={LABEL}>Описание</label>
                    <textarea className={`${FIELD} min-h-24 resize-y`} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Необязательно" />
                </div>

                {error && <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</p>}
            </form>
        </Sheet>
    )
}

// ── «Нет мероприятий» ──────────────────────────────────────────────────────

export function NoEventsModal({ plan, authorities, unavailableIds, onSave, onClose }: {
    plan: MonthRef
    authorities: Authority[]
    /** ИОГВ, у которых уже есть мероприятия или отметка */
    unavailableIds: number[]
    onSave: (authorityId: number) => void
    onClose: () => void
}) {
    const first = authorities.find(a => !unavailableIds.includes(a.id))?.id ?? 0
    const [authorityId, setAuthorityId] = useState(first)

    return (
        <Sheet
            title={<h3 className="flex items-center gap-2 text-lg font-bold"><Ban size={18} className="text-amber-500" /> Нет мероприятий</h3>}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Отмена</button>
                    <button type="button" disabled={!authorityId} onClick={() => onSave(authorityId)} className={BTN}>Подтвердить</button>
                </>
            }
        >
            <p className="mb-4 text-sm text-muted-foreground">
                Подтвердите, что в {monthLabel(plan).toLowerCase()} ИОГВ не планирует основных мероприятий. После этого запись считается заполненной.
            </p>
            <label className={LABEL}>ИОГВ</label>
            <select className={FIELD} value={authorityId} disabled={authorities.length === 1} onChange={e => setAuthorityId(Number(e.target.value))}>
                {authorities.map(a => (
                    <option key={a.id} value={a.id} disabled={unavailableIds.includes(a.id)}>
                        {a.name}{unavailableIds.includes(a.id) ? ' — уже заполнено' : ''}
                    </option>
                ))}
            </select>
            {!first && <p className="mt-3 text-sm text-muted-foreground">Все доступные ИОГВ уже заполнили план.</p>}
        </Sheet>
    )
}

// ── Архив ──────────────────────────────────────────────────────────────────

export function ArchiveModal({ plan, current, onApply, onClose }: {
    plan: MonthRef
    current: MonthRef
    onApply: (ref: MonthRef) => void
    onClose: () => void
}) {
    const [year, setYear] = useState(current.year)
    const [month, setMonth] = useState(current.month)
    const years = [plan.year - 1, plan.year]

    return (
        <Sheet
            title={<h3 className="flex items-center gap-2 text-lg font-bold"><Calendar size={18} className="text-amber-500" /> Архив сводных планов</h3>}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Отмена</button>
                    <button type="button" onClick={() => { onApply({ month, year }); onClose() }} className={BTN}>Показать</button>
                </>
            }
        >
            <div className="mb-4 flex gap-1 rounded-xl border border-border bg-foreground/5 p-1">
                {years.map(y => (
                    <button
                        key={y}
                        type="button"
                        onClick={() => setYear(y)}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${year === y ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {y}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, i) => {
                    const ref = { month: i + 1, year }
                    const isPlan = ref.month === plan.month && ref.year === plan.year
                    const future = ref.year * 12 + ref.month > plan.year * 12 + plan.month
                    return (
                        <button
                            key={name}
                            type="button"
                            disabled={future}
                            onClick={() => setMonth(ref.month)}
                            className={`rounded-xl border px-2 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                                month === ref.month ? 'border-sky-500/50 bg-sky-500/15 text-sky-500 dark:text-sky-400' : 'border-border bg-foreground/5 hover:bg-foreground/10'
                            }`}
                        >
                            {name}
                            {isPlan && <span className="block text-[10px] text-emerald-500">текущий план</span>}
                        </button>
                    )
                })}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">В демо данные есть за плановый месяц и три предыдущих; за остальные периоды план пуст.</p>
        </Sheet>
    )
}

// ── Мероприятия ИОГВ ───────────────────────────────────────────────────────

export function AuthorityEventsModal({ authority, events, noEventAt, canEdit, onEdit, onOpen, onCancelNoEvent, onClose }: {
    authority: Authority
    events: PlanEvent[]
    noEventAt: string | null
    canEdit: boolean
    onEdit: (e: PlanEvent) => void
    onOpen: (e: PlanEvent) => void
    onCancelNoEvent: () => void
    onClose: () => void
}) {
    return (
        <Sheet
            title={
                <div>
                    <h3 className="text-lg font-bold">{authority.name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {noEventAt ? 'Мероприятий не запланировано' : `${events.length} ${eventsWord(events.length)}`}
                    </p>
                </div>
            }
            onClose={onClose}
        >
            {noEventAt ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                    <p className="flex items-center gap-2 font-medium text-amber-500"><Ban size={16} /> Отмечено «Нет мероприятий»</p>
                    <p className="mt-1 text-muted-foreground">Дата отметки: {formatDateTime(noEventAt)}</p>
                    {canEdit && (
                        <button type="button" onClick={onCancelNoEvent} className={`${BTN_GHOST} mt-3`}>Отменить отметку</button>
                    )}
                </div>
            ) : (
                <div className="space-y-2.5">
                    {events.map(e => (
                        <div key={e.id} className="flex items-start gap-3 rounded-xl border border-border bg-foreground/5 p-3">
                            <button type="button" onClick={() => onOpen(e)} className="min-w-0 flex-1 text-left">
                                <p className="text-sm font-semibold">{e.title}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Calendar size={13} />{formatYmd(e.dateFrom)}{e.dateTo && e.dateTo !== e.dateFrom ? ` — ${formatYmd(e.dateTo)}` : ''}</span>
                                    {e.timeFrom && <span className="flex items-center gap-1"><Clock size={13} />{e.timeFrom}{e.timeTo ? ` — ${e.timeTo}` : ''}</span>}
                                    <span className="flex items-center gap-1"><Building size={13} />{e.place}</span>
                                </p>
                            </button>
                            {canEdit && (
                                <button type="button" aria-label="Редактировать" title="Редактировать" onClick={() => onEdit(e)} className={BTN_ICON}>
                                    <Pencil size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Sheet>
    )
}

// ── Детали мероприятия ─────────────────────────────────────────────────────

export function EventDetailsModal({ event, canEdit, onEdit, onClose }: {
    event: PlanEvent
    canEdit: boolean
    onEdit: () => void
    onClose: () => void
}) {
    const rows: { label: string; value: string }[] = [
        { label: 'Дата', value: `${formatYmd(event.dateFrom)}${event.dateTo && event.dateTo !== event.dateFrom ? ` — ${formatYmd(event.dateTo)}` : ''}` },
        ...(event.timeFrom || event.timeTo ? [{ label: 'Время', value: event.timeFrom && event.timeTo ? `${event.timeFrom} — ${event.timeTo}` : event.timeFrom || event.timeTo }] : []),
        { label: 'Место', value: event.place },
        ...(event.address ? [{ label: 'Адрес', value: event.address }] : []),
        { label: 'Ответственный', value: event.responsible },
    ]

    return (
        <Sheet
            title={
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{authorityName(event.authorityId)}</p>
                    <h3 className="mt-1 text-lg font-bold leading-snug">{event.title}</h3>
                </div>
            }
            onClose={onClose}
            footer={
                <>
                    {canEdit && <button type="button" onClick={onEdit} className={BTN}><Pencil size={14} /> Редактировать</button>}
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Закрыть</button>
                </>
            }
        >
            <dl className="space-y-3">
                {rows.map(r => (
                    <div key={r.label}>
                        <dt className={LABEL}>{r.label}</dt>
                        <dd className="text-sm">{r.value}</dd>
                    </div>
                ))}
                {event.description && (
                    <div>
                        <dt className={LABEL}>Описание</dt>
                        <dd className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</dd>
                    </div>
                )}
            </dl>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                <div><span className={LABEL}>Создано</span>{formatDateTime(event.createdAt)}</div>
                {event.updatedAt !== event.createdAt && <div><span className={LABEL}>Обновлено</span>{formatDateTime(event.updatedAt)}</div>}
            </div>
        </Sheet>
    )
}

// ── Ответственные ──────────────────────────────────────────────────────────

export const initials = (name: string) => name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

export function ResponsibleModal({ authority, onClose }: { authority: Authority; onClose: () => void }) {
    const list = RESPONSIBLES.filter(r => r.authorityId === authority.id)
    return (
        <Sheet
            title={
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-bold"><Users size={18} className="text-emerald-500" /> Ответственные за ввод</h3>
                    <p className="text-sm text-muted-foreground">{authority.name}</p>
                </div>
            }
            onClose={onClose}
        >
            <div className="space-y-2.5">
                {list.map(r => (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-foreground/5 p-3">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#1a234f] text-xs font-semibold text-white">{initials(r.name)}</span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.position}</p>
                            <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                <span className="flex items-center gap-1"><Phone size={12} />{r.phone}</span>
                                <span className="flex items-center gap-1 break-all"><Mail size={12} />{r.email}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </Sheet>
    )
}

// ── Рассылка напоминаний ───────────────────────────────────────────────────

export function SendModal({ authorities, onSend, onClose }: {
    authorities: Authority[]
    onSend: () => void
    onClose: () => void
}) {
    const recipients = RESPONSIBLES.filter(r => authorities.some(a => a.id === r.authorityId))
    return (
        <Sheet
            title={<h3 className="flex items-center gap-2 text-lg font-bold"><Send size={18} className="text-sky-500" /> Напоминание о заполнении</h3>}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Отмена</button>
                    <button type="button" onClick={onSend} className={BTN}><Send size={14} /> Отправить</button>
                </>
            }
        >
            <p className="text-sm text-muted-foreground">
                Уведомление получат ответственные за ввод — {recipients.length} чел. из {authorities.length} ИОГВ.
                В демо письма не отправляются.
            </p>
            <ul className="mt-4 space-y-1.5">
                {authorities.map(a => {
                    const count = RESPONSIBLES.filter(r => r.authorityId === a.id).length
                    return (
                        <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-foreground/5 px-3 py-2 text-sm">
                            <span className="min-w-0 truncate">{a.name}</span>
                            <span className={`flex-shrink-0 text-xs ${count ? 'text-muted-foreground' : 'text-amber-500'}`}>
                                {count ? `${count} получ.` : 'нет ответственных'}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </Sheet>
    )
}

// ── Статистика ─────────────────────────────────────────────────────────────

function Bar({ label, value, max, suffix, tone = 'sky' }: { label: string; value: number; max: number; suffix?: string; tone?: 'sky' | 'emerald' | 'amber' }) {
    const tones = { sky: 'bg-sky-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500' }
    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate">{label}</span>
                <span className="flex-shrink-0 font-semibold">{value}{suffix}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                <div className={`h-full rounded-full ${tones[tone]}`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
            </div>
        </div>
    )
}

export function StatisticsModal({ plan, view, events, noEventIds, onClose }: {
    plan: MonthRef
    view: MonthRef
    events: PlanEvent[]
    /** ИОГВ с отметкой «Нет мероприятий» в просматриваемом месяце */
    noEventIds: number[]
    onClose: () => void
}) {
    const inView = useMemo(
        () => events.filter(e => { const m = eventMonth(e); return m.month === view.month && m.year === view.year }),
        [events, view],
    )

    const byType = TYPE_TABS.map(t => {
        const list = AUTHORITIES.filter(a => a.type === t.id)
        const filled = list.filter(a => noEventIds.includes(a.id) || inView.some(e => e.authorityId === a.id)).length
        return { name: t.name, total: list.length, filled }
    })

    const top = AUTHORITIES
        .map(a => ({ name: a.name, count: inView.filter(e => e.authorityId === a.id).length }))
        .filter(x => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

    const history = [-3, -2, -1, 0].map(d => {
        const ref = shiftMonth(plan, d)
        return {
            name: monthLabel(ref),
            count: events.filter(e => { const m = eventMonth(e); return m.month === ref.month && m.year === ref.year }).length,
        }
    })

    const weeks = [1, 2, 3, 4, 5].map(w => ({
        name: `${(w - 1) * 7 + 1}–${Math.min(w * 7, daysInMonth(view))} числа`,
        count: inView.filter(e => { const d = Number(e.dateFrom.split('-')[2]); return Math.ceil(d / 7) === w }).length,
    })).filter(w => Number(w.name.split('–')[0]) <= daysInMonth(view))

    const maxHistory = Math.max(1, ...history.map(h => h.count))
    const maxWeek = Math.max(1, ...weeks.map(w => w.count))

    return (
        <Sheet
            title={
                <div>
                    <h3 className="text-lg font-bold">Статистика плана</h3>
                    <p className="text-sm text-muted-foreground">{monthLabel(view)} · {inView.length} {eventsWord(inView.length)}</p>
                </div>
            }
            onClose={onClose}
        >
            <div className="space-y-6">
                <section>
                    <h4 className={LABEL}>Заполнение по группам ИОГВ</h4>
                    <div className="space-y-3">
                        {byType.map(t => <Bar key={t.name} label={`${t.name} (${t.filled} из ${t.total})`} value={t.total ? Math.round((t.filled / t.total) * 100) : 0} max={100} suffix="%" tone="emerald" />)}
                    </div>
                </section>
                <section>
                    <h4 className={LABEL}>Мероприятия по неделям месяца</h4>
                    <div className="space-y-3">
                        {weeks.map(w => <Bar key={w.name} label={w.name} value={w.count} max={maxWeek} />)}
                    </div>
                </section>
                <section>
                    <h4 className={LABEL}>Самые активные ИОГВ</h4>
                    {top.length === 0
                        ? <p className="text-sm text-muted-foreground">Мероприятий нет</p>
                        : <div className="space-y-3">{top.map(t => <Bar key={t.name} label={t.name} value={t.count} max={top[0].count} tone="amber" />)}</div>}
                </section>
                <section>
                    <h4 className={LABEL}>Динамика по месяцам</h4>
                    <div className="space-y-3">
                        {history.map(h => <Bar key={h.name} label={h.name} value={h.count} max={maxHistory} />)}
                    </div>
                </section>
            </div>
        </Sheet>
    )
}
