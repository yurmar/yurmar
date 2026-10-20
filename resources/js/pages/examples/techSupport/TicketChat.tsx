import { useEffect, useRef, useState } from 'react'
import { Calendar, CalendarClock, Check, Folder, Landmark, Link as LinkIcon, Lock, MessageCircle, Phone, Play, Send, User, X } from 'lucide-react'
import { BTN, BTN_GHOST, BTN_ICON, FIELD, Sheet } from '../polls/ui'
import { STATUS_BADGE } from './ui'
import { formatDisplayDate, STATUS_IN_WORK, STATUS_NEW, ARCHIVE_STATUSES, STATUS_DONE, type Ticket } from './data'

interface Props {
    ticket: Ticket
    isSupport: boolean
    onClose: () => void
    onSend: (text: string) => void
    onTake: () => void
    onReject: () => void
    onComplete: () => void
    onRate: (rating: number) => void
}

export default function TicketChat({ ticket, isSupport, onClose, onSend, onTake, onReject, onComplete, onRate }: Props) {
    const [draft, setDraft] = useState('')
    const [rating, setRating] = useState(5)
    const endRef = useRef<HTMLDivElement>(null)

    const badge = STATUS_BADGE[ticket.statusId]
    const isArchived = ARCHIVE_STATUSES.includes(ticket.statusId)
    const canChat = ticket.statusId === STATUS_IN_WORK
    const needsRating = !isSupport && ticket.statusId === STATUS_DONE && ticket.rating === 0

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [ticket.messages.length])

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const text = draft.trim()
        if (!text) return
        onSend(text)
        setDraft('')
    }

    return (
        <Sheet
            onClose={onClose}
            title={
                <div>
                    <h2 className="break-words text-lg font-bold leading-snug">{ticket.name}</h2>
                    <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
                </div>
            }
            footer={
                canChat ? (
                    <form onSubmit={submit} className="flex w-full items-end gap-2">
                        <textarea
                            rows={2}
                            className={`${FIELD} flex-1 resize-none`}
                            placeholder="Напишите сообщение..."
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e) }
                            }}
                        />
                        <button type="submit" disabled={!draft.trim()} className={`${BTN_ICON} !h-11 !w-11`} aria-label="Отправить">
                            <Send size={16} />
                        </button>
                    </form>
                ) : (
                    <div className="flex w-full items-center justify-center gap-2 py-1 text-center text-sm text-muted-foreground">
                        {isArchived ? <Lock size={16} className="flex-shrink-0" /> : <MessageCircle size={16} className="flex-shrink-0" />}
                        {isArchived ? 'Заявка закрыта, переписка недоступна' : 'Переписка откроется после взятия заявки в работу'}
                    </div>
                )
            }
        >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Folder size={14} />{ticket.section}</span>
                <span className="flex items-center gap-1"><Calendar size={14} />{formatDisplayDate(ticket.createdAt)}</span>
                {ticket.deadline && <span className="flex items-center gap-1"><CalendarClock size={14} />до {formatDisplayDate(ticket.deadline)}</span>}
                {ticket.link && (
                    <a href={ticket.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-500 hover:underline dark:text-sky-400">
                        <LinkIcon size={14} />Ссылка
                    </a>
                )}
            </div>

            {isSupport && (
                <div className="card-block mt-3 rounded-xl p-3.5">
                    <div className="mb-2 text-xs font-semibold text-sky-500 dark:text-sky-400">Заявитель</div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground"><User size={14} />{ticket.applicant}</span>
                        <span className="flex items-center gap-1"><Phone size={14} />{ticket.applicantPhone}</span>
                        <span className="flex items-center gap-1"><Landmark size={14} />{ticket.applicantOrg}</span>
                    </div>
                </div>
            )}

            {isSupport && ticket.statusId === STATUS_NEW && (
                <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" className={BTN} onClick={onTake}><Play size={15} /> Взять в работу</button>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/20" onClick={onReject}>
                        <X size={15} /> Отказать
                    </button>
                </div>
            )}
            {isSupport && ticket.statusId === STATUS_IN_WORK && (
                <div className="mt-4">
                    <button type="button" className={BTN} onClick={onComplete}><Check size={15} /> Завершить заявку</button>
                </div>
            )}

            <div className="mt-4 space-y-3">
                <div className="card-block max-w-[85%] rounded-xl p-3.5">
                    <div className="mb-1 text-xs font-semibold text-sky-500 dark:text-sky-400">{ticket.applicant} · описание проблемы</div>
                    <p className="text-sm leading-relaxed">{ticket.description}</p>
                </div>

                {ticket.messages.map(m => {
                    const mine = m.isSupport === isSupport
                    return (
                        <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-[85%] sm:max-w-[75%]">
                                {m.isSupport && (
                                    <div className={`mb-1 px-1 text-xs text-muted-foreground ${mine ? 'text-right' : ''}`}>{m.sender}</div>
                                )}
                                <div
                                    className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                        mine ? 'rounded-br-sm bg-sky-600 text-white' : 'rounded-bl-sm border border-border bg-foreground/5'
                                    }`}
                                >
                                    {m.text}
                                </div>
                                <div className={`mt-1 px-1 text-[10px] text-muted-foreground ${mine ? 'text-right' : ''}`}>{formatDisplayDate(m.createdAt)}</div>
                            </div>
                        </div>
                    )
                })}
                <div ref={endRef} />
            </div>

            {needsRating && (
                <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-center text-sm font-medium">Заявка выполнена. Оцените, пожалуйста, работу поддержки:</p>
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setRating(s)}
                                    aria-label={`Оценка ${s}`}
                                    className={`text-3xl leading-none transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-muted-foreground/40'}`}
                                >★</button>
                            ))}
                        </div>
                        <button type="button" className={BTN_GHOST} onClick={() => onRate(rating)}>Оценить</button>
                    </div>
                </div>
            )}
        </Sheet>
    )
}
