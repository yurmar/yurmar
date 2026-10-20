import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Activity, AlertTriangle, ArrowLeft, Ban, BarChart3, Briefcase, Building, Building2, Calendar, CheckCircle, CheckSquare,
    ChevronRight, Clock, Compass, File, FileText, Landmark, MapPin, Plus, RefreshCw, Search, Send, ShieldCheck, UserCheck,
    Users, X,
} from 'lucide-react'
import { FIELD } from '../polls/ui'
import {
    AUTHORITIES, MONTH_NAMES, MY_AUTHORITY_ID, ORG_NAME, RESPONSIBLES, TYPE_TABS,
    authorityName, deadlineInfo, eventMonth, formatDay, formatTime, formatYmd, makeInitialEvents,
    makeInitialNoEvents, monthLabel, nextId, planMonth, sameMonth,
    type Authority, type AuthorityType, type MonthRef, type PlanEvent, type Role,
} from './data'
import {
    ArchiveModal, AuthorityEventsModal, EventDetailsModal, EventFormModal, NoEventsModal, ResponsibleModal,
    SendModal, StatisticsModal, initials, type EventFormData,
} from './Modals'

const TAB_ICONS: Record<AuthorityType, typeof Building2> = { 1: Building2, 2: Users, 3: Briefcase, 4: Landmark, 10: Compass }

const ROLES: { id: Role; label: string }[] = [
    { id: 'admin', label: 'Администратор' },
    { id: 'input', label: 'Ответственный' },
    { id: 'viewer', label: 'Просмотр' },
]

const DEADLINE_CLS = {
    normal: 'border-emerald-400/30 bg-emerald-500/15 text-emerald-300',
    warning: 'border-amber-400/30 bg-amber-500/15 text-amber-300',
    urgent: 'border-rose-400/30 bg-rose-500/15 text-rose-300',
    closed: 'border-white/15 bg-white/10 text-white/70',
}

const HERO_BTN = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'

export default function EventsPlanExample() {
    const plan = useMemo(planMonth, [])
    const deadline = useMemo(deadlineInfo, [])

    const [events, setEvents] = useState<PlanEvent[]>(makeInitialEvents)
    const [noEvents, setNoEvents] = useState(makeInitialNoEvents)

    const [role, setRole] = useState<Role>('admin')
    const [acceptOpen, setAcceptOpen] = useState(true)
    const [view, setView] = useState<MonthRef>(plan)
    const [tab, setTab] = useState<AuthorityType>(1)
    const [search, setSearch] = useState('')

    const [sendMode, setSendMode] = useState(false)
    const [selected, setSelected] = useState<number[]>([])

    const [form, setForm] = useState<{ event: PlanEvent | null } | null>(null)
    const [noEventsOpen, setNoEventsOpen] = useState(false)
    const [archiveOpen, setArchiveOpen] = useState(false)
    const [statsOpen, setStatsOpen] = useState(false)
    const [sendOpen, setSendOpen] = useState(false)
    const [authorityModal, setAuthorityModal] = useState<Authority | null>(null)
    const [responsibleModal, setResponsibleModal] = useState<Authority | null>(null)
    const [details, setDetails] = useState<PlanEvent | null>(null)
    const [toast, setToast] = useState('')

    const isArchive = !sameMonth(view, plan)
    const isAdmin = role === 'admin'
    const canEditData = !isArchive && acceptOpen && role !== 'viewer'
    const canEditAuthority = (id: number) => canEditData && (isAdmin || id === MY_AUTHORITY_ID)

    const notify = (text: string) => {
        setToast(text)
        window.setTimeout(() => setToast(''), 3200)
    }

    // ── Данные просматриваемого месяца ─────────────────────────────────────

    const monthEvents = useMemo(
        () => events
            .filter(e => sameMonth(eventMonth(e), view))
            .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom) || a.timeFrom.localeCompare(b.timeFrom)),
        [events, view],
    )
    const monthNoEvents = useMemo(() => noEvents.filter(n => sameMonth(n, view)), [noEvents, view])
    const noEventIds = monthNoEvents.map(n => n.authorityId)

    /** Статус заполнения по каждому ИОГВ */
    const statusMap = useMemo(() => {
        const map = new Map<number, { created: string; edited: string | null; count: number; noEvent: boolean }>()
        for (const a of AUTHORITIES) {
            const own = monthEvents.filter(e => e.authorityId === a.id)
            if (own.length) {
                const created = own.reduce((m, e) => (e.createdAt > m ? e.createdAt : m), own[0].createdAt)
                const updated = own.reduce((m, e) => (e.updatedAt > m ? e.updatedAt : m), own[0].updatedAt)
                map.set(a.id, { created, edited: updated > created ? updated : null, count: own.length, noEvent: false })
            } else {
                const mark = monthNoEvents.find(n => n.authorityId === a.id)
                if (mark) map.set(a.id, { created: mark.createdAt, edited: null, count: 0, noEvent: true })
            }
        }
        return map
    }, [monthEvents, monthNoEvents])

    const filledCount = statusMap.size
    const emptyCount = AUTHORITIES.length - filledCount
    const percent = (n: number) => Math.round((n / AUTHORITIES.length) * 100)

    const tabAuthorities = AUTHORITIES.filter(a => a.type === tab)
    const emptyInTab = tabAuthorities.filter(a => !statusMap.has(a.id))

    const q = search.trim().toLowerCase()
    const visibleEvents = monthEvents.filter(e =>
        !q || e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) ||
        authorityName(e.authorityId).toLowerCase().includes(q) || e.responsible.toLowerCase().includes(q))
    const visibleNoEvents = monthNoEvents.filter(n => !q || authorityName(n.authorityId).toLowerCase().includes(q))

    // ── Действия ──────────────────────────────────────────────────────────

    const saveEvent = (data: EventFormData) => {
        const now = new Date().toISOString()
        if (form?.event) {
            const id = form.event.id
            setEvents(list => list.map(e => (e.id === id ? { ...e, ...data, updatedAt: now } : e)))
            notify('Мероприятие обновлено')
        } else {
            setEvents(list => [...list, { id: nextId(list), ...data, createdAt: now, updatedAt: now }])
            notify('Мероприятие добавлено')
        }
        setForm(null)
    }

    const deleteEvent = () => {
        if (!form?.event || !window.confirm('Удалить мероприятие?')) return
        const id = form.event.id
        setEvents(list => list.filter(e => e.id !== id))
        setForm(null)
        notify('Мероприятие удалено')
    }

    const saveNoEvents = (authorityId: number) => {
        setNoEvents(list => [...list, { authorityId, ...plan, createdAt: new Date().toISOString() }])
        setNoEventsOpen(false)
        notify('Отмечено: нет мероприятий')
    }

    const cancelNoEvent = (authorityId: number) => {
        if (!window.confirm('Отменить статус «Нет мероприятий»? Это позволит добавлять мероприятия.')) return
        setNoEvents(list => list.filter(n => !(n.authorityId === authorityId && sameMonth(n, view))))
        setAuthorityModal(null)
    }

    const toggleSendMode = (on: boolean) => {
        setSendMode(on)
        if (!on) setSelected([])
    }

    const selectAllInTab = () => {
        const ids = emptyInTab.map(a => a.id)
        if (!ids.length) return notify('Нет незаполненных ИОГВ в этой вкладке')
        setSelected(prev => (ids.every(id => prev.includes(id)) ? prev.filter(id => !ids.includes(id)) : Array.from(new Set([...prev, ...ids]))))
    }

    const sendNotifications = () => {
        setSendOpen(false)
        setSelected([])
        setSendMode(false)
        notify('Напоминания «отправлены» (демо — письма не уходят)')
    }

    const authorityEvents = authorityModal ? monthEvents.filter(e => e.authorityId === authorityModal.id) : []
    const authorityNoEvent = authorityModal ? monthNoEvents.find(n => n.authorityId === authorityModal.id)?.createdAt ?? null : null

    const availableAuthorities = isAdmin ? AUTHORITIES : AUTHORITIES.filter(a => a.id === MY_AUTHORITY_ID)
    const filledIds = Array.from(statusMap.keys())

    const stats = [
        { title: 'Всего', value: AUTHORITIES.length, icon: Building2, tint: 'bg-sky-500/20 text-sky-300', bar: 'from-sky-400 to-sky-300' },
        { title: 'Заполнено', value: filledCount, icon: CheckCircle, tint: 'bg-emerald-500/20 text-emerald-300', bar: 'from-emerald-400 to-emerald-300' },
        { title: 'Не заполнено', value: emptyCount, icon: AlertTriangle, tint: 'bg-amber-500/20 text-amber-300', bar: 'from-amber-400 to-amber-300' },
    ]

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                {/* ── Шапка ── */}
                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-10"
                    style={{ background: 'linear-gradient(135deg, #29387d 0%, #1a234f 100%)' }}
                >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d4b873]">
                                <Calendar size={14} /> Планирование
                            </span>
                            <h1 className="mt-3 text-3xl font-bold leading-tight">
                                Сводный план
                                <span className={`ml-2 block text-lg font-normal sm:inline ${isArchive ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {isArchive ? `Архив ${monthLabel(view)}` : `на ${monthLabel(view)}`}
                                </span>
                            </h1>
                            <div className="mt-3 h-px w-12 bg-[#d4b873]" />
                            <p className="mt-3 max-w-md leading-relaxed text-white/80">
                                Основные мероприятия, проводимые в Заречной области
                                {monthEvents.length > 0 && ` · всего мероприятий: ${monthEvents.length}`}
                                {sendMode && !isArchive && ` · выбрано: ${selected.length}`}
                            </p>
                        </div>

                        <div className="flex-shrink-0 lg:w-[420px]">
                            {!isArchive && (
                                <div className={`mb-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${DEADLINE_CLS[deadline.type]}`}>
                                    <Clock size={14} className="flex-shrink-0" />
                                    <span>Сегодня {formatDay(new Date().toISOString())} · {deadline.text}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                                {stats.map(({ title, value, icon: Icon, tint, bar }) => (
                                    <div key={title} className="min-w-[70px] rounded-lg border border-white/10 bg-white/10 px-2.5 py-2 backdrop-blur-sm">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg ${tint}`}><Icon size={12} /></span>
                                            <div className="min-w-0">
                                                <p className="truncate text-[11px] font-medium uppercase tracking-wider text-white/60">{title}</p>
                                                <p className="flex items-baseline gap-1 leading-none">
                                                    <span className="text-base font-bold">{value}</span>
                                                    <span className="text-[9px] text-white/50">{percent(value)}%</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
                                            <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: `${percent(value)}%` }} />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setStatsOpen(true)}
                                    className="group min-w-[70px] rounded-lg border border-white/10 bg-white/10 px-2.5 py-2 text-left backdrop-blur-sm transition-colors hover:bg-white/20"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300"><BarChart3 size={12} /></span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-white/60">Статистика</p>
                                            <p className="flex items-center gap-0.5 text-sm font-bold leading-none">Подробнее <ChevronRight size={12} /></p>
                                        </div>
                                    </div>
                                    <div className="mt-1 h-0.5 overflow-hidden rounded-full bg-white/10">
                                        <div className="h-full w-0 rounded-full bg-gradient-to-r from-purple-400 to-purple-300 transition-all duration-1000 group-hover:w-full" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Панель управления ── */}
                    <div className="mt-6 border-t border-white/10 pt-4">
                        <div className="rounded-lg border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                {isArchive ? (
                                    <>
                                        <span className="mr-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                                            <span className="h-3 w-1 rounded-full bg-amber-500" /> Управление архивом
                                        </span>
                                        <button type="button" onClick={() => { setView(plan); setSendMode(false); setSelected([]) }} className={`${HERO_BTN} bg-emerald-600 hover:bg-emerald-700`}>
                                            <RefreshCw size={14} /> Вернуться
                                        </button>
                                        <button type="button" onClick={() => setArchiveOpen(true)} className={`${HERO_BTN} bg-slate-500 hover:bg-slate-600`}>
                                            <Calendar size={14} /> Сменить
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {canEditData && (
                                            <>
                                                <button type="button" onClick={() => setForm({ event: null })} className={`${HERO_BTN} bg-emerald-600 hover:bg-emerald-700`}>
                                                    <Plus size={14} /> Мероприятие
                                                </button>
                                                <button type="button" onClick={() => setNoEventsOpen(true)} className={`${HERO_BTN} bg-amber-600 hover:bg-amber-700`}>
                                                    <Ban size={14} /> Нет мероприятий
                                                </button>
                                            </>
                                        )}
                                        <button type="button" onClick={() => setArchiveOpen(true)} className={`${HERO_BTN} bg-slate-500 hover:bg-slate-600`}>
                                            <Calendar size={14} /> Архив
                                        </button>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSendMode(!sendMode)}
                                                className={`${HERO_BTN} ${sendMode ? 'bg-sky-600 hover:bg-sky-700' : 'bg-white/15 hover:bg-white/25'}`}
                                            >
                                                <Send size={14} /> {sendMode ? 'Отмена рассылки' : 'Напомнить'}
                                            </button>
                                        )}
                                        {sendMode && (
                                            <button
                                                type="button"
                                                disabled={!selected.length}
                                                onClick={() => setSendOpen(true)}
                                                className={`${HERO_BTN} bg-sky-600 hover:bg-sky-700`}
                                            >
                                                Отправить ({selected.length})
                                            </button>
                                        )}
                                    </>
                                )}
                                <span className="mx-1 hidden h-5 w-px bg-white/20 sm:block" />
                                <button type="button" onClick={() => notify('В демо файл не формируется')} className={`${HERO_BTN} bg-emerald-700 hover:bg-emerald-800`}>
                                    <FileText size={14} /> Word
                                </button>
                                <button type="button" onClick={() => notify('В демо файл не формируется')} className={`${HERO_BTN} bg-red-600 hover:bg-red-700`}>
                                    <File size={14} /> PDF
                                </button>
                            </div>

                            {/* демо-настройки: роль и приём данных */}
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                                    <ShieldCheck size={13} /> Демо: роль
                                </span>
                                <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                                    {ROLES.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => { setRole(r.id); if (r.id !== 'admin') toggleSendMode(false) }}
                                            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${role === r.id ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                                {role === 'input' && <span className="text-xs text-white/60">ИОГВ: {authorityName(MY_AUTHORITY_ID)}</span>}
                                {isAdmin && !isArchive && (
                                    <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-white/80">
                                        <input type="checkbox" checked={acceptOpen} onChange={e => { setAcceptOpen(e.target.checked); if (!e.target.checked) toggleSendMode(false) }} className="h-4 w-4 accent-emerald-500" />
                                        Приём данных открыт
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Основная сетка ── */}
                <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <div className="mb-3 flex gap-1 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-1">
                            {TYPE_TABS.map(t => {
                                const Icon = TAB_ICONS[t.id]
                                const count = AUTHORITIES.filter(a => a.type === t.id).length
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setTab(t.id)}
                                        className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                            tab === t.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Icon size={14} /> {t.name}
                                        <span className="rounded-full bg-foreground/10 px-1.5 text-[10px]">{count}</span>
                                    </button>
                                )
                            })}
                        </div>

                        <div className="card-block overflow-hidden rounded-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border bg-foreground/5 text-[10px] uppercase tracking-wider text-muted-foreground">
                                            <th className="px-4 py-3 text-left font-semibold">ИОГВ</th>
                                            <th className="px-3 py-3 text-center font-semibold">Статус</th>
                                            <th className="px-3 py-3 text-center font-semibold">Создано</th>
                                            <th className="px-3 py-3 text-center font-semibold">Изменено</th>
                                            <th className="px-3 py-3 text-center font-semibold">Мероприятий</th>
                                            <th className="px-3 py-3 text-center font-semibold">Ответственные</th>
                                            {sendMode && !isArchive && (
                                                <th className="px-3 py-3 text-center font-semibold">
                                                    <button type="button" onClick={selectAllInTab} title="Выбрать всех незаполненных во вкладке" className="mx-auto flex flex-col items-center gap-0.5">
                                                        <CheckSquare size={14} />
                                                        <span className="text-[9px] normal-case">{emptyInTab.length} не заполн.</span>
                                                    </button>
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {tabAuthorities.map(a => {
                                            const st = statusMap.get(a.id)
                                            const resp = RESPONSIBLES.filter(r => r.authorityId === a.id)
                                            return (
                                                <tr key={a.id} className="transition-colors odd:bg-foreground/[0.02] hover:bg-foreground/5">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white ${st?.noEvent ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-[#1a234f]'}`}>
                                                                {st?.noEvent ? <Ban size={14} /> : initials(a.name)}
                                                            </span>
                                                            <span className={`font-medium ${st ? '' : 'text-muted-foreground'}`}>{a.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {st ? (
                                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                                                <CheckCircle size={13} /> Заполнено
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                                                                <AlertTriangle size={13} /> Не заполнено
                                                            </span>
                                                        )}
                                                    </td>
                                                    {[st?.created, st?.edited].map((iso, i) => (
                                                        <td key={i} className="px-3 py-3 text-center">
                                                            {iso ? (
                                                                <div className="whitespace-nowrap text-[11px]">
                                                                    <div className="font-medium">{formatDay(iso)}</div>
                                                                    <div className="text-[10px] text-muted-foreground">{formatTime(iso)}</div>
                                                                </div>
                                                            ) : <span className="text-muted-foreground">—</span>}
                                                        </td>
                                                    ))}
                                                    <td className="px-3 py-3 text-center">
                                                        {st?.noEvent ? (
                                                            <button type="button" onClick={() => setAuthorityModal(a)} title="Открыть отметку" className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-medium text-amber-600 transition-colors hover:bg-amber-500/25 dark:text-amber-400">
                                                                <Ban size={13} /> Нет
                                                            </button>
                                                        ) : st ? (
                                                            <button type="button" onClick={() => setAuthorityModal(a)} title="Показать мероприятия" className="inline-block min-w-[40px] rounded-lg border border-border bg-foreground/5 px-3 py-1 text-lg font-bold transition-colors hover:bg-foreground/10">
                                                                {st.count}
                                                            </button>
                                                        ) : <span className="text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        {resp.length ? (
                                                            <button type="button" onClick={() => setResponsibleModal(a)} className="inline-flex items-center gap-2">
                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1">
                                                                    <Users size={13} className="text-emerald-500" />
                                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{resp.length}</span>
                                                                    <span className="text-[10px] text-emerald-500/70">чел.</span>
                                                                </span>
                                                                <span className="hidden -space-x-1 sm:flex">
                                                                    {resp.slice(0, 2).map(r => (
                                                                        <span key={r.id} title={r.name} className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-[#1a234f] to-[#29387d] text-[8px] font-medium text-white">
                                                                            {initials(r.name)}
                                                                        </span>
                                                                    ))}
                                                                </span>
                                                            </button>
                                                        ) : <span className="text-muted-foreground">—</span>}
                                                    </td>
                                                    {sendMode && !isArchive && (
                                                        <td className="px-3 py-3 text-center">
                                                            {st ? <span className="text-muted-foreground">✓</span> : (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selected.includes(a.id)}
                                                                    onChange={() => setSelected(s => (s.includes(a.id) ? s.filter(id => id !== a.id) : [...s, a.id]))}
                                                                    className="h-4 w-4 cursor-pointer accent-sky-500"
                                                                />
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* ── Список мероприятий месяца ── */}
                    <div className="card-block h-fit rounded-2xl p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="flex items-center gap-2 whitespace-nowrap font-semibold">
                                <Activity size={16} />
                                <span>
                                    Мероприятия на <span className="text-emerald-600 dark:text-emerald-400">{MONTH_NAMES[view.month - 1]}</span>
                                    {' '}({visibleEvents.length + visibleNoEvents.length})
                                </span>
                            </h2>
                            <div className="relative">
                                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    className={`${FIELD} !w-36 !py-1.5 !pl-8 !pr-7 sm:!w-40`}
                                    placeholder="Поиск..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button type="button" aria-label="Сбросить поиск" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
                            {visibleEvents.length + visibleNoEvents.length === 0 && (
                                <div className="px-4 py-12 text-center">
                                    <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5"><Calendar size={26} className="text-muted-foreground" /></span>
                                    <p className="text-sm font-medium">{q ? 'Ничего не найдено' : 'Нет мероприятий за выбранный период'}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{q ? `По запросу «${search}» ничего нет` : `План на ${monthLabel(view)} пока пуст`}</p>
                                </div>
                            )}

                            {visibleEvents.map(e => (
                                <button
                                    key={e.id}
                                    type="button"
                                    onClick={() => setDetails(e)}
                                    className="group relative block w-full rounded-xl border border-border bg-foreground/5 p-4 pl-5 text-left transition-all hover:-translate-y-0.5 hover:bg-foreground/10 hover:shadow-md"
                                >
                                    <span className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-[#c9a66b]/60 transition-colors group-hover:bg-[#c9a66b]" />
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1.5 text-sm font-semibold leading-tight">{e.title}</p>
                                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar size={13} className="opacity-70" />
                                                    <span className="font-medium text-foreground">{formatYmd(e.dateFrom)}{e.dateTo && e.dateTo !== e.dateFrom ? ` — ${formatYmd(e.dateTo)}` : ''}</span>
                                                </span>
                                                <span className="flex items-center gap-1.5"><Building2 size={13} className="opacity-70" /><span className="text-foreground">{authorityName(e.authorityId)}</span></span>
                                            </p>
                                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                {(e.timeFrom || e.timeTo) && (
                                                    <span className="flex items-center gap-1.5"><Clock size={13} className="opacity-70" /><span className="text-foreground">{e.timeFrom && e.timeTo ? `${e.timeFrom} — ${e.timeTo}` : e.timeFrom || e.timeTo}</span></span>
                                                )}
                                                <span className="flex items-center gap-1.5"><Building size={13} className="opacity-70" /><span className="text-foreground">{e.place}</span></span>
                                                {e.address && <span className="flex items-center gap-1.5"><MapPin size={13} className="opacity-70" /><span className="text-foreground">{e.address}</span></span>}
                                            </p>
                                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <UserCheck size={13} className="opacity-70" /> Ответственный: <span className="font-medium text-foreground">{e.responsible}</span>
                                            </p>
                                            {e.description && <p className="mt-1.5 line-clamp-2 text-[11px] text-muted-foreground">{e.description}</p>}
                                        </div>
                                        <span className="whitespace-nowrap text-xs font-medium text-muted-foreground transition-colors group-hover:text-[#c9a66b]">Подробнее →</span>
                                    </div>
                                </button>
                            ))}

                            {visibleNoEvents.map(n => (
                                <div key={`no-${n.authorityId}`} className="relative rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 pl-5">
                                    <span className="absolute bottom-0 left-0 top-0 w-1 rounded-l-xl bg-amber-500/50" />
                                    <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                                        <Ban size={12} /> Нет мероприятий
                                    </span>
                                    <p className="flex items-center gap-1.5 text-xs"><Building2 size={13} className="opacity-70" /> {authorityName(n.authorityId)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">{ORG_NAME} · демо-данные вымышлены, изменения хранятся только на этой странице</p>
            </div>

            {/* ── Модалки ── */}
            {form && (
                <EventFormModal
                    event={form.event}
                    plan={plan}
                    authorities={availableAuthorities}
                    blockedIds={noEventIds}
                    onSave={saveEvent}
                    onDelete={form.event ? deleteEvent : undefined}
                    onClose={() => setForm(null)}
                />
            )}
            {noEventsOpen && (
                <NoEventsModal
                    plan={plan}
                    authorities={availableAuthorities}
                    unavailableIds={filledIds}
                    onSave={saveNoEvents}
                    onClose={() => setNoEventsOpen(false)}
                />
            )}
            {archiveOpen && (
                <ArchiveModal
                    plan={plan}
                    current={view}
                    onApply={ref => { setView(ref); setSendMode(false); setSelected([]) }}
                    onClose={() => setArchiveOpen(false)}
                />
            )}
            {statsOpen && <StatisticsModal plan={plan} view={view} events={events} noEventIds={noEventIds} onClose={() => setStatsOpen(false)} />}
            {sendOpen && (
                <SendModal
                    authorities={AUTHORITIES.filter(a => selected.includes(a.id))}
                    onSend={sendNotifications}
                    onClose={() => setSendOpen(false)}
                />
            )}
            {authorityModal && (
                <AuthorityEventsModal
                    authority={authorityModal}
                    events={authorityEvents}
                    noEventAt={authorityNoEvent}
                    canEdit={canEditAuthority(authorityModal.id)}
                    onEdit={e => { setAuthorityModal(null); setForm({ event: e }) }}
                    onOpen={e => { setAuthorityModal(null); setDetails(e) }}
                    onCancelNoEvent={() => cancelNoEvent(authorityModal.id)}
                    onClose={() => setAuthorityModal(null)}
                />
            )}
            {responsibleModal && <ResponsibleModal authority={responsibleModal} onClose={() => setResponsibleModal(null)} />}
            {details && (
                <EventDetailsModal
                    event={details}
                    canEdit={canEditAuthority(details.authorityId)}
                    onEdit={() => { setForm({ event: details }); setDetails(null) }}
                    onClose={() => setDetails(null)}
                />
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-2xl">
                    {toast}
                </div>
            )}
        </div>
    )
}
