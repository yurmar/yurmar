import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    AlertCircle, Archive, ArrowLeft, BarChart3, Calendar, CheckCircle, ChevronDown, ChevronLeft, ChevronRight,
    Clock, Clock8, Folder, Headphones, Inbox, List, Landmark, MessageCircle, Play, Plus, ShieldCheck, Smile,
    Star, Ticket as TicketIcon, Timer, Trophy, User, Users, X, Zap,
} from 'lucide-react'
import { BTN, BTN_GHOST, BTN_ICON, CHIP, FIELD, Sheet } from '../polls/ui'
import {
    ACTIVE_STATUSES, ARCHIVE_STATUSES, ME_APPLICANT, ME_ORG, SECTIONS, STATUS_DONE, STATUS_IN_WORK, STATUS_NEW,
    STATUS_REJECTED, SUPPORT_USER, completeMinutes, formatDisplayDate, formatDuration, initialTickets, nextId,
    parseDate, takeMinutes, type Ticket,
} from './data'
import { STATUS_BADGE } from './ui'
import TicketChat from './TicketChat'

type Tab = 'active' | 'archive'

const PAGE_SIZE = 6
const TAB_FILTERS: Record<Tab, { id: string; label: string; status?: number }[]> = {
    active: [{ id: 'all', label: 'Все' }, { id: 'new', label: 'Новые', status: STATUS_NEW }, { id: 'work', label: 'В работе', status: STATUS_IN_WORK }],
    archive: [{ id: 'all', label: 'Все' }, { id: 'done', label: 'Выполнено', status: STATUS_DONE }, { id: 'rejected', label: 'Отклонено', status: STATUS_REJECTED }],
}

const average = (values: (number | null)[]) => {
    const v = values.filter((x): x is number => x !== null)
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
}

const nowIso = () => new Date().toISOString()

function isWorkingNow() {
    const d = new Date()
    return d.getDay() >= 1 && d.getDay() <= 5 && d.getHours() >= 9 && d.getHours() < 18
}

function nextWorkingTime() {
    const d = new Date()
    const day = d.getDay()
    if (day >= 1 && day <= 5 && d.getHours() < 9) return 'сегодня в 09:00'
    if (day >= 1 && day <= 5) return 'завтра в 09:00'
    return 'понедельник в 09:00'
}

const emptyForm = { name: '', section: '', link: '', description: '' }

export default function TechSupportExample() {
    const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
    const [isSupport, setIsSupport] = useState(true)
    const [tab, setTab] = useState<Tab>('active')
    const [filter, setFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [openId, setOpenId] = useState<number | null>(null)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [action, setAction] = useState<{ kind: 'complete' | 'reject'; id: number } | null>(null)
    const [actionText, setActionText] = useState('')
    const [execOpen, setExecOpen] = useState(false)
    const [statsOpen, setStatsOpen] = useState(false)

    // Пользователь видит только свои заявки, поддержка — все
    const scope = useMemo(
        () => (isSupport ? tickets : tickets.filter(t => t.applicant === ME_APPLICANT)),
        [tickets, isSupport],
    )

    const patch = (id: number, fn: (t: Ticket) => Ticket) => setTickets(list => list.map(t => (t.id === id ? fn(t) : t)))

    const stats = useMemo(() => {
        const rated = scope.filter(t => t.rating > 0)
        const done = scope.filter(t => t.statusId === STATUS_DONE).length
        return {
            total: scope.length,
            new: scope.filter(t => t.statusId === STATUS_NEW).length,
            inWork: scope.filter(t => t.statusId === STATUS_IN_WORK).length,
            done,
            rejected: scope.filter(t => t.statusId === STATUS_REJECTED).length,
            rate: scope.length ? Math.round((done / scope.length) * 100) : 0,
            avgRating: rated.length ? rated.reduce((a, t) => a + t.rating, 0) / rated.length : 0,
            avgTake: average(scope.map(takeMinutes)),
            avgComplete: average(scope.map(completeMinutes)),
        }
    }, [scope])

    const executors = useMemo(() => {
        const map = new Map<string, Ticket[]>()
        scope.forEach(t => { if (t.executor) map.set(t.executor, [...(map.get(t.executor) ?? []), t]) })
        return [...map.entries()]
            .map(([name, list]) => {
                const rated = list.filter(t => t.rating > 0)
                return {
                    name,
                    total: list.length,
                    done: list.filter(t => t.statusId === STATUS_DONE).length,
                    ratings: rated.length,
                    avgRating: rated.length ? rated.reduce((a, t) => a + t.rating, 0) / rated.length : 0,
                    avgTake: average(list.map(takeMinutes)),
                    avgComplete: average(list.map(completeMinutes)),
                }
            })
            .sort((a, b) => b.done - a.done)
    }, [scope])

    const statuses = tab === 'active' ? ACTIVE_STATUSES : ARCHIVE_STATUSES
    const activeCount = scope.filter(t => ACTIVE_STATUSES.includes(t.statusId)).length
    const archiveCount = scope.filter(t => ARCHIVE_STATUSES.includes(t.statusId)).length
    const filterStatus = TAB_FILTERS[tab].find(f => f.id === filter)?.status
    const visible = scope
        .filter(t => statuses.includes(t.statusId) && (filterStatus === undefined || t.statusId === filterStatus))
        .sort((a, b) => (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0))
    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
    const pageItems = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const openTicket = tickets.find(t => t.id === openId) ?? null
    const actionTicket = action ? tickets.find(t => t.id === action.id) ?? null : null
    const working = isWorkingNow()

    const changeTab = (t: Tab) => { setTab(t); setFilter('all'); setPage(1) }

    const send = (id: number, text: string) =>
        patch(id, t => ({
            ...t,
            messages: [...t.messages, {
                id: nextId(), isSupport, sender: isSupport ? SUPPORT_USER : ME_APPLICANT, text, createdAt: nowIso(),
            }],
        }))

    const take = (id: number) =>
        patch(id, t => ({
            ...t, statusId: STATUS_IN_WORK, executor: SUPPORT_USER, takenAt: nowIso(),
            messages: [...t.messages, { id: nextId(), isSupport: true, sender: SUPPORT_USER, text: 'Заявка взята в работу.', createdAt: nowIso() }],
        }))

    const confirmAction = () => {
        if (!action) return
        const text = actionText.trim()
        patch(action.id, t => ({
            ...t,
            statusId: action.kind === 'complete' ? STATUS_DONE : STATUS_REJECTED,
            executor: t.executor || SUPPORT_USER,
            finishedAt: nowIso(),
            messages: text
                ? [...t.messages, { id: nextId(), isSupport: true, sender: SUPPORT_USER, text, createdAt: nowIso() }]
                : t.messages,
        }))
        setAction(null)
        setActionText('')
    }

    const closeForm = () => { setCreating(false); setForm(emptyForm); setErrors({}) }

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const err: Record<string, string> = {}
        if (!form.name.trim()) err.name = 'Введите название задачи'
        if (!form.section) err.section = 'Выберите раздел'
        if (!form.description.trim()) err.description = 'Опишите проблему'
        setErrors(err)
        if (Object.keys(err).length) return
        setTickets(list => [{
            id: nextId(), name: form.name.trim(), description: form.description.trim(), section: form.section,
            statusId: STATUS_NEW, link: form.link.trim(), deadline: null, applicant: ME_APPLICANT, applicantOrg: ME_ORG,
            applicantPhone: '+7 (3952) 25-10-85', executor: '', rating: 0, createdAt: nowIso(), takenAt: null,
            finishedAt: null, unread: 0, messages: [],
        }, ...list])
        closeForm()
        changeTab('active')
    }

    const statTiles = [
        { icon: List, color: 'text-sky-500', value: stats.total, label: 'Всего заявок' },
        { icon: AlertCircle, color: 'text-rose-500', value: stats.new, label: 'Новых' },
        { icon: Play, color: 'text-amber-500', value: stats.inWork, label: 'В работе' },
        { icon: CheckCircle, color: 'text-emerald-500', value: stats.done, label: 'Выполнено' },
        { icon: X, color: 'text-muted-foreground', value: stats.rejected, label: 'Отклонено' },
        { icon: Star, color: 'text-amber-400', value: stats.avgRating.toFixed(1), label: 'Ср. оценка' },
    ]

    const statRows = [
        { icon: CheckCircle, color: 'text-emerald-500', label: 'Процент выполнения', value: `${stats.rate}%` },
        { icon: Star, color: 'text-amber-400', label: 'Средняя оценка', value: `${stats.avgRating.toFixed(1)}/5` },
        ...(isSupport ? [{ icon: Users, color: 'text-violet-500', label: 'Активных исполнителей', value: String(executors.length) }] : []),
        { icon: Clock, color: 'text-sky-500', label: 'Ср. время взятия', value: formatDuration(stats.avgTake) },
        { icon: Timer, color: 'text-emerald-500', label: 'Ср. время выполнения', value: formatDuration(stats.avgComplete) },
    ]

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}
                >
                    <div className="flex items-start justify-between gap-3 sm:gap-6">
                        <div className="min-w-0 flex-1">
                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                                <TicketIcon size={14} /> Заявки и переписка
                            </span>
                            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Техническая поддержка</h1>
                            <div className="mt-4 h-px w-16 bg-sky-400" />
                            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                                Заявки и переписка с {isSupport ? 'пользователями' : 'поддержкой'} портала
                            </p>
                        </div>
                        <button type="button" title="Новая заявка" aria-label="Новая заявка" className={`${BTN} flex-shrink-0 !px-3 sm:!px-5`} onClick={() => setCreating(true)}>
                            <Plus size={16} /> <span className="hidden sm:inline">Новая заявка</span>
                        </button>
                    </div>

                    <div className="mt-5 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2 px-1 text-sm text-white/90">
                            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${working ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <Headphones size={16} className="flex-shrink-0 text-white/60" />
                            <span className="whitespace-nowrap">Поддержка: 09:00 - 18:00</span>
                            <span className="whitespace-nowrap text-xs text-white/60">(ПН-ПТ)</span>
                        </div>
                        {!working && (
                            <span className={`${CHIP} border-white/15 bg-white/10 text-white`}>
                                <Clock8 size={14} /> След. рабочий день: {nextWorkingTime()}
                            </span>
                        )}
                        <span className={`${CHIP} border-white/15 bg-white/10 text-sky-300`}>
                            <Zap size={14} /> Ср. время взятия: {formatDuration(stats.avgTake)}
                        </span>
                        <span className={`${CHIP} border-white/15 bg-white/10 text-sky-300`}>
                            <Timer size={14} /> Ср. время выполнения: {formatDuration(stats.avgComplete)}
                        </span>
                    </div>
                    <p className="mt-4 text-xs text-white/40">Администрация Заречного муниципального округа · демо-данные вымышлены</p>
                </section>

                <div className="mt-6 flex justify-end">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={isSupport}
                        onClick={() => { setIsSupport(v => !v); changeTab('active') }}
                        title="Переключить вид: поддержка / пользователь"
                        className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                            isSupport ? 'border-amber-500/40 bg-amber-500/15 text-amber-500' : 'border-border bg-foreground/5 text-muted-foreground'
                        }`}
                    >
                        <ShieldCheck size={14} /> {isSupport ? 'Поддержка' : 'Пользователь'}
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {statTiles.map(({ icon: Icon, color, value, label }) => (
                        <div key={label} className="card-block flex items-center gap-3.5 rounded-2xl p-4">
                            <Icon size={28} className={color} />
                            <div>
                                <div className="text-xl font-bold">{value}</div>
                                <div className="text-xs text-muted-foreground">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
                    <div className="card-block rounded-2xl p-5 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                                <List size={20} className="text-sky-500" />
                                <h2 className="text-lg font-semibold">Список заявок</h2>
                            </div>
                            <div className="flex gap-1 rounded-xl border border-border bg-foreground/5 p-1">
                                {([['active', 'Активные', Inbox, activeCount], ['archive', 'Архив', Archive, archiveCount]] as const).map(([id, label, Icon, count]) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => changeTab(id)}
                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                            tab === id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Icon size={14} /> {label} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-1">
                            {TAB_FILTERS[tab].map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => { setFilter(f.id); setPage(1) }}
                                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        filter === f.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {visible.length === 0 ? (
                            <div className="py-16 text-center">
                                <Smile size={44} className="mx-auto mb-4 text-sky-500" />
                                <h3 className="mb-2 text-lg font-semibold">{tab === 'archive' ? 'Архив пуст' : 'Нет заявок'}</h3>
                                <p className="text-sm text-muted-foreground">Попробуйте изменить параметры фильтрации</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2.5">
                                    {pageItems.map(t => {
                                        const badge = STATUS_BADGE[t.statusId]
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setOpenId(t.id)}
                                                className="flex flex-col gap-1.5 rounded-xl border border-border bg-foreground/5 px-4 py-2.5 text-left transition-colors hover:bg-foreground/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                                                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{t.name}</h3>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1"><Folder size={14} />{t.section}</span>
                                                    <span className="flex items-center gap-1"><User size={14} />{t.applicant.split(' ').slice(0, 2).join(' ')}</span>
                                                    {isSupport && <span className="flex items-center gap-1"><Landmark size={14} />{t.applicantOrg}</span>}
                                                    <span className="flex items-center gap-1"><Calendar size={14} />{formatDisplayDate(t.createdAt, false)}</span>
                                                    {t.rating > 0 && (
                                                        <span className="flex items-center gap-0.5">
                                                            {[0, 1, 2, 3, 4].map(i => (
                                                                <Star key={i} size={12} className={i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'} />
                                                            ))}
                                                        </span>
                                                    )}
                                                    {t.executor && <span className={CHIP}><User size={12} />{t.executor.split(' ').slice(0, 2).join(' ')}</span>}
                                                    <span className="ml-auto flex items-center gap-1 text-sky-500 dark:text-sky-400">
                                                        <MessageCircle size={14} />
                                                        <span className="hidden sm:inline">Переписка</span>
                                                        {t.unread > 0 && (
                                                            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{t.unread}</span>
                                                        )}
                                                        <ChevronRight size={12} />
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>

                                {totalPages > 1 && (
                                    <div className="mt-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                        <span>Заявок: {visible.length}</span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" className={BTN_ICON} disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Назад"><ChevronLeft size={16} /></button>
                                            <span>{page} / {totalPages}</span>
                                            <button type="button" className={BTN_ICON} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Вперёд"><ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-6">
                        {isSupport && (
                            <div className="card-block rounded-2xl p-5">
                                <button type="button" onClick={() => setExecOpen(v => !v)} className="mb-4 flex w-full items-center gap-2 border-b border-border pb-2 xl:pointer-events-none">
                                    <Trophy size={16} className="text-sky-500" />
                                    <h3 className="flex-1 text-left text-base font-semibold">Статистика исполнителей</h3>
                                    <ChevronDown size={16} className={`text-muted-foreground transition-transform xl:hidden ${execOpen ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`${execOpen ? 'flex' : 'hidden'} max-h-[500px] flex-col gap-3 overflow-y-auto xl:flex`}>
                                    {executors.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <Users size={44} className="mx-auto mb-3 text-sky-500" />
                                            <p className="text-sm text-muted-foreground">Нет данных об исполнителях</p>
                                        </div>
                                    ) : executors.map((ex, i) => (
                                        <div key={ex.name} className="flex items-start gap-3 rounded-xl border border-border bg-foreground/5 p-3">
                                            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white ${
                                                i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-slate-700'
                                            }`}>{i + 1}</div>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-1 text-sm font-semibold">{ex.name}</div>
                                                <div className="mb-2 flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Выполнено задач:</span>
                                                    <span className="font-medium"><span className="text-emerald-500">{ex.done}</span><span className="text-muted-foreground">/{ex.total}</span></span>
                                                </div>
                                                <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
                                                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${(ex.done / ex.total) * 100}%` }} />
                                                </div>
                                                <div className="mb-2 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" />{ex.avgRating.toFixed(1)}</span>
                                                    <span className="text-muted-foreground">{ex.ratings} оценок</span>
                                                </div>
                                                <div className="mb-1 flex items-center gap-1 text-xs"><Clock size={12} className="text-sky-500" />Ср. взятие: <span className="font-medium text-sky-500">{formatDuration(ex.avgTake)}</span></div>
                                                <div className="flex items-center gap-1 text-xs"><Timer size={12} className="text-emerald-500" />Ср. выполнение: <span className="font-medium text-emerald-500">{formatDuration(ex.avgComplete)}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="card-block rounded-2xl p-5">
                            <button type="button" onClick={() => setStatsOpen(v => !v)} className="mb-4 flex w-full items-center gap-2 border-b border-border pb-2 xl:pointer-events-none">
                                <BarChart3 size={16} className="text-sky-500" />
                                <h3 className="flex-1 text-left text-base font-semibold">{isSupport ? 'Общая статистика' : 'Моя статистика'}</h3>
                                <ChevronDown size={16} className={`text-muted-foreground transition-transform xl:hidden ${statsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            <div className={`${statsOpen ? 'block' : 'hidden'} space-y-2 xl:block`}>
                                {statRows.map(({ icon: Icon, color, label, value }) => (
                                    <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-foreground/5 px-3 py-2.5">
                                        <span className="flex min-w-0 items-center gap-2 text-xs"><Icon size={16} className={`flex-shrink-0 ${color}`} />{label}</span>
                                        <span className={`flex-shrink-0 text-right text-sm font-semibold ${color}`}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {openTicket && (
                <TicketChat
                    ticket={openTicket}
                    isSupport={isSupport}
                    onClose={() => setOpenId(null)}
                    onSend={text => send(openTicket.id, text)}
                    onTake={() => take(openTicket.id)}
                    onReject={() => { setAction({ kind: 'reject', id: openTicket.id }); setOpenId(null) }}
                    onComplete={() => { setAction({ kind: 'complete', id: openTicket.id }); setOpenId(null) }}
                    onRate={rating => patch(openTicket.id, t => ({ ...t, rating }))}
                />
            )}

            {creating && (
                <Sheet
                    onClose={closeForm}
                    title={<span className="inline-flex items-center gap-2 text-lg font-semibold"><TicketIcon size={20} className="text-sky-500" /> Создание заявки</span>}
                    footer={
                        <>
                            <button type="button" className={BTN_GHOST} onClick={closeForm}>Отмена</button>
                            <button type="submit" form="ticket-form" className={BTN}>Создать заявку</button>
                        </>
                    }
                >
                    <form id="ticket-form" onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Название задачи <span className="text-rose-500">*</span></label>
                            <input className={FIELD} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Кратко опишите проблему" />
                            {errors.name && <span className="mt-1 block text-xs text-rose-500">{errors.name}</span>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Раздел <span className="text-rose-500">*</span></label>
                            <select className={FIELD} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
                                <option value="">Выберите раздел</option>
                                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            {errors.section && <span className="mt-1 block text-xs text-rose-500">{errors.section}</span>}
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Ссылка</label>
                            <input className={FIELD} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Описание <span className="text-rose-500">*</span></label>
                            <textarea rows={4} className={FIELD} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Подробно опишите проблему..." />
                            {errors.description && <span className="mt-1 block text-xs text-rose-500">{errors.description}</span>}
                        </div>
                    </form>
                </Sheet>
            )}

            {action && actionTicket && (
                <Sheet
                    onClose={() => { setAction(null); setActionText('') }}
                    title={<span className="text-lg font-semibold">{action.kind === 'complete' ? 'Завершение задачи' : 'Отказ в выполнении'}</span>}
                    footer={
                        <>
                            <button type="button" className={BTN_GHOST} onClick={() => { setAction(null); setActionText('') }}>Отмена</button>
                            <button
                                type="button"
                                onClick={confirmAction}
                                className={action.kind === 'complete' ? BTN : 'inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/20'}
                            >
                                {action.kind === 'complete' ? 'Подтвердить' : 'Отказать'}
                            </button>
                        </>
                    }
                >
                    <p className="mb-4 text-sm text-muted-foreground">Задача: <strong className="text-foreground">{actionTicket.name}</strong></p>
                    <textarea
                        rows={4}
                        className={FIELD}
                        value={actionText}
                        onChange={e => setActionText(e.target.value)}
                        placeholder={action.kind === 'complete' ? 'Опишите, что было сделано (появится в переписке)...' : 'Укажите причину отказа (появится в переписке)...'}
                    />
                </Sheet>
            )}
        </div>
    )
}
