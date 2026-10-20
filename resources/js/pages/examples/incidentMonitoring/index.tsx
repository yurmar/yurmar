import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    AlertCircle, ArrowLeft, Building, Calendar, CheckCircle, ChevronDown, ChevronUp, Clock, Edit, Eye,
    FileText, MapPin, Save, ShieldCheck, User, Zap,
} from 'lucide-react'
import { BTN, BTN_GHOST, FIELD } from '../polls/ui'
import {
    GROUP, LOCALIZATIONS, ME, dayWord, formatDisplay, initialIncidents, nextId, parseLocal, toDateOnly,
    toLocalInput, visibleOnDate, type Incident,
} from './data'

type Role = 'it' | 'controller' | 'admin'

const ROLES: { id: Role; label: string; icon: typeof Edit }[] = [
    { id: 'it', label: 'Мониторинг IT', icon: Edit },
    { id: 'controller', label: 'Контролёр IT', icon: Eye },
    { id: 'admin', label: 'Администратор', icon: ShieldCheck },
]

const BADGE = 'rounded-full px-2 py-0.5 text-xs font-medium'
const INFO_BOX = 'rounded-xl bg-foreground/5 p-3'

function Timeline({ incident }: { incident: Incident }) {
    const start = parseLocal(incident.start)
    const end = incident.resolved ? parseLocal(incident.end) : new Date()
    if (!start || !end) return null

    const first = new Date(start); first.setHours(0, 0, 0, 0)
    const last = new Date(end); last.setHours(0, 0, 0, 0)
    const today = new Date(); today.setHours(0, 0, 0, 0)

    const days: { date: string; day: string; weekend: boolean; today: boolean; full: Date }[] = []
    for (const cur = new Date(first); cur <= last && days.length < 90; cur.setDate(cur.getDate() + 1)) {
        days.push({
            date: `${String(cur.getDate()).padStart(2, '0')}.${String(cur.getMonth() + 1).padStart(2, '0')}`,
            day: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'][cur.getDay()],
            weekend: cur.getDay() === 0 || cur.getDay() === 6,
            today: cur.getTime() === today.getTime(),
            full: new Date(cur),
        })
    }
    if (!days.length) return null

    const diff = Math.ceil(Math.abs(last.getTime() - first.getTime()) / 86400000)
    const duration = diff === 0 ? 'Менее дня' : `${diff} ${dayWord(diff)}`

    return (
        <div className="mt-3">
            <div className="mb-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 font-medium"><Calendar size={12} /> Временная шкала</span>
                {incident.resolved
                    ? <span className="text-muted-foreground">Длительность: {duration}</span>
                    : (
                        <span className="flex items-center gap-1.5 text-rose-500">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Активно: {duration}
                        </span>
                    )}
            </div>
            <div className="overflow-x-auto pb-2">
                <div className="flex min-w-max gap-1">
                    {days.map(d => (
                        <div
                            key={d.date}
                            title={d.full.toLocaleDateString('ru-RU')}
                            className={`flex min-w-[55px] cursor-help flex-col items-center rounded-lg border p-1.5 ${
                                d.today && !incident.resolved
                                    ? 'border-sky-500 bg-sky-500 text-white'
                                    : d.weekend && !incident.resolved
                                        ? 'border-rose-500/30 bg-rose-500/10'
                                        : 'border-emerald-500/30 bg-emerald-500/10'
                            }`}
                        >
                            <span className="text-xs font-semibold">{d.date}</span>
                            <span className={`text-[10px] ${d.today && !incident.resolved ? 'text-white/80' : 'text-muted-foreground'}`}>{d.day}</span>
                            {d.today && !incident.resolved && (
                                <span className="mt-0.5 rounded bg-white px-1 text-[8px] font-bold text-sky-600">сегодня</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function IncidentCard({ incident, canEdit, onUpdate }: {
    incident: Incident
    canEdit: boolean
    onUpdate: (id: number, patch: Partial<Incident>) => void
}) {
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState(false)
    const [resolveAt, setResolveAt] = useState(toLocalInput(new Date()))
    const [draft, setDraft] = useState({ resolved: incident.resolved, assistance: incident.assistance, comment: incident.comment, end: incident.end })

    const startEdit = () => {
        setDraft({ resolved: incident.resolved, assistance: incident.assistance, comment: incident.comment, end: incident.end })
        setEditing(true)
    }

    const saveEdit = () => {
        onUpdate(incident.id, {
            resolved: draft.resolved, assistance: draft.assistance, comment: draft.comment,
            end: draft.resolved ? draft.end : '',
        })
        setEditing(false)
    }

    const assistanceBadge = incident.assistance
        ? <span className={`${BADGE} bg-amber-500/15 text-amber-500`}>Требуется содействие</span>
        : <span className={`${BADGE} bg-emerald-500/15 text-emerald-500`}>Содействие не требуется</span>

    if (incident.noIncident) {
        return (
            <div className="card-block mb-3 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm">{incident.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><User size={12} /> {incident.author}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDisplay(incident.start)}</span>
                        </div>
                    </div>
                    <span className={`${BADGE} bg-foreground/10 text-muted-foreground`}>Нет инцидентов</span>
                </div>
            </div>
        )
    }

    return (
        <div className={`card-block mb-3 rounded-2xl border-l-4 ${incident.resolved ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
            <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                <div className="min-w-0 flex-1">
                    <h4 className="font-semibold leading-snug">{incident.localization || 'Без локализации'}</h4>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {incident.resolved
                            ? <span className={`${BADGE} bg-emerald-500/15 text-emerald-500`}>Решён</span>
                            : <span className={`${BADGE} animate-pulse bg-rose-500/15 text-rose-500`}>Не решён</span>}
                        {assistanceBadge}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock size={12} /> Создан: {formatDisplay(incident.start)}</span>
                        {incident.localization && <span className="flex items-center gap-1"><MapPin size={12} /> {incident.localization}</span>}
                        <span className="flex items-center gap-1"><User size={12} /> {incident.author}</span>
                    </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                    {!incident.resolved && (
                        <span className="hidden items-center gap-1 text-xs font-semibold text-rose-500 sm:flex">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" /> АКТИВЕН
                        </span>
                    )}
                    {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
            </button>

            {open && (
                <div className="border-t border-border p-4 pt-3">
                    <Timeline incident={incident} />

                    {editing ? (
                        <div className="mt-3 space-y-3">
                            <div className={INFO_BOX}>
                                <p className="mb-2 text-sm font-medium">Статус инцидента</p>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" className="h-4 w-4" checked={draft.resolved}
                                            onChange={e => setDraft(d => ({ ...d, resolved: e.target.checked, end: e.target.checked && !d.end ? toLocalInput(new Date()) : d.end }))} />
                                        Инцидент решён
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" className="h-4 w-4" checked={draft.assistance}
                                            onChange={e => setDraft(d => ({ ...d, assistance: e.target.checked }))} />
                                        Требуется содействие
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Комментарий</label>
                                <textarea rows={3} className={FIELD} value={draft.comment} placeholder="Комментарий..."
                                    onChange={e => setDraft(d => ({ ...d, comment: e.target.value }))} />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Дата решения {draft.resolved && <span className="text-rose-500">*</span>}
                                </label>
                                <input type="datetime-local" className={FIELD} value={draft.end}
                                    onChange={e => setDraft(d => ({ ...d, end: e.target.value }))} />
                                {draft.resolved && !draft.end && <p className="mt-1 text-xs text-rose-500">Укажите дату решения</p>}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" className={BTN} disabled={draft.resolved && !draft.end} onClick={saveEdit}>
                                    <Save size={14} /> Сохранить
                                </button>
                                <button type="button" className={BTN_GHOST} onClick={() => setEditing(false)}>Отмена</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {incident.description && (
                                <div className={`${INFO_BOX} mt-3`}>
                                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Описание ситуации:</p>
                                    <p className="text-sm">{incident.description}</p>
                                </div>
                            )}
                            {incident.comment && (
                                <div className={`${INFO_BOX} mt-3`}>
                                    <p className="mb-1 text-xs font-semibold text-muted-foreground">Комментарий:</p>
                                    <p className="text-sm">{incident.comment}</p>
                                </div>
                            )}
                            <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                <span className="flex items-center gap-1.5"><Calendar size={12} /> Начало: {formatDisplay(incident.start)}</span>
                                <span className="flex items-center gap-1.5"><CheckCircle size={12} /> Конец: {incident.resolved ? formatDisplay(incident.end) : 'Не решён'}</span>
                                <span className="flex items-center gap-1.5 sm:col-span-2"><Building size={12} /> Группа: {incident.group}</span>
                            </div>
                            {canEdit && (
                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                                    <button type="button" className={BTN_GHOST} onClick={startEdit}><Edit size={14} /> Редактировать</button>
                                    {!incident.resolved && (
                                        <>
                                            <input type="datetime-local" className={`${FIELD} !w-auto min-w-[170px] flex-1`} value={resolveAt}
                                                onChange={e => setResolveAt(e.target.value)} />
                                            <button type="button" className={BTN} disabled={!resolveAt}
                                                onClick={() => onUpdate(incident.id, { resolved: true, end: resolveAt })}>
                                                <CheckCircle size={14} /> Решить
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}

const emptyForm = () => ({ start: toLocalInput(new Date()), end: '', description: '', comment: '', resolved: false, assistance: false, localization: '' })

export default function IncidentMonitoringExample() {
    const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
    const [role, setRole] = useState<Role>('it')
    const [date, setDate] = useState(toDateOnly(new Date()))
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const canCreate = role !== 'controller'
    const canEdit = role !== 'controller'
    const canPickDate = role !== 'it'
    const today = toDateOnly(new Date())
    const shownDate = canPickDate ? date : today

    const visible = useMemo(() => incidents
        .filter(i => role !== 'it' || i.author === ME)
        .filter(i => visibleOnDate(i, shownDate))
        .sort((a, b) => b.start.localeCompare(a.start)),
    [incidents, role, shownDate])

    const update = (id: number, patch: Partial<Incident>) =>
        setIncidents(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)))

    const create = () => {
        if (!form.description.trim()) { setError('Заполните описание события'); return }
        if (form.resolved && !form.end) { setError('Укажите дату решения'); return }
        setError('')
        setIncidents(list => [{
            id: nextId(), noIncident: false, description: form.description.trim(), comment: form.comment.trim(),
            start: form.start, end: form.resolved ? form.end : '', resolved: form.resolved, assistance: form.assistance,
            localization: LOCALIZATIONS.includes(form.localization) ? form.localization : '', group: GROUP, author: ME,
        }, ...list])
        setForm(emptyForm())
        setDate(today)
    }

    const createNone = () =>
        setIncidents(list => [{
            id: nextId(), noIncident: true, description: 'Инцидентов не зарегистрировано.', comment: '',
            start: toLocalInput(new Date()), end: '', resolved: true, assistance: false, localization: '', group: GROUP, author: ME,
        }, ...list])

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                        <Zap size={14} /> Работа ИТ-службы
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Мониторинг IT инцидентов</h1>
                    <div className="mt-4 h-px w-16 bg-sky-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Ежедневный учёт сбоев: что случилось, где, когда устранено и нужно ли содействие.
                    </p>
                    <p className="mt-3 text-xs text-white/40">Торговая сеть «Северный ветер» · демо-данные вымышлены</p>
                </section>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Вид:</span>
                    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-1">
                        {ROLES.map(r => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id)}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                    role === r.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <r.icon size={14} /> {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`mt-6 grid grid-cols-1 gap-6 ${canCreate ? 'lg:grid-cols-2' : ''}`}>
                    {canCreate && (
                        <div className="card-block h-fit rounded-2xl p-5 sm:p-6">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                                <AlertCircle size={20} className="text-rose-500" /> Создание нового инцидента
                            </h2>
                            <div className="space-y-4">
                                <div className={INFO_BOX}>
                                    <p className="mb-2 text-sm font-medium">Подразделение:</p>
                                    <span className="inline-block rounded-lg bg-sky-500/15 px-2 py-1 text-xs text-sky-500 dark:text-sky-400">{GROUP}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Дата и время инцидента *</label>
                                        <input type="datetime-local" className={FIELD} value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Дата решения</label>
                                        <input type="datetime-local" className={FIELD} value={form.end} onChange={e => setForm(f => ({ ...f, end: e.target.value }))} />
                                    </div>
                                </div>
                                <div className={INFO_BOX}>
                                    <p className="mb-2 text-sm font-medium">Статус инцидента</p>
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="h-4 w-4" checked={form.resolved} onChange={e => setForm(f => ({ ...f, resolved: e.target.checked }))} />
                                            Инцидент решён
                                        </label>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input type="checkbox" className="h-4 w-4" checked={form.assistance} onChange={e => setForm(f => ({ ...f, assistance: e.target.checked }))} />
                                            Требуется содействие
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Локализация</label>
                                    <select className={FIELD} value={form.localization} onChange={e => setForm(f => ({ ...f, localization: e.target.value }))}>
                                        <option value="">-- Выберите локализацию --</option>
                                        {LOCALIZATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Описание события *</label>
                                    <textarea rows={4} className={FIELD} value={form.description} placeholder="Подробно опишите инцидент..."
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium">Комментарий</label>
                                    <textarea rows={2} className={FIELD} value={form.comment} placeholder="Краткий комментарий..."
                                        onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} />
                                </div>
                                {error && <p className="text-sm text-rose-500">{error}</p>}
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button type="button" className={`${BTN} flex-1`} onClick={create}><Save size={16} /> Сохранить инцидент</button>
                                    <button type="button" className={`${BTN_GHOST} flex-1`} onClick={createNone}><CheckCircle size={16} /> Инцидентов нет</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-block flex flex-col rounded-2xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                            <h2 className="flex items-center gap-3 text-sm font-semibold"><FileText size={20} className="text-sky-500" /> Список инцидентов</h2>
                            {canPickDate ? (
                                <input type="date" className={`${FIELD} !w-auto`} value={date} onChange={e => setDate(e.target.value)} />
                            ) : (
                                <span className="rounded-lg bg-sky-500/10 px-3 py-1 text-sm text-muted-foreground">Только сегодня: {today}</span>
                            )}
                        </div>
                        <div className="flex-1 p-4">
                            {visible.length === 0 ? (
                                <div className="py-12 text-center">
                                    <CheckCircle size={48} className="mx-auto mb-3 text-emerald-500" />
                                    <p className="font-medium">На {shownDate} инциденты не были зарегистрированы</p>
                                    {canCreate && <p className="mt-1 text-xs text-muted-foreground">Используйте форму для создания нового инцидента</p>}
                                </div>
                            ) : (
                                visible.map(i => <IncidentCard key={i.id} incident={i} canEdit={canEdit} onUpdate={update} />)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
