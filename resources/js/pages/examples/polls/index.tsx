import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, LayoutGrid, List, ListChecks, Plus, ShieldCheck, Users } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import {
    initialPolls, formatDate, makeId, pollStatus, totalVotes,
    type Poll, type PollDraft, type PollStatus,
} from './data'
import PollCard from './PollCard'
import PollEditor from './PollEditor'
import { BTN, CHIP, STATUS_BADGE, Sheet } from './ui'

type Filter = 'all' | PollStatus
type ViewMode = 'cards' | 'list'

const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Идут' },
    { id: 'upcoming', label: 'Скоро' },
    { id: 'finished', label: 'Завершены' },
]

const VIEW_MODE_KEY = 'pollsViewMode'

function getSavedViewMode(): ViewMode {
    try {
        return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'cards'
    } catch {
        return 'cards'
    }
}

/** Краткая карточка/строка опроса: сам опрос открывается в модалке по клику */
function PollSummary({ poll, mode, isAdmin, onOpen }: { poll: Poll; mode: ViewMode; isAdmin: boolean; onOpen: () => void }) {
    const badge = STATUS_BADGE[pollStatus(poll)]
    const badges = (
        <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
            {poll.hasVoted && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 size={12} /> Вы ответили
                </span>
            )}
        </div>
    )
    const meta = (
        <div className="flex flex-wrap items-center gap-2">
            <span className={CHIP}>
                <CalendarClock size={14} className="text-muted-foreground" />
                {formatDate(poll.startDate)} — {formatDate(poll.endDate)}
            </span>
            {(poll.hasVoted || isAdmin) && (
                <span className={CHIP}><Users size={14} className="text-muted-foreground" />{totalVotes(poll)}</span>
            )}
        </div>
    )

    const base = 'card-block rounded-2xl text-left transition-all hover:bg-foreground/5 active:scale-[0.995]'
    if (mode === 'list') {
        return (
            <button type="button" onClick={onOpen} className={`${base} flex w-full flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between`}>
                <h3 className="min-w-0 break-words text-lg font-semibold leading-snug md:flex-1">{poll.question}</h3>
                <div className="flex flex-col gap-2 md:items-end">{badges}{meta}</div>
            </button>
        )
    }
    return (
        <button type="button" onClick={onOpen} className={`${base} flex h-full w-full flex-col p-5`}>
            {badges}
            <h3 className="mt-4 break-words text-lg font-semibold leading-snug">{poll.question}</h3>
            <div className="mt-auto pt-4">{meta}</div>
        </button>
    )
}

export default function PollsExample() {
    const [polls, setPolls] = useState<Poll[]>(initialPolls)
    const [isAdmin, setIsAdmin] = useState(true)
    const [filter, setFilter] = useState<Filter>('all')
    const [mode, setModeState] = useState<ViewMode>(getSavedViewMode)
    const [openId, setOpenId] = useState<number | null>(null)
    const [editor, setEditor] = useState<{ poll: Poll | null } | null>(null)
    const [deleting, setDeleting] = useState<Poll | null>(null)

    const setMode = (m: ViewMode) => {
        setModeState(m)
        try { localStorage.setItem(VIEW_MODE_KEY, m) } catch { /* без localStorage — просто не запоминаем */ }
    }

    const counts = useMemo(() => {
        const c: Record<Filter, number> = { all: polls.length, active: 0, upcoming: 0, finished: 0 }
        polls.forEach(p => c[pollStatus(p)]++)
        return c
    }, [polls])

    const openPoll = polls.find(p => p.id === openId) ?? null
    const visible = filter === 'all' ? polls : polls.filter(p => pollStatus(p) === filter)

    const vote = (pollId: number, optionId: number | null, otherText?: string) => {
        setPolls(list => list.map(p => {
            if (p.id !== pollId || p.hasVoted) return p
            if (optionId === null) {
                return { ...p, hasVoted: true, myOptionId: null, otherVotes: p.otherVotes + 1, otherAnswers: [...p.otherAnswers, otherText ?? ''] }
            }
            return { ...p, hasVoted: true, myOptionId: optionId, options: p.options.map(o => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) }
        }))
    }

    const save = (d: PollDraft) => {
        setPolls(list => {
            if (d.id) {
                return list.map(p => {
                    if (p.id !== d.id) return p
                    const options = d.options.map(o => ({ id: o.id ?? makeId(), text: o.text, votes: p.options.find(x => x.id === o.id)?.votes ?? 0 }))
                    const myGone = p.myOptionId !== null && !options.some(o => o.id === p.myOptionId)
                    return {
                        ...p, question: d.question, description: d.description, startDate: d.startDate, endDate: d.endDate,
                        allowOther: d.allowOther, options,
                        otherVotes: d.allowOther ? p.otherVotes : 0,
                        otherAnswers: d.allowOther ? p.otherAnswers : [],
                        hasVoted: myGone || (!d.allowOther && p.hasVoted && p.myOptionId === null) ? false : p.hasVoted,
                        myOptionId: myGone ? null : p.myOptionId,
                    }
                })
            }
            const fresh: Poll = {
                id: makeId(), question: d.question, description: d.description, startDate: d.startDate, endDate: d.endDate,
                allowOther: d.allowOther, options: d.options.map(o => ({ id: makeId(), text: o.text, votes: 0 })),
                otherVotes: 0, otherAnswers: [], hasVoted: false, myOptionId: null,
            }
            return [fresh, ...list]
        })
        setEditor(null)
    }

    const confirmDelete = () => {
        if (!deleting) return
        setPolls(list => list.filter(p => p.id !== deleting.id))
        setOpenId(null)
        setDeleting(null)
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                        <ListChecks size={14} /> Мнение сотрудников
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Опросы</h1>
                    <div className="mt-4 h-px w-16 bg-sky-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Короткие опросы с одним вопросом. Ответить можно один раз, пока опрос идёт.
                    </p>
                    <p className="mt-3 text-xs text-white/40">Администрация Заречного муниципального округа · демо-данные вымышлены</p>
                </section>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-1">
                        {FILTERS.map(f => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => setFilter(f.id)}
                                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                                    filter === f.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {f.label} ({counts[f.id]})
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            role="switch"
                            aria-checked={isAdmin}
                            onClick={() => setIsAdmin(v => !v)}
                            title="Переключить вид: администратор / сотрудник"
                            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors ${
                                isAdmin ? 'border-amber-500/40 bg-amber-500/15 text-amber-500' : 'border-border bg-foreground/5 text-muted-foreground'
                            }`}
                        >
                            <ShieldCheck size={14} /> {isAdmin ? 'Администратор' : 'Сотрудник'}
                        </button>
                        <div className="flex items-center gap-0.5 rounded-xl border border-border bg-foreground/5 p-1">
                            {([['cards', 'Карточки', LayoutGrid], ['list', 'Списком', List]] as const).map(([id, label, Icon]) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setMode(id)}
                                    aria-label={label}
                                    aria-pressed={mode === id}
                                    title={label}
                                    className={`rounded-lg p-1.5 transition-colors ${mode === id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    <Icon size={15} />
                                </button>
                            ))}
                        </div>
                        {isAdmin && (
                            <button type="button" onClick={() => setEditor({ poll: null })} className={BTN}>
                                <Plus size={15} /> Создать опрос
                            </button>
                        )}
                    </div>
                </div>

                <section className="mt-6">
                    {visible.length === 0 ? (
                        <div className="card-block flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
                            <ListChecks size={22} className="text-sky-500" />
                            <p className="text-lg font-semibold">{polls.length === 0 ? 'Пока нет опросов' : 'Нет опросов в этой категории'}</p>
                            {polls.length === 0 && isAdmin && <p className="max-w-md text-sm text-muted-foreground">Нажмите «Создать опрос», чтобы запустить первый.</p>}
                        </div>
                    ) : (
                        <div className={mode === 'cards' ? 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
                            {visible.map(p => (
                                <PollSummary key={p.id} poll={p} mode={mode} isAdmin={isAdmin} onOpen={() => setOpenId(p.id)} />
                            ))}
                        </div>
                    )}
                </section>
            </div>

            {openPoll && (
                <Sheet
                    onClose={() => setOpenId(null)}
                    title={
                        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-500 dark:text-sky-400">
                            <ListChecks size={14} /> Опрос
                        </span>
                    }
                >
                    <PollCard
                        key={`${openPoll.id}-${isAdmin}`}
                        poll={openPoll}
                        isAdmin={isAdmin}
                        onVote={vote}
                        onEdit={() => { setOpenId(null); setEditor({ poll: openPoll }) }}
                        onDelete={() => setDeleting(openPoll)}
                    />
                </Sheet>
            )}

            {editor && <PollEditor poll={editor.poll} onClose={() => setEditor(null)} onSave={save} />}

            <ConfirmModal
                open={!!deleting}
                title="Удалить опрос?"
                message={deleting ? `«${deleting.question}» будет удалён вместе со всеми ответами участников.` : undefined}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </div>
    )
}
