import { useEffect, useMemo, useState } from 'react'
import { Pencil, Search, UserSearch, X } from 'lucide-react'
import {
    EVENT_LABELS, FIELD_LABELS, KIND_LABEL, addressLine, areaName, daysAgo, fmtDate, fullName, manualEdit, platformName,
    type Candidate, type EditField, type ListKind,
} from './data'
import { BTN, BTN_GHOST, CARD, CandidateBadge, Empty, FIELD, LABEL, Segmented, Sheet, TD, TR, Table, type Ctx } from './ui'

const PAGE = 15
const EDITABLE: EditField[] = ['last', 'first', 'middle', 'sex', 'birth', 'locality', 'street', 'house', 'flat']

function CandidateModal({ ctx, id, onClose }: { ctx: Ctx; id: number; onClose: () => void }) {
    const { db, setDb, notify } = ctx
    const c = db.candidates.find(x => x.id === id)!
    const events = db.events.filter(e => e.candidateId === id).sort((a, b) => b.at.localeCompare(a.at) || b.id - a.id)
    const links = db.links.filter(l => l.a === id || l.b === id)
        .map(l => ({ l, other: db.candidates.find(x => x.id === (l.a === id ? l.b : l.a))! }))
    const [editing, setEditing] = useState(false)
    const [form, setForm] = useState<Record<EditField, string>>(() => Object.fromEntries(EDITABLE.map(f => [f, c[f]])) as Record<EditField, string>)
    const [reason, setReason] = useState('')

    const save = () => {
        setDb(d => manualEdit(d, id, form, reason.trim(), daysAgo(0)))
        setEditing(false)
        setReason('')
        notify('Правка сохранена в истории записи')
    }

    return (
        <Sheet
            title={<div><h3 className="text-lg font-semibold">{fullName(c)}</h3><div className="mt-1"><CandidateBadge status={c.status} /></div></div>}
            onClose={onClose}
            footer={editing
                ? <><button type="button" className={BTN_GHOST} onClick={() => setEditing(false)}>Отмена</button>
                    <button type="button" className={BTN} disabled={!reason.trim()} onClick={save}>Сохранить</button></>
                : c.status === 'active' ? <button type="button" className={BTN_GHOST} onClick={() => setEditing(true)}><Pencil size={14} /> Править вручную</button> : undefined}
        >
            {editing ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {EDITABLE.map(f => (
                        <div key={f}>
                            <span className={LABEL}>{FIELD_LABELS[f]}</span>
                            <input className={FIELD} type={f === 'birth' ? 'date' : 'text'} value={form[f]} onChange={e => setForm(s => ({ ...s, [f]: e.target.value }))} />
                        </div>
                    ))}
                    <div className="sm:col-span-2">
                        <span className={LABEL}>Причина правки *</span>
                        <input className={FIELD} value={reason} placeholder="Например, исправлена опечатка по бумажному экземпляру" onChange={e => setReason(e.target.value)} />
                    </div>
                </div>
            ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {([
                        ['Комиссия', areaName(db, c.areaId)],
                        ['Площадка', platformName(db, c.platformId)],
                        ['Список', `${KIND_LABEL[c.kind]}, № ${c.areaNo}`],
                        ['Сквозной номер', c.regNo !== null ? String(c.regNo) : '—'],
                        ['Дата рождения', fmtDate(c.birth)],
                        ['Пол', c.sex],
                        ['Адрес', addressLine(c)],
                        ...(c.removalReason ? [['Основание исключения', c.removalReason]] : []),
                    ] as [string, string][]).map(([k, v]) => (
                        <div key={k}><dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>
                    ))}
                </dl>
            )}

            {links.length > 0 && (
                <div className="mt-5">
                    <h4 className="mb-2 text-sm font-semibold">Возможные совпадения в других списках</h4>
                    {links.map(({ l, other }) => (
                        <p key={l.id} className="rounded-lg bg-foreground/5 px-3 py-2 text-sm">
                            {fullName(other)} · {platformName(db, other.platformId)} · {KIND_LABEL[other.kind].toLowerCase()}
                            <span className="ml-2 text-xs text-muted-foreground">({l.confidence === 'auto' ? 'на подтверждении' : l.confidence === 'confirmed' ? 'подтверждено' : 'отклонено'})</span>
                        </p>
                    ))}
                </div>
            )}

            <h4 className="mb-2 mt-5 text-sm font-semibold">История записи</h4>
            <div className="space-y-2">
                {events.map(e => (
                    <div key={e.id} className="rounded-lg border border-border bg-foreground/5 px-3 py-2 text-sm">
                        <p className="flex flex-wrap justify-between gap-2"><b>{EVENT_LABELS[e.type]}</b><span className="text-xs text-muted-foreground">{fmtDate(e.at)}</span></p>
                        {e.reason && <p className="text-xs text-muted-foreground">{e.reason}</p>}
                        {e.changes && (Object.keys(e.changes) as EditField[]).map(f => (
                            <p key={f} className="text-xs">{FIELD_LABELS[f]}: <span className="text-muted-foreground line-through">{e.changes![f]![0] || '—'}</span> → <b>{e.changes![f]![1] || '—'}</b></p>
                        ))}
                    </div>
                ))}
            </div>
        </Sheet>
    )
}

export default function CandidatesTab({ ctx }: { ctx: Ctx }) {
    const { db } = ctx
    const [areaId, setAreaId] = useState('')
    const [platformId, setPlatformId] = useState('')
    const [kind, setKind] = useState<'' | ListKind>('')
    const [status, setStatus] = useState<'' | 'active' | 'removed'>('active')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [selected, setSelected] = useState<number | null>(null)

    const q = search.trim().toLowerCase()
    const items = useMemo(() => db.candidates.filter((c: Candidate) =>
        (!areaId || c.areaId === Number(areaId)) && (!platformId || c.platformId === Number(platformId)) && (!kind || c.kind === kind) &&
        (!status || c.status === status) && (!q || fullName(c).toLowerCase().includes(q)),
    ).sort((a, b) => a.platformId - b.platformId || a.areaId - b.areaId || a.kind.localeCompare(b.kind) || a.areaNo - b.areaNo), [db.candidates, areaId, platformId, kind, status, q])

    useEffect(() => setPage(1), [areaId, platformId, kind, status, q])
    const pages = Math.max(1, Math.ceil(items.length / PAGE))
    const slice = items.slice((page - 1) * PAGE, page * PAGE)
    const areaOptions = db.areas.filter(a => !platformId || a.platformId === Number(platformId))

    return (
        <div className="space-y-4">
            <div className={`${CARD} p-5`}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <span className={LABEL}>Площадка</span>
                        <select className={FIELD} value={platformId} onChange={e => { setPlatformId(e.target.value); setAreaId('') }}>
                            <option value="">Все площадки</option>
                            {db.platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <span className={LABEL}>Территориальная комиссия</span>
                        <select className={FIELD} value={areaId} onChange={e => setAreaId(e.target.value)}>
                            <option value="">Все комиссии</option>
                            {areaOptions.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <span className={LABEL}>Вид списка</span>
                        <Segmented<'' | ListKind> value={kind} onChange={setKind} options={[{ id: '', label: 'Все' }, { id: 'main', label: 'Основной' }, { id: 'reserve', label: 'Запасной' }]} />
                    </div>
                    <div>
                        <span className={LABEL}>Статус</span>
                        <Segmented<'' | 'active' | 'removed'> value={status} onChange={setStatus} options={[{ id: 'active', label: 'Действующие' }, { id: 'removed', label: 'Исключённые' }, { id: '', label: 'Все' }]} />
                    </div>
                </div>
                <div className="relative mt-4">
                    <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <input className={`${FIELD} !pl-9 !pr-9`} placeholder="Поиск по ФИО…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button type="button" aria-label="Очистить поиск" className="absolute right-3 top-3 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}><X size={16} /></button>}
                </div>
            </div>

            {items.length === 0 ? (
                <div className={CARD}><Empty icon={UserSearch} text="Кандидатов по выбранным условиям нет" /></div>
            ) : (
                <>
                    <div className="hidden md:block">
                        <Table head={['№', 'Сквозной №', 'ФИО', 'Пол', 'Дата рождения', 'Адрес', 'Площадка', 'Список', 'Статус']}>
                            {slice.map(c => (
                                <tr key={c.id} tabIndex={0} className={`${TR} cursor-pointer align-top`} onClick={() => setSelected(c.id)} onKeyDown={e => e.key === 'Enter' && setSelected(c.id)}>
                                    <td className={`${TD} whitespace-nowrap`}>{c.areaNo}</td>
                                    <td className={`${TD} whitespace-nowrap`}>{c.regNo ?? '—'}</td>
                                    <td className={`${TD} font-medium`}>{fullName(c)}</td>
                                    <td className={TD}>{c.sex}</td>
                                    <td className={`${TD} whitespace-nowrap`}>{fmtDate(c.birth)}</td>
                                    <td className={`${TD} max-w-xs`}>{addressLine(c)}</td>
                                    <td className={TD}>{platformName(db, c.platformId)}</td>
                                    <td className={`${TD} whitespace-nowrap`}>{KIND_LABEL[c.kind]}</td>
                                    <td className={TD}><CandidateBadge status={c.status} /></td>
                                </tr>
                            ))}
                        </Table>
                    </div>
                    <div className="space-y-3 md:hidden">
                        {slice.map(c => (
                            <button key={c.id} type="button" onClick={() => setSelected(c.id)} className={`${CARD} block w-full p-4 text-left`}>
                                <div className="flex items-start justify-between gap-2"><span className="font-medium">{fullName(c)}</span><CandidateBadge status={c.status} /></div>
                                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(c.birth)} · № {c.areaNo}{c.regNo !== null ? ` · сквозной № ${c.regNo}` : ''} · {KIND_LABEL[c.kind].toLowerCase()}</p>
                                <p className="mt-1 text-sm">{addressLine(c)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{areaName(db, c.areaId)} · {platformName(db, c.platformId)}</p>
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Кандидатов: {items.length}</span>
                        <div className="flex items-center gap-2">
                            <button type="button" className={BTN_GHOST} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Назад</button>
                            <span>{page} из {pages}</span>
                            <button type="button" className={BTN_GHOST} disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Вперёд</button>
                        </div>
                    </div>
                </>
            )}
            {selected !== null && <CandidateModal key={selected} ctx={ctx} id={selected} onClose={() => setSelected(null)} />}
        </div>
    )
}
