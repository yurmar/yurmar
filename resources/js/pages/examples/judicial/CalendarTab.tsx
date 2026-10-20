import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { INSTANCE_LABEL, fmtDate, mainNumber, todayIso } from './data'
import { BTN_ICON, CARD, type Ctx } from './ui'

interface Ev { kind: 'hearing' | 'deadline' | 'note'; caseId: number; title: string }

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
const KIND_CLS: Record<Ev['kind'], string> = {
    hearing: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    deadline: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    note: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}

export default function CalendarTab({ ctx }: { ctx: Ctx }) {
    const now = new Date()
    const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
    const [selected, setSelected] = useState<string | null>(null)

    const events = useMemo(() => {
        const map = new Map<string, Ev[]>()
        const add = (date: string | null, ev: Ev) => { if (date) map.set(date, [...(map.get(date) ?? []), ev]) }
        ctx.db.cases.forEach(c => {
            if (c.status === 'terminated') return
            c.instances.forEach(i => {
                add(i.nextHearing, { kind: 'hearing', caseId: c.id, title: `Заседание · ${INSTANCE_LABEL[i.type]}${i.nextTask ? `: ${i.nextTask}` : ''}` })
                add(i.appealDeadline, { kind: 'deadline', caseId: c.id, title: `Срок обжалования · ${INSTANCE_LABEL[i.type]}` })
            })
            c.notes.forEach(n => add(n.date, { kind: 'note', caseId: c.id, title: n.text }))
        })
        return map
    }, [ctx.db.cases])

    const first = new Date(cursor.y, cursor.m, 1)
    const lead = (first.getDay() + 6) % 7
    const days = new Date(cursor.y, cursor.m + 1, 0).getDate()
    const cells = Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => (i < lead || i >= lead + days ? null : i - lead + 1))
    const iso = (d: number) => `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const move = (delta: number) => setCursor(c => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
    const today = todayIso()
    const list = selected ? events.get(selected) ?? [] : []

    return (
        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
            <section className={`${CARD} p-4 sm:p-5`}>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{MONTHS[cursor.m]} {cursor.y}</h2>
                    <div className="flex gap-2">
                        <button type="button" className={BTN_ICON} onClick={() => move(-1)} aria-label="Предыдущий месяц"><ChevronLeft size={16} /></button>
                        <button type="button" className={BTN_ICON} onClick={() => move(1)} aria-label="Следующий месяц"><ChevronRight size={16} /></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d} className="py-1">{d}</div>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                    {cells.map((d, i) => {
                        if (!d) return <div key={i} />
                        const key = iso(d)
                        const evs = events.get(key) ?? []
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setSelected(key)}
                                className={`flex min-h-[3.5rem] flex-col items-start rounded-lg border p-1.5 text-left text-xs transition-colors sm:min-h-[4.5rem] ${
                                    selected === key ? 'border-sky-500 bg-sky-500/10' : key === today ? 'border-sky-500/50' : 'border-border hover:bg-foreground/5'
                                }`}
                            >
                                <span className={key === today ? 'font-bold text-sky-500' : ''}>{d}</span>
                                <span className="mt-auto flex flex-wrap gap-0.5">
                                    {evs.slice(0, 4).map((e, k) => (
                                        <span key={k} className={`h-1.5 w-1.5 rounded-full ${e.kind === 'hearing' ? 'bg-sky-500' : e.kind === 'deadline' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    ))}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500" />заседание</span>
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-500" />срок обжалования</span>
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500" />заметка</span>
                </p>
            </section>

            <aside className={`${CARD} p-5`}>
                <h3 className="font-semibold">{selected ? fmtDate(selected) : 'Выберите день'}</h3>
                {selected && list.length === 0 && <p className="mt-3 text-sm text-muted-foreground">Событий нет.</p>}
                <ul className="mt-3 space-y-2">
                    {list.map((e, i) => {
                        const c = ctx.db.cases.find(x => x.id === e.caseId)
                        return (
                            <li key={i}>
                                <button type="button" className={`w-full rounded-lg px-3 py-2 text-left text-sm ${KIND_CLS[e.kind]}`} onClick={() => ctx.openCase(e.caseId)}>
                                    <p className="font-medium">{e.title}</p>
                                    {c && <p className="mt-0.5 text-xs opacity-80">{mainNumber(c)}</p>}
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </aside>
        </div>
    )
}
