import { useState } from 'react'
import { CalendarClock, Check, CheckCircle2, Pencil, Trash2, Users } from 'lucide-react'
import { formatDate, percent, pollStatus, totalVotes, type Poll } from './data'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, BTN_ICON, CHIP, FIELD, STATUS_BADGE } from './ui'

const OTHER = -1 // служебный id строки «Другое» в форме голосования

function Results({ poll }: { poll: Poll }) {
    const total = totalVotes(poll)
    const rows = poll.options.map(o => ({ key: String(o.id), text: o.text, votes: o.votes, mine: poll.myOptionId === o.id }))
    if (poll.allowOther) rows.push({ key: 'other', text: 'Другое', votes: poll.otherVotes, mine: poll.hasVoted && poll.myOptionId === null })
    return (
        <div className="space-y-3">
            {rows.map(r => (
                <div key={r.key}>
                    <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-start gap-1.5">
                            {r.mine && <Check size={16} className="mt-0.5 flex-shrink-0 text-sky-500" />}
                            <span className={`break-words ${r.mine ? 'font-semibold' : ''}`}>{r.text}</span>
                        </span>
                        <span className="flex-shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {r.votes} · {percent(r.votes, total)}%
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent(r.votes, total)}%`, background: r.mine ? '#0ea5e9' : '#64748b' }}
                        />
                    </div>
                </div>
            ))}
            <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                <Users size={14} />
                Всего ответов: {total}
            </p>
        </div>
    )
}

export default function PollCard({ poll, isAdmin, onVote, onEdit, onDelete }: {
    poll: Poll
    isAdmin: boolean
    onVote: (pollId: number, optionId: number | null, otherText?: string) => void
    onEdit: () => void
    onDelete: () => void
}) {
    const [selected, setSelected] = useState<number | null>(null)
    const [otherText, setOtherText] = useState('')
    const [adminResults, setAdminResults] = useState(false)

    const status = pollStatus(poll)
    const badge = STATUS_BADGE[status]
    const canVote = status === 'active' && !poll.hasVoted
    // Результаты видны участнику после ответа, админу — всегда
    const showResults = poll.hasVoted || isAdmin
    const voting = canVote && !adminResults

    const pick = (id: number) => {
        if (!voting) return
        if (id === OTHER) setSelected(OTHER)
        else {
            setSelected(id)
            onVote(poll.id, id)
        }
    }

    const rows: { id: number; text: string }[] = poll.options.map(o => ({ id: o.id, text: o.text }))
    if (poll.allowOther) rows.push({ id: OTHER, text: 'Другое' })

    return (
        <article className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                    {poll.hasVoted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Вы ответили
                        </span>
                    )}
                    <span className={CHIP}>
                        <CalendarClock size={14} className="text-muted-foreground" />
                        {formatDate(poll.startDate)} — {formatDate(poll.endDate)}
                    </span>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <button type="button" onClick={onEdit} aria-label="Редактировать опрос" title="Редактировать" className={BTN_ICON}><Pencil size={15} /></button>
                        <button type="button" onClick={onDelete} aria-label="Удалить опрос" title="Удалить" className={BTN_DANGER_ICON}><Trash2 size={15} /></button>
                    </div>
                )}
            </div>

            <h3 className="mt-4 text-xl font-semibold leading-snug">{poll.question}</h3>
            {poll.description && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{poll.description}</p>}

            {status === 'upcoming' && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm">
                    <CalendarClock size={16} className="mt-0.5 flex-shrink-0 text-amber-500" />
                    Опрос ещё не начался. Принять участие можно будет с {formatDate(poll.startDate)}.
                </p>
            )}
            {status === 'finished' && !showResults && (
                <p className="mt-4 text-sm text-muted-foreground">Опрос завершён. Результаты доступны только участникам опроса.</p>
            )}

            <div className="mt-5">
                {showResults && !voting ? (
                    <Results poll={poll} />
                ) : (
                    <div className="space-y-2">
                        {rows.map(o => {
                            const active = selected === o.id
                            return (
                                <div key={o.id}>
                                    <button
                                        type="button"
                                        disabled={!canVote}
                                        onClick={() => pick(o.id)}
                                        role="radio"
                                        aria-checked={active}
                                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all enabled:hover:bg-foreground/10 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                                            active ? 'border-sky-500 bg-sky-500/10' : 'border-border bg-foreground/5'
                                        }`}
                                    >
                                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${active ? 'border-sky-500' : 'border-foreground/30'}`}>
                                            {active && <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />}
                                        </span>
                                        <span className="break-words">{o.text}</span>
                                    </button>
                                    {o.id === OTHER && active && canVote && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <input
                                                autoFocus
                                                value={otherText}
                                                onChange={e => setOtherText(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && otherText.trim() && onVote(poll.id, null, otherText.trim())}
                                                maxLength={500}
                                                placeholder="Напишите свой вариант"
                                                className={FIELD}
                                            />
                                            <button type="button" onClick={() => onVote(poll.id, null, otherText.trim())} disabled={!otherText.trim()} className={BTN}>
                                                Отправить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {canVote && isAdmin && (
                <div className="mt-auto pt-4">
                    <button type="button" onClick={() => setAdminResults(v => !v)} className={BTN_GHOST}>
                        {adminResults ? 'К голосованию' : 'Показать результаты'}
                    </button>
                </div>
            )}

            {isAdmin && poll.allowOther && poll.otherAnswers.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ответы «Другое»</p>
                    <ul className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                        {poll.otherAnswers.map((t, i) => (
                            <li key={i} className="break-words rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm">{t}</li>
                        ))}
                    </ul>
                </div>
            )}
        </article>
    )
}
