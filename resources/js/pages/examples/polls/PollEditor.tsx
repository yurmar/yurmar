import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { shiftDays, type Poll, type PollDraft } from './data'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, FIELD, Sheet } from './ui'

interface DraftOption {
    key: number
    id?: number
    text: string
}

const LABEL = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground'

/** Конструктор опроса: вопрос, варианты, «Другое», срок проведения */
export default function PollEditor({ poll, onClose, onSave }: {
    poll: Poll | null // null — создание
    onClose: () => void
    onSave: (draft: PollDraft) => void
}) {
    const [question, setQuestion] = useState(poll?.question ?? '')
    const [description, setDescription] = useState(poll?.description ?? '')
    const [startDate, setStartDate] = useState(poll?.startDate ?? shiftDays(0))
    const [endDate, setEndDate] = useState(poll?.endDate ?? shiftDays(7))
    const [allowOther, setAllowOther] = useState(poll?.allowOther ?? true)
    const [options, setOptions] = useState<DraftOption[]>(
        poll ? poll.options.map((o, i) => ({ key: i, id: o.id, text: o.text })) : [{ key: 0, text: '' }, { key: 1, text: '' }],
    )
    const [error, setError] = useState('')

    const setOptionText = (key: number, text: string) => setOptions(l => l.map(o => (o.key === key ? { ...o, text } : o)))
    const addOption = () => setOptions(l => [...l, { key: Math.max(-1, ...l.map(o => o.key)) + 1, text: '' }])
    const removeOption = (key: number) => setOptions(l => l.filter(o => o.key !== key))

    const submit = () => {
        const filled = options.filter(o => o.text.trim() !== '')
        if (!question.trim()) return setError('Укажите вопрос')
        if (!startDate || !endDate) return setError('Укажите срок проведения')
        if (endDate < startDate) return setError('Дата окончания раньше даты начала')
        if (filled.length < 2) return setError('Нужно минимум два варианта ответа')
        onSave({
            id: poll?.id,
            question: question.trim(),
            description: description.trim(),
            startDate,
            endDate,
            allowOther,
            options: filled.map(o => ({ id: o.id, text: o.text.trim() })),
        })
    }

    return (
        <Sheet
            title={<h3 className="text-xl font-bold">{poll ? 'Редактирование опроса' : 'Новый опрос'}</h3>}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className={BTN_GHOST}>Отмена</button>
                    <button type="button" onClick={submit} className={BTN}>{poll ? 'Сохранить' : 'Создать опрос'}</button>
                </>
            }
        >
            <div className="space-y-5">
                <label className="block">
                    <span className={LABEL}>Вопрос</span>
                    <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} maxLength={500}
                        placeholder="Например: Какой формат совещаний вам удобнее?" className={`${FIELD} resize-none`} />
                </label>
                <label className="block">
                    <span className={LABEL}>Пояснение (необязательно)</span>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                        placeholder="Короткий комментарий к вопросу" className={`${FIELD} resize-none`} />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="block">
                        <span className={LABEL}>Начало</span>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={FIELD} />
                    </label>
                    <label className="block">
                        <span className={LABEL}>Окончание (включительно)</span>
                        <input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} className={FIELD} />
                    </label>
                </div>

                <div>
                    <span className={LABEL}>Варианты ответа</span>
                    <div className="space-y-2">
                        {options.map((o, i) => (
                            <div key={o.key} className="flex items-center gap-2">
                                <input value={o.text} onChange={e => setOptionText(o.key, e.target.value)} maxLength={500}
                                    placeholder={`Вариант ${i + 1}`} className={FIELD} />
                                <button type="button" onClick={() => removeOption(o.key)} disabled={options.length <= 2}
                                    aria-label="Удалить вариант" title="Удалить вариант" className={BTN_DANGER_ICON}>
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addOption} className={`${BTN_GHOST} mt-3 !px-3 !py-1.5 text-xs`}>
                        <Plus size={13} /> Добавить вариант
                    </button>
                </div>

                <button type="button" role="switch" aria-checked={allowOther} onClick={() => setAllowOther(v => !v)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-foreground/5 px-4 py-3 text-left">
                    <span>
                        <span className="block text-sm font-medium">Вариант «Другое»</span>
                        <span className="block text-xs text-muted-foreground">Участник сможет написать свой ответ</span>
                    </span>
                    <span className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors ${allowOther ? 'border-sky-500 bg-sky-500/60' : 'border-border bg-foreground/10'}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${allowOther ? 'left-[22px]' : 'left-0.5'}`} />
                    </span>
                </button>

                {error && <p className="text-sm text-rose-500">{error}</p>}
            </div>
        </Sheet>
    )
}
