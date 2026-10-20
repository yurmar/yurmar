import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { platformName } from './data'
import { BTN, BTN_DANGER_ICON, FIELD, Section, TD, TR, Table, type Ctx } from './ui'

export default function ReferenceTab({ ctx }: { ctx: Ctx }) {
    const { db, setDb, notify } = ctx
    const [reason, setReason] = useState('')
    const [plan, setPlan] = useState<Record<string, string>>({})

    const addReason = () => {
        const v = reason.trim()
        if (!v || db.reasons.includes(v)) return
        setDb(d => ({ ...d, reasons: [...d.reasons, v] }))
        setReason('')
        notify('Основание добавлено')
    }
    const used = (r: string) => db.candidates.some(c => c.removalReason === r)

    const setQuota = (areaId: number, kind: 'main' | 'reserve', v: string) => {
        const n = Math.max(0, Math.min(999, Number(v.replace(/\D/g, '')) || 0))
        setDb(d => ({ ...d, quotas: d.quotas.map(q => (q.areaId === areaId && q.kind === kind ? { ...q, count: n } : q)) }))
    }

    return (
        <div className="space-y-6">
            <Section title="Третейские площадки" hint="Площадки лиги, для которых территориальные комиссии составляют списки.">
                <Table head={['Площадка', 'Город', 'Комиссий']}>
                    {db.platforms.map(p => (
                        <tr key={p.id} className={TR}><td className={TD}>{p.name}</td><td className={TD}>{p.city}</td><td className={TD}>{db.areas.filter(a => a.platformId === p.id).length}</td></tr>
                    ))}
                </Table>
            </Section>

            <Section title="Плановая численность" hint="Сколько кандидатов должно быть в списке каждой комиссии. Значение сверяется при проверке и в отчёте «Комплектность цикла».">
                <Table head={['Комиссия', 'Площадка', 'Основной', 'Запасной']}>
                    {db.areas.map(a => (
                        <tr key={a.id} className={TR}>
                            <td className={TD}>{a.name}</td>
                            <td className={TD}>{platformName(db, a.platformId)}</td>
                            {(['main', 'reserve'] as const).map(k => (
                                <td key={k} className={TD}>
                                    <input aria-label={`${a.name}: ${k === 'main' ? 'основной' : 'запасной'}`} inputMode="numeric" className={`${FIELD} !w-20 !py-1.5`}
                                        value={plan[`${a.id}-${k}`] ?? String(db.quotas.find(q => q.areaId === a.id && q.kind === k)?.count ?? 0)}
                                        onChange={e => { setPlan(p => ({ ...p, [`${a.id}-${k}`]: e.target.value })); setQuota(a.id, k, e.target.value) }} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </Table>
            </Section>

            <Section title="Основания исключения" hint="Основание в файле изменений сверяется с этим справочником. Использованное основание удалить нельзя.">
                <div className="space-y-2">
                    {db.reasons.map(r => (
                        <div key={r} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foreground/5 px-3 py-2 text-sm">
                            <span>{r}</span>
                            <button type="button" className={BTN_DANGER_ICON} disabled={used(r)} title={used(r) ? 'Основание уже использовано' : 'Удалить'} aria-label="Удалить"
                                onClick={() => setDb(d => ({ ...d, reasons: d.reasons.filter(x => x !== r) }))}><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <input className={`${FIELD} !w-auto min-w-[240px] flex-1`} placeholder="Новое основание…" value={reason} onChange={e => setReason(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReason()} />
                    <button type="button" className={BTN} disabled={!reason.trim()} onClick={addReason}><Plus size={16} /> Добавить</button>
                </div>
            </Section>
        </div>
    )
}
