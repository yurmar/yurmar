import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft, Building2, Download, FileText, FileUp, List, MapPin, Pencil, Plus, Search, Trash2, X,
} from 'lucide-react'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, BTN_ICON, CHIP, FIELD, Sheet } from '../polls/ui'
import {
    OWNER, PURPOSES, RESPONSIBLE, STATUS_BADGE, STATUS_FILL, STATUS_LABEL, fmtDateTime, initialImports,
    initialObjects, nextId, nowStamp, type ExtractImport, type PropertyObject, type Status,
} from './data'

type Tab = 'registry' | 'scheme' | 'imports'

const TABS: { id: Tab; label: string; icon: typeof List }[] = [
    { id: 'registry', label: 'Реестр объектов', icon: List },
    { id: 'scheme', label: 'Схема', icon: MapPin },
    { id: 'imports', label: 'Журнал выписок', icon: FileText },
]

const BADGE = 'rounded-full px-2 py-0.5 text-xs font-medium'
const STATUSES = Object.keys(STATUS_LABEL) as Status[]

type Form = {
    name: string; cadastral: string; address: string; area: string; landArea: string; yearBuilt: string
    floors: string; purpose: string; responsible: string; status: Status; description: string
}

const emptyForm = (): Form => ({
    name: '', cadastral: '', address: '', area: '', landArea: '', yearBuilt: '', floors: '',
    purpose: PURPOSES[0], responsible: RESPONSIBLE[0], status: 'in_use', description: '',
})

const toForm = (o: PropertyObject): Form => ({
    name: o.name, cadastral: o.cadastral, address: o.address, area: o.area?.toString() ?? '',
    landArea: o.landArea?.toString() ?? '', yearBuilt: o.yearBuilt?.toString() ?? '', floors: o.floors?.toString() ?? '',
    purpose: o.purpose, responsible: o.responsible, status: o.status, description: o.description,
})

const num = (s: string) => (s.trim() && !Number.isNaN(Number(s)) ? Number(s) : null)
const fmtNum = (n: number | null, unit: string) => (n == null ? '—' : `${n.toLocaleString('ru-RU')} ${unit}`)

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium">{label}</label>
            {children}
        </div>
    )
}

function StatusBadge({ status }: { status: Status }) {
    return <span className={`${BADGE} ${STATUS_BADGE[status]}`}>{STATUS_LABEL[status]}</span>
}

function DetailSheet({ obj, onClose, onEdit, onDelete }: {
    obj: PropertyObject; onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
    const rows: [string, string][] = [
        ['Кадастровый номер', obj.cadastral || '—'],
        ['Адрес', obj.address],
        ['Назначение', obj.purpose],
        ['Площадь здания', fmtNum(obj.area, 'м²')],
        ['Площадь участка', fmtNum(obj.landArea, 'м²')],
        ['Год постройки', obj.yearBuilt ? `${obj.yearBuilt} г.` : '—'],
        ['Этажность', obj.floors ? String(obj.floors) : '—'],
        ['Собственник', OWNER],
        ['Ответственный', obj.responsible],
    ]
    return (
        <Sheet
            onClose={onClose}
            title={<div><h3 className="text-lg font-semibold">{obj.name}</h3><div className="mt-1"><StatusBadge status={obj.status} /></div></div>}
            footer={(
                <>
                    <button type="button" className={BTN_DANGER_ICON} onClick={onDelete} aria-label="Удалить"><Trash2 size={16} /></button>
                    <button type="button" className={BTN} onClick={onEdit}><Pencil size={16} /> Редактировать</button>
                </>
            )}
        >
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {rows.map(([k, v]) => (
                    <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="text-sm font-medium">{v}</dd>
                    </div>
                ))}
            </dl>
            {obj.description && <p className="mt-4 rounded-xl bg-foreground/5 p-3 text-sm leading-relaxed">{obj.description}</p>}
        </Sheet>
    )
}

function FormSheet({ initial, onClose, onSave }: {
    initial: Form; onClose: () => void; onSave: (f: Form) => void
}) {
    const [form, setForm] = useState<Form>(initial)
    const [error, setError] = useState('')
    const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }))
    const text = (k: keyof Form, label: string, inputMode?: 'numeric') => (
        <Field label={label}>
            <input className={FIELD} inputMode={inputMode} value={form[k]} onChange={e => set(k, e.target.value as never)} />
        </Field>
    )

    const submit = () => {
        if (!form.name.trim() || !form.address.trim()) { setError('Укажите название и адрес'); return }
        onSave(form)
    }

    return (
        <Sheet
            onClose={onClose}
            title={<h3 className="text-lg font-semibold">{initial.name ? 'Редактирование объекта' : 'Новый объект'}</h3>}
            footer={(
                <>
                    <button type="button" className={BTN_GHOST} onClick={onClose}>Отмена</button>
                    <button type="button" className={BTN} onClick={submit}>Сохранить</button>
                </>
            )}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">{text('name', 'Название *')}</div>
                {text('cadastral', 'Кадастровый номер')}
                {text('address', 'Адрес *')}
                {text('area', 'Площадь здания, м²', 'numeric')}
                {text('landArea', 'Площадь участка, м²', 'numeric')}
                {text('yearBuilt', 'Год постройки', 'numeric')}
                {text('floors', 'Этажность', 'numeric')}
                <Field label="Назначение">
                    <select className={FIELD} value={form.purpose} onChange={e => set('purpose', e.target.value)}>
                        {PURPOSES.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <Field label="Ответственный">
                    <select className={FIELD} value={form.responsible} onChange={e => set('responsible', e.target.value)}>
                        {RESPONSIBLE.map(p => <option key={p}>{p}</option>)}
                    </select>
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Статус">
                        <select className={FIELD} value={form.status} onChange={e => set('status', e.target.value as Status)}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                    </Field>
                </div>
                <div className="sm:col-span-2">
                    <Field label="Описание">
                        <textarea rows={3} className={FIELD} value={form.description} onChange={e => set('description', e.target.value)} />
                    </Field>
                </div>
            </div>
            {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
        </Sheet>
    )
}

function Scheme({ objects, selectedId, onSelect }: {
    objects: PropertyObject[]; selectedId: number | null; onSelect: (id: number) => void
}) {
    return (
        <div className="card-block overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-4 py-3 text-xs">
                <span className="text-sm font-semibold">Схема расположения объектов</span>
                {STATUSES.map(s => (
                    <span key={s} className="flex items-center gap-1.5">
                        <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: STATUS_FILL[s] }} />
                        {STATUS_LABEL[s]}
                    </span>
                ))}
            </div>
            <svg viewBox="0 0 100 100" className="block h-auto w-full bg-foreground/[0.03]" role="img" aria-label="Схема объектов">
                <defs>
                    <pattern id="re-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M10 0H0V10" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.2" />
                    </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#re-grid)" />
                {objects.map(o => {
                    const sel = o.id === selectedId
                    const pts = o.polygon.map(p => p.join(',')).join(' ')
                    const cx = o.polygon.reduce((s, p) => s + p[0], 0) / o.polygon.length
                    const cy = o.polygon.reduce((s, p) => s + p[1], 0) / o.polygon.length
                    return (
                        <g key={o.id} className="cursor-pointer" onClick={() => onSelect(o.id)}>
                            <polygon
                                points={pts} fill={STATUS_FILL[o.status]} fillOpacity={sel ? 0.55 : 0.3}
                                stroke={sel ? '#e11d48' : STATUS_FILL[o.status]} strokeWidth={sel ? 0.7 : 0.4}
                            />
                            <circle cx={cx} cy={cy} r={1.2} fill={sel ? '#e11d48' : STATUS_FILL[o.status]} />
                            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="2.2" fill="currentColor">
                                {o.name.length > 22 ? `${o.name.slice(0, 21)}…` : o.name}
                            </text>
                        </g>
                    )
                })}
            </svg>
        </div>
    )
}

export default function RealEstateExample() {
    const [objects, setObjects] = useState<PropertyObject[]>(initialObjects)
    const [imports, setImports] = useState<ExtractImport[]>(initialImports)
    const [tab, setTab] = useState<Tab>('registry')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [formState, setFormState] = useState<{ id: number | null } | null>(null)

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return objects.filter(o =>
            (statusFilter === 'all' || o.status === statusFilter) &&
            (!term || [o.name, o.address, o.cadastral].some(v => v.toLowerCase().includes(term))))
    }, [objects, search, statusFilter])

    const selected = objects.find(o => o.id === selectedId) ?? null
    const totalArea = objects.reduce((s, o) => s + (o.area ?? 0), 0)

    const select = (id: number) => { setSelectedId(id); setDetailOpen(true) }

    const save = (f: Form) => {
        const patch = {
            name: f.name.trim(), cadastral: f.cadastral.trim(), address: f.address.trim(), area: num(f.area),
            landArea: num(f.landArea), yearBuilt: num(f.yearBuilt), floors: num(f.floors), purpose: f.purpose,
            responsible: f.responsible, status: f.status, description: f.description.trim(),
        }
        if (formState?.id != null) {
            setObjects(list => list.map(o => (o.id === formState.id ? { ...o, ...patch } : o)))
        } else {
            const id = nextId()
            // новый объект получает условный контур — на схеме он появляется рядом с остальными
            const k = objects.length % 5
            const polygon: [number, number][] = [[6 + k * 18, 38], [16 + k * 18, 38], [16 + k * 18, 43], [6 + k * 18, 43]]
            setObjects(list => [...list, { id, polygon, ...patch }])
            setSelectedId(id)
        }
        setFormState(null)
    }

    const remove = (id: number) => {
        setObjects(list => list.filter(o => o.id !== id))
        setDetailOpen(false)
        setSelectedId(null)
    }

    const simulateImport = () => {
        const target = objects[Math.floor(Math.random() * objects.length)]
        if (!target) return
        setImports(list => [{
            id: nextId(), date: nowStamp(), cadastral: target.cadastral, coordSystem: 'МСК-77, зона 1',
            points: target.polygon.length, file: `vypiska_${target.cadastral.replace(/\D/g, '')}.pdf`, author: 'Орлова Мария',
        }, ...list])
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #134e4a 100%)' }}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
                        <Building2 size={14} /> Имущественный комплекс
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Реестр недвижимости</h1>
                    <div className="mt-4 h-px w-16 bg-teal-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Учёт зданий и земельных участков компании: кадастровые номера, площади, статус использования
                        и расположение на схеме.
                    </p>
                    <p className="mt-3 text-xs text-white/40">Торговая сеть «Северный ветер» · демо-данные вымышлены</p>
                </section>

                <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-foreground/5 p-1 sm:w-fit">
                    {TABS.map(t => (
                        <button
                            key={t.id} type="button" onClick={() => setTab(t.id)}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                tab === t.id ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                {tab !== 'imports' && (
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            ['Объектов', String(objects.length)],
                            ['Общая площадь', `${totalArea.toLocaleString('ru-RU')} м²`],
                            ['В эксплуатации', String(objects.filter(o => o.status === 'in_use').length)],
                            ['Не используется', String(objects.filter(o => o.status === 'vacant').length)],
                        ].map(([k, v]) => (
                            <div key={k} className="card-block rounded-2xl p-4">
                                <p className="text-xs text-muted-foreground">{k}</p>
                                <p className="mt-1 text-xl font-bold">{v}</p>
                            </div>
                        ))}
                    </div>
                )}

                {tab === 'registry' && (
                    <>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative sm:w-96">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    className={`${FIELD} !pl-9 !pr-9`} value={search} placeholder="Название, адрес или кадастровый номер…"
                                    onChange={e => setSearch(e.target.value)}
                                />
                                {search && (
                                    <button type="button" aria-label="Очистить поиск" onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                            <select className={`${FIELD} sm:!w-auto`} value={statusFilter} onChange={e => setStatusFilter(e.target.value as Status | 'all')}>
                                <option value="all">Все статусы</option>
                                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                            </select>
                            <button type="button" className={`${BTN} sm:ml-auto`} onClick={() => setFormState({ id: null })}>
                                <Plus size={16} /> Добавить объект
                            </button>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="card-block mt-6 rounded-2xl py-12 text-center">
                                <MapPin size={40} className="mx-auto mb-3 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {search ? `Ничего не найдено по запросу «${search}»` : 'Объекты не найдены'}
                                </p>
                            </div>
                        ) : (
                            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {filtered.map(o => (
                                    <li key={o.id}>
                                        <button
                                            type="button" onClick={() => select(o.id)}
                                            className={`card-block flex h-full w-full flex-col rounded-2xl p-5 text-left ${o.id === selectedId ? 'ring-2 ring-teal-500/50' : ''}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold leading-snug">{o.name}</p>
                                                <StatusBadge status={o.status} />
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{o.address}</p>
                                            <div className="mt-3 flex flex-wrap gap-1.5">
                                                <span className={CHIP}>{o.purpose}</span>
                                                {o.area != null && <span className={CHIP}>{o.area.toLocaleString('ru-RU')} м²</span>}
                                                {o.yearBuilt && <span className={CHIP}>{o.yearBuilt} г.</span>}
                                            </div>
                                            <p className="mt-auto pt-3 text-xs text-muted-foreground">Кад. № {o.cadastral || '—'}</p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}

                {tab === 'scheme' && (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <Scheme objects={objects} selectedId={selectedId} onSelect={select} />
                        </div>
                        <div className="card-block h-fit rounded-2xl p-5">
                            {selected ? (
                                <>
                                    <p className="font-semibold">{selected.name}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{selected.address}</p>
                                    <div className="mt-3"><StatusBadge status={selected.status} /></div>
                                    <p className="mt-3 text-sm">Площадь: {fmtNum(selected.area, 'м²')}</p>
                                    <p className="text-sm">Участок: {fmtNum(selected.landArea, 'м²')}</p>
                                    <button type="button" className={`${BTN_GHOST} mt-4 w-full`} onClick={() => setDetailOpen(true)}>Подробнее</button>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">Выберите объект на схеме, чтобы увидеть сведения.</p>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'imports' && (
                    <div className="mt-6">
                        <div className="card-block flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
                            <div>
                                <p className="font-medium">Импорт выписки из ЕГРН</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Загрузите PDF выписки — координаты границ участка будут распознаны и сохранены в журнале.
                                    В примере загрузка имитируется.
                                </p>
                            </div>
                            <button type="button" className={BTN} onClick={simulateImport}><FileUp size={16} /> Загрузить выписку</button>
                        </div>

                        <div className="card-block mt-6 overflow-x-auto rounded-2xl">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-foreground/5">
                                    <tr>
                                        {['Дата', 'Кадастровый номер', 'Система координат', 'Точек', 'Файл', 'Кто выполнил', ''].map(h => (
                                            <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {imports.map(r => (
                                        <tr key={r.id} className="hover:bg-foreground/5">
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm">{fmtDateTime(r.date)}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium">{r.cadastral || '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.coordSystem}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.points}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5"><FileText size={14} />{r.file}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.author}</td>
                                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                                                <button type="button" className={BTN_ICON} aria-label="Скачать" title="Скачать"><Download size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {detailOpen && selected && (
                <DetailSheet
                    obj={selected}
                    onClose={() => setDetailOpen(false)}
                    onEdit={() => { setDetailOpen(false); setFormState({ id: selected.id }) }}
                    onDelete={() => remove(selected.id)}
                />
            )}
            {formState && (
                <FormSheet
                    initial={formState.id != null ? toForm(objects.find(o => o.id === formState.id)!) : emptyForm()}
                    onClose={() => setFormState(null)}
                    onSave={save}
                />
            )}
        </div>
    )
}
