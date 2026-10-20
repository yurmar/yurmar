import { useState } from 'react'
import { Check, Hash, Link2, X } from 'lucide-react'
import { KIND_LABEL, addressLine, assignRegNumbers, daysAgo, fmtDate, fullName, platformName, type Candidate, type Link } from './data'
import { BTN, BTN_GHOST, CARD, Empty, Segmented, Section, type Ctx } from './ui'

const OPTIONS: { id: Link['confidence']; label: string }[] = [
    { id: 'auto', label: 'На подтверждение' },
    { id: 'confirmed', label: 'Подтверждённые' },
    { id: 'rejected', label: 'Отклонённые' },
]

function Cell({ label, value, differs }: { label: string; value: string; differs: boolean }) {
    return (
        <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className={`mt-0.5 text-sm ${differs ? 'rounded bg-amber-500/20 px-1 font-semibold' : ''}`}>{value || '—'}</div>
        </div>
    )
}

function Side({ ctx, c, other }: { ctx: Ctx; c: Candidate; other: Candidate }) {
    return (
        <div className="space-y-2 rounded-xl border border-border bg-foreground/5 p-3">
            <Cell label="ФИО" value={fullName(c)} differs={fullName(c) !== fullName(other)} />
            <Cell label="Дата рождения" value={fmtDate(c.birth)} differs={c.birth !== other.birth} />
            <Cell label="Площадка" value={`${platformName(ctx.db, c.platformId)} · ${KIND_LABEL[c.kind].toLowerCase()}`} differs={false} />
            <Cell label="Номер" value={`${c.areaNo}${c.regNo !== null ? ` · сквозной ${c.regNo}` : ''}`} differs={false} />
            <Cell label="Адрес" value={addressLine(c)} differs={addressLine(c) !== addressLine(other)} />
        </div>
    )
}

export default function LinksTab({ ctx }: { ctx: Ctx }) {
    const { db, setDb, notify } = ctx
    const [status, setStatus] = useState<Link['confidence']>('auto')
    const [result, setResult] = useState<number | null>(null)

    const items = db.links.filter(l => l.confidence === status)
    const set = (id: number, confidence: Link['confidence']) => setDb(d => ({ ...d, links: d.links.map(l => (l.id === id ? { ...l, confidence } : l)) }))

    const applyNumbers = () => {
        const r = assignRegNumbers(db, daysAgo(0))
        setDb(() => r.db)
        setResult(r.matched)
        notify(r.matched ? `Сквозные номера присвоены: ${r.matched}` : 'Все действующие кандидаты основного списка уже с номерами')
    }

    return (
        <div className="space-y-6">
            <Section title="Совпадения между списками площадок" hint="Один человек не должен числиться в списках двух площадок. Система находит такие пары автоматически — проверяющий подтверждает или отклоняет.">
                <Segmented<Link['confidence']> value={status} options={OPTIONS} onChange={setStatus} />
                <div className="mt-4 space-y-3">
                    {items.length === 0 ? (
                        <Empty icon={Link2} text="В этой группе пар нет" />
                    ) : items.map(l => {
                        const a = db.candidates.find(c => c.id === l.a)!
                        const b = db.candidates.find(c => c.id === l.b)!
                        return (
                            <div key={l.id} className="rounded-xl border border-border p-3">
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Side ctx={ctx} c={a} other={b} /><Side ctx={ctx} c={b} other={a} /></div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {l.confidence !== 'confirmed' && <button type="button" className={BTN_GHOST} onClick={() => set(l.id, 'confirmed')}><Check size={14} /> Это один человек</button>}
                                    {l.confidence !== 'rejected' && <button type="button" className={BTN_GHOST} onClick={() => set(l.id, 'rejected')}><X size={14} /> Разные люди</button>}
                                    {l.confidence !== 'auto' && <button type="button" className="text-xs text-sky-500 hover:underline dark:text-sky-400" onClick={() => set(l.id, 'auto')}>Вернуть на подтверждение</button>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Section>

            <Section title="Сквозные номера реестра" hint="Лига присваивает номер каждому кандидату основного списка. В боевом разделе номера приходят файлом; здесь файл имитируется одной кнопкой.">
                <div className={`${CARD} flex flex-wrap items-center gap-3 p-4`}>
                    <Hash size={18} className="text-sky-500" />
                    <span className="text-sm">С номером: <b>{db.candidates.filter(c => c.status === 'active' && c.regNo !== null).length}</b> из <b>{db.candidates.filter(c => c.status === 'active' && c.kind === 'main').length}</b> действующих в основных списках</span>
                    <button type="button" className={`${BTN} ml-auto`} onClick={applyNumbers}>Присвоить номера по образцу файла</button>
                </div>
                {result !== null && <p className="mt-3 text-sm text-muted-foreground">В последний раз сопоставлено записей: {result}.</p>}
            </Section>
        </div>
    )
}
