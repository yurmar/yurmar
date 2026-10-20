import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    ArrowLeft, Building2, ChevronLeft, ChevronRight, ClipboardList, Download, FileText, FileUp, LayoutGrid, List,
    MapPin, MapPinPlus, Plus, Search, X,
} from 'lucide-react'
import { BTN, BTN_GHOST, CHIP, FIELD } from '../polls/ui'
import PropertyMap from './PropertyMap'
import ImportModal, { type ImportMode, type ImportResult } from './ImportModal'
import { DetailModal, FormModal, downloadMet } from './ObjectModals'
import { egrnPointsToPolygon, polygonCentroid } from './lib/msk38'
import {
    STATUSES, STATUS_BADGE, STATUS_LABEL, emptyForm, fmtDateTime, initialCadastre, initialEgrn, initialObjects, nextId,
    type ImportRecord, type ObjectForm, type PropertyObject, type Status,
} from './data'

type Tab = 'egrn' | 'cadastre' | 'registry'

const TABS: { id: Tab; label: string }[] = [
    { id: 'egrn', label: 'ЕГРН' },
    { id: 'cadastre', label: 'Кадастр' },
    { id: 'registry', label: 'Реестр объектов' },
]

const JOURNAL = {
    egrn: {
        mode: 'egrn' as ImportMode, heading: 'Импорты выписок ЕГРН', action: 'Импорт выписки из ЕГРН',
        numberLabel: 'Кадастровый номер', fileLabel: 'Файл выписки', empty: 'Загрузите первую выписку из ЕГРН, чтобы получить файл .met.',
        text: 'Загрузите PDF выписки — координаты характерных точек границы участка (МСК-38) будут распознаны и выгружены в текстовый файл .met.',
        sample: '/demo-files/real-estate/test-vypiska-egrn.pdf',
    },
    cadastre: {
        mode: 'cadastre' as ImportMode, heading: 'Импорты схем расположения ЗУ', action: 'Импорт схемы',
        numberLabel: 'Условный номер', fileLabel: 'Файл схемы', empty: 'Загрузите первую схему расположения ЗУ, чтобы получить файл .met.',
        text: 'Загрузите PDF схемы расположения земельного участка на кадастровом плане территории — координаты характерных точек границы (МСК-38) будут распознаны и выгружены в файл .met.',
        sample: '/demo-files/real-estate/test-skhema-uchastka.pdf',
    },
}

const TAB_KEY = 'real-estate-tab'
const readTab = (): Tab => {
    try {
        const v = localStorage.getItem(TAB_KEY)
        return TABS.some(t => t.id === v) ? (v as Tab) : 'egrn'
    } catch { return 'egrn' }
}

const VIEW_KEY = 'real-estate-journal-view'
const readView = (): 'table' | 'cards' => {
    try { return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table' } catch { return 'table' }
}

function Pager({ page, pages, total, size, onPage, onSize }: {
    page: number; pages: number; total: number; size: number; onPage: (p: number) => void; onSize: (s: number) => void
}) {
    return (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>Всего: {total}</span>
            <div className="flex items-center gap-2">
                <select className={`${FIELD} !w-auto !py-1.5`} value={size} onChange={e => onSize(Number(e.target.value))}>
                    {[5, 10, 20].map(n => <option key={n} value={n}>{n} на странице</option>)}
                </select>
                <button type="button" className={`${BTN_GHOST} !px-2.5`} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Назад"><ChevronLeft size={16} /></button>
                <span>{page} / {pages}</span>
                <button type="button" className={`${BTN_GHOST} !px-2.5`} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Вперёд"><ChevronRight size={16} /></button>
            </div>
        </div>
    )
}

function Journal({ kind, rows, objects, onImport, onToMap }: {
    kind: 'egrn' | 'cadastre'; rows: ImportRecord[]; objects: PropertyObject[]
    onImport: () => void; onToMap: (r: ImportRecord) => void
}) {
    const j = JOURNAL[kind]
    const [view, setViewState] = useState(readView)
    const [page, setPage] = useState(1)
    const [size, setSize] = useState(10)
    const setView = (v: 'table' | 'cards') => { setViewState(v); try { localStorage.setItem(VIEW_KEY, v) } catch { /* без хранилища выбор живёт до перезагрузки */ } }
    const pages = Math.max(1, Math.ceil(rows.length / size))
    const cur = Math.min(page, pages)
    const pageRows = rows.slice((cur - 1) * size, cur * size)
    const onMap = (r: ImportRecord) => !!r.cadastral_number && objects.some(o => o.cadastral_number === r.cadastral_number)

    const mapBtn = (r: ImportRecord) => (
        <button type="button" className={`${BTN_GHOST} !px-3 !py-1.5 text-xs`} onClick={() => onToMap(r)}>
            {onMap(r) ? <MapPin size={14} /> : <MapPinPlus size={14} />}{onMap(r) ? 'На карте' : 'Добавить на карту'}
        </button>
    )
    const metBtn = (r: ImportRecord, label: string) => (
        <button type="button" className={`${BTN_GHOST} !px-3 !py-1.5 text-xs`} onClick={() => downloadMet(r)}><Download size={14} />{label}</button>
    )

    return (
        <div className="mt-6">
            <div className="card-block flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
                <div>
                    <p className="font-medium">{j.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{j.text}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Для проверки: <a className="text-sky-500 underline" href={j.sample} download>скачать тестовый PDF</a> (вымышленный объект).
                    </p>
                </div>
                <button type="button" className={BTN} onClick={onImport}><FileUp size={16} />{j.action}</button>
            </div>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-xl font-bold sm:text-2xl">{j.heading}</h2>
                {rows.length > 0 && (
                    <div className="flex gap-1 rounded-xl border border-border bg-foreground/5 p-1">
                        {([['table', 'Таблица', List], ['cards', 'Карточки', LayoutGrid]] as const).map(([v, label, Icon]) => (
                            <button key={v} type="button" aria-label={label} title={label} aria-pressed={view === v} onClick={() => setView(v)}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${view === v ? 'bg-sky-500/20 text-sky-500' : 'text-muted-foreground hover:text-foreground'}`}>
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4">
                {rows.length === 0 ? (
                    <div className="card-block flex flex-col items-center gap-3 rounded-2xl p-10 text-center">
                        <ClipboardList size={22} className="text-sky-500" />
                        <p className="font-medium">Импортов пока не было</p>
                        <p className="text-sm text-muted-foreground">{j.empty}</p>
                    </div>
                ) : view === 'cards' ? (
                    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {pageRows.map(r => (
                            <li key={r.id} className="card-block flex flex-col rounded-2xl p-5">
                                <p className="text-xs text-muted-foreground">{fmtDateTime(r.created_at)}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{j.numberLabel}</p>
                                <p className="break-all text-lg font-bold leading-tight">{r.cadastral_number ?? '—'}</p>
                                <div className="mt-3 flex flex-wrap gap-1.5"><span className={CHIP}>{r.coord_system}</span><span className={CHIP}>Точек: {r.points.length}</span></div>
                                <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><FileText size={14} className="mt-0.5 flex-shrink-0" /><span className="min-w-0 break-all">{j.fileLabel}: {r.source_filename ?? '—'}</span></p>
                                <p className="mt-1 text-xs text-muted-foreground">Кто выполнил: {r.created_by_name}</p>
                                <div className="mt-auto flex flex-wrap gap-2 pt-4">{mapBtn(r)}{metBtn(r, 'Скачать .met')}</div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="card-block overflow-x-auto rounded-2xl">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-foreground/5">
                                <tr>{['Дата', j.numberLabel, 'Система координат', 'Точек', j.fileLabel, 'Кто выполнил', 'Карта', '.met'].map(h => (
                                    <th key={h} className="whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>))}</tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pageRows.map(r => (
                                    <tr key={r.id} className="hover:bg-foreground/5">
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm">{fmtDateTime(r.created_at)}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm font-medium">{r.cadastral_number ?? '—'}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.coord_system}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.points.length}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><FileText size={14} />{r.source_filename ?? '—'}</span></td>
                                        <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">{r.created_by_name}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5">{mapBtn(r)}</td>
                                        <td className="whitespace-nowrap px-3 py-2.5">{metBtn(r, 'Скачать')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {rows.length > 0 && <Pager page={cur} pages={pages} total={rows.length} size={size} onPage={setPage} onSize={s => { setSize(s); setPage(1) }} />}
        </div>
    )
}

export default function RealEstateExample() {
    const [objects, setObjects] = useState<PropertyObject[]>(initialObjects)
    const [egrn, setEgrn] = useState<ImportRecord[]>(initialEgrn)
    const [cadastre, setCadastre] = useState<ImportRecord[]>(initialCadastre)
    const [tab, setTabState] = useState<Tab>(readTab)
    const setTab = (t: Tab) => {
        setTabState(t)
        try { localStorage.setItem(TAB_KEY, t) } catch { /* без хранилища вкладка живёт до перезагрузки */ }
    }

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
    const [page, setPage] = useState(1)
    const [size, setSize] = useState(6)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [form, setForm] = useState<{ id: number | null; initial: ObjectForm } | null>(null)
    const [importMode, setImportMode] = useState<ImportMode | null>(null)
    const [pending, setPending] = useState<{ mode: ImportMode; result: ImportResult } | null>(null)

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return objects.filter(o =>
            (statusFilter === 'all' || o.status === statusFilter) &&
            (!term || [o.name, o.address, o.cadastral_number ?? ''].some(v => v.toLowerCase().includes(term))))
    }, [objects, search, statusFilter])

    const pages = Math.max(1, Math.ceil(filtered.length / size))
    const cur = Math.min(page, pages)
    const pageObjects = filtered.slice((cur - 1) * size, cur * size)
    const selected = objects.find(o => o.id === selectedId) ?? null
    const matched = pending ? objects.find(o => o.cadastral_number && o.cadastral_number === pending.result.number) ?? null : null
    const byNumber = (rows: ImportRecord[]) => (selected?.cadastral_number ? rows.find(r => r.cadastral_number === selected.cadastral_number) ?? null : null)

    const select = (id: number) => { setSelectedId(id); setDetailOpen(true) }

    const openCreate = (prefill?: Partial<ObjectForm>) => setForm({ id: null, initial: { ...emptyForm(), ...prefill } })

    const saveObject = (f: ObjectForm) => {
        if (form?.id != null) {
            setObjects(list => list.map(o => (o.id === form.id ? { ...o, ...f } : o)))
        } else {
            const id = nextId()
            setObjects(list => [...list, { id, ...f }])
            setSelectedId(id)
            setTab('registry')
        }
        setForm(null)
    }

    const removeObject = (id: number) => {
        setObjects(list => list.filter(o => o.id !== id))
        setDetailOpen(false)
        setSelectedId(null)
    }

    const prefillFromPoints = (number: string | null, points: { x: number; y: number }[], zone: number): Partial<ObjectForm> => {
        const polygon = egrnPointsToPolygon(points, zone)
        const [lat, lng] = polygonCentroid(polygon)
        return { cadastral_number: number, lat, lng, polygon }
    }

    const handleImportDone = (mode: ImportMode, result: ImportResult) => {
        const exists = result.number && objects.some(o => o.cadastral_number === result.number)
        if (exists) setPending({ mode, result })
        else openCreate(prefillFromPoints(result.number, result.points, result.zone))
    }

    const updateMatchedContour = () => {
        if (!matched || !pending) return
        const p = prefillFromPoints(pending.result.number, pending.result.points, pending.result.zone)
        setObjects(list => list.map(o => (o.id === matched.id ? { ...o, lat: p.lat!, lng: p.lng!, polygon: p.polygon! } : o)))
        setSelectedId(matched.id)
        setPending(null)
        setTab('registry')
    }

    const rowToMap = (r: ImportRecord) => {
        const existing = r.cadastral_number ? objects.find(o => o.cadastral_number === r.cadastral_number) : null
        if (existing) { setSelectedId(existing.id); setTab('registry'); return }
        openCreate(prefillFromPoints(r.cadastral_number, r.points, r.zone))
    }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #134e4a 100%)' }}>
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">
                        <Building2 size={14} /> Имущественный комплекс
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Реестр недвижимости</h1>
                    <div className="mt-4 h-px w-16 bg-teal-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Реестр зданий и земельных участков компании с привязкой к кадастровым номерам и отображением на карте.
                        Контуры можно загрузить из PDF выписки ЕГРН или схемы участка.
                    </p>
                    <p className="mt-3 text-xs text-white/40">Торговая сеть «Северный ветер» · демо-данные вымышлены</p>
                </section>

                <div className="mt-6 flex flex-wrap gap-1.5">
                    {TABS.map(t => (
                        <button key={t.id} type="button" onClick={() => setTab(t.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.id ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400' : 'border border-border bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {pending && (
                    <div className="card-block mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="font-medium">Импорт сохранён — номер {pending.result.number}</p>
                            {matched && <p className="mt-1 text-sm text-muted-foreground">В реестре уже есть объект «{matched.name}» с этим номером — можно обновить его контур на карте.</p>}
                        </div>
                        <div className="flex flex-shrink-0 flex-wrap gap-2">
                            <button type="button" className={BTN} onClick={updateMatchedContour}><MapPin size={16} /> Обновить контур на карте</button>
                            <button type="button" className={BTN_GHOST} onClick={() => setPending(null)}><X size={16} /> Не сейчас</button>
                        </div>
                    </div>
                )}

                {tab === 'egrn' && <Journal kind="egrn" rows={egrn} objects={objects} onImport={() => setImportMode('egrn')} onToMap={rowToMap} />}
                {tab === 'cadastre' && <Journal kind="cadastre" rows={cadastre} objects={objects} onImport={() => setImportMode('cadastre')} onToMap={rowToMap} />}

                {tab === 'registry' && (
                    <>
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative sm:w-96">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input className={`${FIELD} !pl-9 !pr-9`} value={search} placeholder="Название, адрес или кадастровый номер…"
                                    onChange={e => { setSearch(e.target.value); setPage(1) }} />
                                {search && (
                                    <button type="button" aria-label="Очистить поиск" onClick={() => setSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={16} /></button>
                                )}
                            </div>
                            <select className={`${FIELD} sm:!w-auto`} value={statusFilter} onChange={e => { setStatusFilter(e.target.value as Status | 'all'); setPage(1) }}>
                                <option value="all">Все статусы</option>
                                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                            </select>
                            <button type="button" className={`${BTN} sm:ml-auto`} onClick={() => openCreate()}><Plus size={16} /> Добавить объект</button>
                        </div>

                        <div className="mt-6 space-y-6">
                            <div className="card-block rounded-2xl p-3">
                                {filtered.length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                                        <MapPin size={22} className="text-sky-500" />
                                        <p className="text-sm text-muted-foreground">{search ? `Ничего не найдено по запросу «${search}»` : 'Объекты не найдены'}</p>
                                    </div>
                                ) : (
                                    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                        {pageObjects.map(o => (
                                            <li key={o.id}>
                                                <button type="button" onClick={() => select(o.id)}
                                                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${o.id === selectedId ? 'border-teal-500/60 bg-teal-500/10' : 'border-border bg-foreground/5 hover:bg-foreground/10'}`}>
                                                    <p className="truncate font-medium">{o.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">{o.address}</p>
                                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                                                        {o.cadastral_number && <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium">{o.cadastral_number}</span>}
                                                        {o.year_built && <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] font-medium">{o.year_built} г.</span>}
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {filtered.length > 0 && <Pager page={cur} pages={pages} total={filtered.length} size={size} onPage={setPage} onSize={s => { setSize(s); setPage(1) }} />}
                            </div>
                            <PropertyMap objects={filtered} selectedId={selectedId} onSelect={select} />
                        </div>
                    </>
                )}
            </div>

            {detailOpen && selected && (
                <DetailModal obj={selected} egrn={byNumber(egrn)} cadastre={byNumber(cadastre)}
                    onClose={() => setDetailOpen(false)}
                    onEdit={() => { setDetailOpen(false); const { id, ...rest } = selected; setForm({ id, initial: rest }) }}
                    onDelete={() => removeObject(selected.id)} />
            )}
            {form && <FormModal initial={form.initial} isEdit={form.id != null} onClose={() => setForm(null)} onSave={saveObject} />}
            {importMode && (
                <ImportModal mode={importMode} onClose={() => setImportMode(null)}
                    onSave={r => (importMode === 'egrn' ? setEgrn : setCadastre)(list => [r, ...list])}
                    onDone={res => handleImportDone(importMode, res)} />
            )}
        </div>
    )
}
