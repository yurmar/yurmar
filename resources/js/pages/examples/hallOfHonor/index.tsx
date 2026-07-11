import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Eye, Pencil, Copy, BrushCleaning, Award, Trophy } from 'lucide-react'
import { HonorNav } from './HonorNav'
import {
    Honoree, INITIAL_HONOREES, NOMINATIONS, FIELDS, BRANCHES, APPROVING_DEPTS, APPROVAL_DECISIONS,
    titleById, formatDate, formatMoney, currentStage, STAGES, StageKey,
} from './data'
import {
    ACCENT, SPACE_GROTESK, useSpaceGrotesk, RankRail, RankRailLabeled, Dialog,
    Field, TextInput, TextArea, SelectInput, Pagination,
} from './ui'

const ROWS_PER_PAGE = 10

type DisplayRow = {
    id: number
    surname: string; name: string; patronymic: string
    position: string; department: string
    award: string; numOrder: string; dateOrder: string
    decisionCouncil: string; authority: string; field: string; dateMeetingCouncil: string
    stage: StageKey
    raw: Honoree
}

type ColKey = 'surname' | 'name' | 'patronymic' | 'position' | 'department' | 'award' | 'numOrder' | 'dateOrder' | 'decisionCouncil' | 'authority' | 'field' | 'dateMeetingCouncil'

const BASE_COLUMNS: { header: string; accessor: ColKey }[] = [
    { header: 'Фамилия', accessor: 'surname' },
    { header: 'Имя', accessor: 'name' },
    { header: 'Отчество', accessor: 'patronymic' },
    { header: 'Должность', accessor: 'position' },
    { header: 'Подразделение', accessor: 'department' },
    { header: 'Номинация', accessor: 'award' },
    { header: 'Номер приказа', accessor: 'numOrder' },
    { header: 'Дата приказа', accessor: 'dateOrder' },
]

const EXTRA_COLUMNS: { header: string; accessor: ColKey }[] = [
    { header: 'Решение комиссии', accessor: 'decisionCouncil' },
    { header: 'Согласующее подразделение', accessor: 'authority' },
    { header: 'Направление деятельности', accessor: 'field' },
    { header: 'Дата заседания комиссии', accessor: 'dateMeetingCouncil' },
]

const YEARS = [2023, 2024, 2025, 2026, 2027]

const EMPTY_FORM: Omit<Honoree, 'id'> = {
    year: 2026, surname: '', name: '', patronymic: '', regNum: '', dateBirth: '', staffNum: '',
    position: '', department: '', fieldId: null, awardId: null, branchId: null,
    dateSendingMgmt: '', dateResolutionMgmt: '', authorityId: null, dateNumDoc: '',
    decisionAuthorityId: null, dateResolutionDecision: '', note: '',
    dateMeetingCouncil: '', decisionCouncilAwardId: null, noteCouncil: '',
    dateOrder: '', numOrder: '', sumBonus: '', dateDocBonus: '', numDocBonus: '', awardTransferred: '',
}

function toDisplayRow(h: Honoree): DisplayRow {
    return {
        id: h.id,
        surname: h.surname, name: h.name, patronymic: h.patronymic,
        position: h.position, department: h.department,
        award: titleById(h.awardId, NOMINATIONS),
        numOrder: h.numOrder, dateOrder: formatDate(h.dateOrder),
        decisionCouncil: titleById(h.decisionCouncilAwardId, NOMINATIONS),
        authority: titleById(h.authorityId, APPROVING_DEPTS),
        field: titleById(h.fieldId, FIELDS),
        dateMeetingCouncil: formatDate(h.dateMeetingCouncil),
        stage: currentStage(h),
        raw: h,
    }
}

export default function HallOfHonorRegistry() {
    useSpaceGrotesk()

    const [honorees, setHonorees] = useState<Honoree[]>(INITIAL_HONOREES)
    const [yearFilter, setYearFilter] = useState<string>('2026')
    const [statusFilter, setStatusFilter] = useState<'' | 'given' | 'not_given'>('')
    const [showExtra, setShowExtra] = useState(false)
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sortColumn, setSortColumn] = useState<ColKey | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [page, setPage] = useState(1)

    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'copy' | null>(null)
    const [viewRow, setViewRow] = useState<Honoree | null>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [form, setForm] = useState<Omit<Honoree, 'id'>>(EMPTY_FORM)
    const [errors, setErrors] = useState<Record<string, boolean>>({})

    const columns = showExtra ? [...BASE_COLUMNS, ...EXTRA_COLUMNS] : BASE_COLUMNS

    const displayRows = useMemo(() => honorees.map(toDisplayRow), [honorees])

    const filteredRows = displayRows.filter(row => {
        if (yearFilter && row.raw.year !== Number(yearFilter)) return false
        if (statusFilter === 'given' && !row.raw.awardTransferred) return false
        if (statusFilter === 'not_given' && row.raw.awardTransferred) return false
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true
            return String(row[key as ColKey] ?? '').toLowerCase().includes(value.toLowerCase())
        })
    })

    const sortedRows = sortColumn
        ? [...filteredRows].sort((a, b) => {
            const av = String(a[sortColumn] ?? ''); const bv = String(b[sortColumn] ?? '')
            return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
        })
        : filteredRows

    const totalPages = Math.max(1, Math.ceil(sortedRows.length / ROWS_PER_PAGE))
    const pageRows = sortedRows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

    const toggleSort = (accessor: ColKey) => {
        if (sortColumn === accessor) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColumn(accessor); setSortDirection('asc') }
    }

    const nextId = useMemo(() => Math.max(0, ...honorees.map(h => h.id)) + 1, [honorees])

    const openAdd = () => {
        setForm({ ...EMPTY_FORM, regNum: `НМ-${String(2026).slice(2)}-${String(nextId).padStart(3, '0')}` })
        setSelectedId(null)
        setErrors({})
        setModalMode('add')
    }

    const openEdit = (h: Honoree) => {
        const { id, ...rest } = h
        setForm(rest)
        setSelectedId(id)
        setErrors({})
        setModalMode('edit')
        setViewRow(null)
    }

    const openCopy = (h: Honoree) => {
        const { id, ...rest } = h
        setForm(rest)
        setSelectedId(null)
        setErrors({})
        setModalMode('copy')
        setViewRow(null)
    }

    const closeModal = () => { setModalMode(null); setSelectedId(null) }

    const handleSave = () => {
        const newErrors = {
            surname: !form.surname.trim(),
            name: !form.name.trim(),
            position: !form.position.trim(),
            department: !form.department.trim(),
        }
        setErrors(newErrors)
        if (Object.values(newErrors).some(Boolean)) return

        if (modalMode === 'edit' && selectedId !== null) {
            setHonorees(prev => prev.map(h => h.id === selectedId ? { ...form, id: selectedId } : h))
        } else {
            setHonorees(prev => [{ ...form, id: nextId }, ...prev])
        }
        closeModal()
    }

    const setF = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
        setErrors(prev => ({ ...prev, [key]: false }))
    }

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            {/* ── Hero ── */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2b2c 0%, #0f3d3e 55%, #0a2426 100%)' }}>
                <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full blur-3xl opacity-25" style={{ background: 'radial-gradient(circle, #ff6b4a, transparent 70%)' }} />
                <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                    <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                        <ArrowLeft size={13} /> Все примеры
                    </Link>
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff8f74]">
                            <Award size={13} /> Доска почёта · реестр номинантов
                        </span>
                        <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight text-white" style={SPACE_GROTESK}>
                            Доска почёта
                        </h1>
                        <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">
                            Путь номинанта от подачи представления до вручения награды — ООО «Цифровые решения».
                            Шесть этапов, один общий рельс прогресса.
                        </p>
                    </div>

                    <div className="mt-7 overflow-x-auto pb-1">
                        <div className="min-w-[560px]">
                            <RankRailLabeled stageKey="transferred" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <HonorNav />

                {/* ── Тулбар ── */}
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-end gap-3">
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">По годам</label>
                            <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); setPage(1) }}
                                className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все годы</option>
                                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-muted-foreground mb-1">Награда вручена</label>
                            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1) }}
                                className="px-3 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer">
                                <option value="">Все</option>
                                <option value="given">Награда вручена</option>
                                <option value="not_given">Награда не вручена</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setShowExtra(v => !v)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                            style={{ background: 'var(--honor-ink)' }}
                        >
                            {showExtra ? 'Скрыть колонки' : 'Показать все колонки'}
                        </button>
                    </div>
                    <button
                        onClick={openAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                        style={{ background: 'var(--honor-coral)' }}
                    >
                        <Plus size={14} /> Добавить номинанта
                    </button>
                </div>

                {/* ── Таблица ── */}
                <div className="rounded-2xl border border-border overflow-hidden card-block">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                                    {columns.map(col => (
                                        <th key={col.accessor} onClick={() => toggleSort(col.accessor)} className="cursor-pointer px-3 py-2 text-left whitespace-nowrap select-none hover:text-foreground transition-colors">
                                            {col.header}{sortColumn === col.accessor && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 text-left whitespace-nowrap">Этап</th>
                                    <th className="sticky right-0 bg-card px-3 py-2 text-right whitespace-nowrap border-l border-border">
                                        <button onClick={() => setFilters({})} className="p-1 rounded hover:bg-foreground/10 text-muted-foreground" title="Сбросить фильтры">
                                            <BrushCleaning size={13} />
                                        </button>
                                    </th>
                                </tr>
                                <tr className="border-b border-border">
                                    {columns.map(col => (
                                        <th key={col.accessor} className="px-2 py-1.5">
                                            <input
                                                type="text"
                                                value={filters[col.accessor] ?? ''}
                                                onChange={e => setFilters(prev => ({ ...prev, [col.accessor]: e.target.value }))}
                                                className="w-full text-xs px-2 py-1 rounded-md bg-foreground/5 border border-border text-foreground focus:outline-none"
                                            />
                                        </th>
                                    ))}
                                    <th />
                                    <th className="sticky right-0 bg-card border-l border-border" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {pageRows.length === 0 ? (
                                    <tr><td colSpan={columns.length + 2} className="px-3 py-10 text-center text-muted-foreground text-sm">Номинанты не найдены</td></tr>
                                ) : pageRows.map(row => (
                                    <tr key={row.id} className="hover:bg-foreground/5 transition-colors group/row">
                                        {columns.map(col => {
                                            const val = row[col.accessor]
                                            return (
                                                <td key={col.accessor} className="px-3 py-2 text-[12px] text-foreground/85 whitespace-nowrap">
                                                    {val || <span className="text-muted-foreground/50">нд</span>}
                                                </td>
                                            )
                                        })}
                                        <td className="px-3 py-2"><RankRail stageKey={row.stage} size="sm" /></td>
                                        <td className="sticky right-0 bg-card group-hover/row:bg-foreground/5 px-3 py-2 border-l border-border transition-colors">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setViewRow(row.raw)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors" title="Просмотреть">
                                                    <Eye size={14} />
                                                </button>
                                                <button onClick={() => openEdit(row.raw)} className="p-1.5 rounded-lg hover:bg-foreground/10 transition-colors" style={{ color: 'var(--honor-ink-light)' }} title="Редактировать">
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <p className="text-xs text-muted-foreground">Страница {page} из {totalPages} · записей: {sortedRows.length}</p>
                </div>
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>

            {/* ── Модалка добавления/редактирования/копирования ── */}
            <Dialog
                open={modalMode !== null}
                onClose={closeModal}
                wide
                title={
                    modalMode === 'edit' ? `Редактировать номинанта №${selectedId}` :
                    modalMode === 'copy' ? 'Копия номинанта' : 'Новый номинант'
                }
                footer={<>
                    <button onClick={closeModal} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ml-auto" style={{ background: 'var(--honor-ink)' }}>
                        {modalMode === 'edit' ? 'Сохранить' : 'Добавить'}
                    </button>
                </>}
            >
                <HonoreeFormFields form={form} setF={setF} errors={errors} />
            </Dialog>

            {/* ── Модалка просмотра ── */}
            <Dialog
                open={!!viewRow}
                onClose={() => setViewRow(null)}
                wide
                title={<span className="flex items-center gap-2">
                    <Trophy size={16} style={{ color: 'var(--honor-coral)' }} />
                    Карточка номинанта №{viewRow?.id}
                    <button onClick={() => viewRow && openCopy(viewRow)} className="ml-2 p-1.5 rounded-lg hover:bg-foreground/10 transition-colors" style={{ color: 'var(--honor-ink-light)' }} title="Копировать">
                        <Copy size={14} />
                    </button>
                </span>}
                footer={<button onClick={() => setViewRow(null)} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors ml-auto">Закрыть</button>}
            >
                {viewRow && <HonoreeView h={viewRow} />}
            </Dialog>
        </div>
    )
}

// ── Форма ────────────────────────────────────────────────────────────────

function HonoreeFormFields({ form, setF, errors }: {
    form: Omit<Honoree, 'id'>
    setF: <K extends keyof Omit<Honoree, 'id'>>(key: K, value: Omit<Honoree, 'id'>[K]) => void
    errors: Record<string, boolean>
}) {
    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4">
                <Field label="Фамилия" error={errors.surname}><TextInput value={form.surname} error={errors.surname} onChange={e => setF('surname', e.target.value)} /></Field>
                <Field label="Имя" error={errors.name}><TextInput value={form.name} error={errors.name} onChange={e => setF('name', e.target.value)} /></Field>
                <Field label="Отчество"><TextInput value={form.patronymic} onChange={e => setF('patronymic', e.target.value)} /></Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 mt-2">
                <div>
                    <Field label="Год"><SelectInput value={form.year} onChange={v => setF('year', v ?? 2026)} options={YEARS.map(y => ({ id: y, title: String(y) }))} /></Field>
                    <Field label="Рег. номер представления"><TextInput value={form.regNum} onChange={e => setF('regNum', e.target.value)} /></Field>
                    <Field label="Дата рождения"><TextInput type="date" value={form.dateBirth} onChange={e => setF('dateBirth', e.target.value)} className="[color-scheme:light] dark:[color-scheme:dark]" /></Field>
                    <Field label="Табельный номер"><TextInput value={form.staffNum} onChange={e => setF('staffNum', e.target.value)} /></Field>
                </div>
                <div>
                    <Field label="Должность" error={errors.position}><TextArea rows={2} value={form.position} error={errors.position} onChange={e => setF('position', e.target.value)} /></Field>
                    <Field label="Подразделение" error={errors.department}><TextArea rows={2} value={form.department} error={errors.department} onChange={e => setF('department', e.target.value)} /></Field>
                    <Field label="Направление деятельности"><SelectInput value={form.fieldId} onChange={v => setF('fieldId', v)} options={FIELDS} placeholder="Выберите направление" /></Field>
                </div>
                <div>
                    <Field label="Номинация"><SelectInput value={form.awardId} onChange={v => setF('awardId', v)} options={NOMINATIONS} placeholder="Выберите номинацию" /></Field>
                    <Field label="Филиал"><SelectInput value={form.branchId} onChange={v => setF('branchId', v)} options={BRANCHES} placeholder="Выберите филиал" /></Field>
                </div>
                <div>
                    <Field label="Дата направления руководству"><TextInput type="date" value={form.dateSendingMgmt} onChange={e => setF('dateSendingMgmt', e.target.value)} /></Field>
                    <Field label="Дата решения руководства"><TextInput type="date" value={form.dateResolutionMgmt} onChange={e => setF('dateResolutionMgmt', e.target.value)} /></Field>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 mt-2">
                <div>
                    <Field label="Согласующее подразделение"><SelectInput value={form.authorityId} onChange={v => setF('authorityId', v)} options={APPROVING_DEPTS} placeholder="Выберите подразделение" /></Field>
                    <Field label="Дата и № записки"><TextInput value={form.dateNumDoc} onChange={e => setF('dateNumDoc', e.target.value)} /></Field>
                </div>
                <div>
                    <Field label="Решение подразделения"><SelectInput value={form.decisionAuthorityId} onChange={v => setF('decisionAuthorityId', v)} options={APPROVAL_DECISIONS} placeholder="Выберите решение" /></Field>
                    <Field label="Дата и № решения"><TextInput value={form.dateResolutionDecision} onChange={e => setF('dateResolutionDecision', e.target.value)} /></Field>
                </div>
                <div className="sm:col-span-2">
                    <Field label="Примечание"><TextArea rows={3} value={form.note} onChange={e => setF('note', e.target.value)} /></Field>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 mt-2">
                <div>
                    <Field label="Дата заседания комиссии"><TextInput type="date" value={form.dateMeetingCouncil} onChange={e => setF('dateMeetingCouncil', e.target.value)} /></Field>
                </div>
                <div>
                    <Field label="Решение комиссии"><SelectInput value={form.decisionCouncilAwardId} onChange={v => setF('decisionCouncilAwardId', v)} options={NOMINATIONS} placeholder="Утверждённая номинация" /></Field>
                </div>
                <div className="sm:col-span-2">
                    <Field label="Примечание комиссии"><TextArea rows={2} value={form.noteCouncil} onChange={e => setF('noteCouncil', e.target.value)} /></Field>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-2">
                <Field label="Дата приказа"><TextInput type="date" value={form.dateOrder} onChange={e => setF('dateOrder', e.target.value)} /></Field>
                <Field label="Номер приказа"><TextInput value={form.numOrder} onChange={e => setF('numOrder', e.target.value)} /></Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 mt-2">
                <Field label="Сумма премии, ₽"><TextInput value={form.sumBonus} onChange={e => setF('sumBonus', e.target.value)} /></Field>
                <Field label="Дата записки на выплату"><TextInput type="date" value={form.dateDocBonus} onChange={e => setF('dateDocBonus', e.target.value)} /></Field>
                <Field label="Номер записки на выплату"><TextInput value={form.numDocBonus} onChange={e => setF('numDocBonus', e.target.value)} /></Field>
            </div>

            <div className="mt-2">
                <Field label="Награда вручена (дата, кто вручил)"><TextArea rows={2} value={form.awardTransferred} onChange={e => setF('awardTransferred', e.target.value)} /></Field>
            </div>
        </div>
    )
}

// ── Просмотр ─────────────────────────────────────────────────────────────

function ViewItem({ label, value }: { label: string; value?: string }) {
    return (
        <div className="mb-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-sm text-foreground mt-0.5">{value || <span className="text-muted-foreground/50">нд</span>}</p>
        </div>
    )
}

function HonoreeView({ h }: { h: Honoree }) {
    return (
        <div>
            <div className="mb-5 pb-5 border-b border-border overflow-x-auto">
                <div className="min-w-[520px]"><RankRailLabeled stageKey={currentStage(h)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4">
                <div>
                    <ViewItem label="Рег. номер" value={h.regNum} />
                    <ViewItem label="ФИО" value={`${h.surname} ${h.name} ${h.patronymic}`} />
                    <ViewItem label="Дата рождения" value={formatDate(h.dateBirth)} />
                    <ViewItem label="Табельный номер" value={h.staffNum} />
                </div>
                <div>
                    <ViewItem label="Должность" value={h.position} />
                    <ViewItem label="Подразделение" value={h.department} />
                    <ViewItem label="Направление деятельности" value={titleById(h.fieldId, FIELDS)} />
                </div>
                <div>
                    <ViewItem label="Номинация" value={titleById(h.awardId, NOMINATIONS)} />
                    <ViewItem label="Филиал" value={titleById(h.branchId, BRANCHES)} />
                </div>
                <div>
                    <ViewItem label="Дата направления руководству" value={formatDate(h.dateSendingMgmt)} />
                    <ViewItem label="Дата решения руководства" value={formatDate(h.dateResolutionMgmt)} />
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 pt-2 border-t border-border mt-2">
                <div>
                    <ViewItem label="Согласующее подразделение" value={titleById(h.authorityId, APPROVING_DEPTS)} />
                    <ViewItem label="Дата и № записки" value={h.dateNumDoc} />
                </div>
                <div>
                    <ViewItem label="Решение подразделения" value={titleById(h.decisionAuthorityId, APPROVAL_DECISIONS)} />
                    <ViewItem label="Дата и № решения" value={h.dateResolutionDecision} />
                </div>
                <div className="sm:col-span-2"><ViewItem label="Примечание" value={h.note} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 pt-2 border-t border-border mt-2">
                <div><ViewItem label="Дата заседания комиссии" value={formatDate(h.dateMeetingCouncil)} /></div>
                <div><ViewItem label="Решение комиссии" value={titleById(h.decisionCouncilAwardId, NOMINATIONS)} /></div>
                <div className="sm:col-span-2"><ViewItem label="Примечание комиссии" value={h.noteCouncil} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 pt-2 border-t border-border mt-2">
                <ViewItem label="Дата приказа" value={formatDate(h.dateOrder)} />
                <ViewItem label="Номер приказа" value={h.numOrder} />
                <ViewItem label="Сумма премии" value={formatMoney(h.sumBonus)} />
                <ViewItem label="Дата записки на выплату" value={formatDate(h.dateDocBonus)} />
            </div>
            <div className="pt-2 border-t border-border mt-2">
                <ViewItem label="Награда вручена" value={h.awardTransferred} />
            </div>
        </div>
    )
}
