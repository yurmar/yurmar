import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, X, FileDown, BrushCleaning, FileSpreadsheet, Award } from 'lucide-react'
import { HonorNav } from './HonorNav'
import {
    Honoree, INITIAL_HONOREES, NOMINATIONS, FIELDS, BRANCHES, APPROVING_DEPTS, APPROVAL_DECISIONS,
    titleById, formatDate, formatMoney,
} from './data'
import { ACCENT, SPACE_GROTESK, useSpaceGrotesk, printRows, exportRowsToExcel } from './ui'

const CURRENT_YEAR = 2026

type EnrichedRow = Honoree & {
    award: string; field: string; branch: string; authority: string
    decisionAuthority: string; decisionCouncil: string
    dateOrderFmt: string; dateMeetingCouncilFmt: string; dateDocBonusFmt: string
    sumBonusFmt: string
}

type ColDef = { header: string; accessor: keyof EnrichedRow }

type FilterDef = {
    id: string
    title: string
    columns: ColDef[]
    filterFn: (row: EnrichedRow) => boolean
    showDatePicker?: boolean
}

const FIO_KEYS: (keyof EnrichedRow)[] = ['surname', 'name', 'patronymic']

function enrich(h: Honoree): EnrichedRow {
    return {
        ...h,
        award: titleById(h.awardId, NOMINATIONS),
        field: titleById(h.fieldId, FIELDS),
        branch: titleById(h.branchId, BRANCHES),
        authority: titleById(h.authorityId, APPROVING_DEPTS),
        decisionAuthority: titleById(h.decisionAuthorityId, APPROVAL_DECISIONS),
        decisionCouncil: titleById(h.decisionCouncilAwardId, NOMINATIONS),
        dateOrderFmt: formatDate(h.dateOrder),
        dateMeetingCouncilFmt: formatDate(h.dateMeetingCouncil),
        dateDocBonusFmt: formatDate(h.dateDocBonus),
        sumBonusFmt: formatMoney(h.sumBonus),
    }
}

type ExportColumn = { header: string; build: (row: EnrichedRow) => string }

function buildExportColumns(columns: ColDef[]): ExportColumn[] {
    const hasFio = FIO_KEYS.every(k => columns.some(c => c.accessor === k))
    if (!hasFio) return columns.map(c => ({ header: c.header, build: (row: EnrichedRow) => String(row[c.accessor] ?? '') }))
    return columns.reduce<ExportColumn[]>((acc, c) => {
        if (FIO_KEYS.includes(c.accessor)) {
            if (!acc.some(x => x.header === 'ФИО')) {
                acc.push({ header: 'ФИО', build: (row: EnrichedRow) => [row.surname, row.name, row.patronymic].filter(Boolean).join(' ') })
            }
            return acc
        }
        acc.push({ header: c.header, build: (row: EnrichedRow) => String(row[c.accessor] ?? '') })
        return acc
    }, [])
}

const normalizeDate = (d: string): string => (d.includes('.') ? `${d.slice(6)}-${d.slice(3, 5)}-${d.slice(0, 2)}` : d.slice(0, 10))

const paymentCols: ColDef[] = [
    { header: 'Фамилия', accessor: 'surname' },
    { header: 'Имя', accessor: 'name' },
    { header: 'Отчество', accessor: 'patronymic' },
    { header: 'Решение комиссии', accessor: 'decisionCouncil' },
    { header: 'Номер приказа', accessor: 'numOrder' },
    { header: 'Дата приказа', accessor: 'dateOrderFmt' },
    { header: 'Сумма премии', accessor: 'sumBonusFmt' },
    { header: 'Дата записки на выплату', accessor: 'dateDocBonusFmt' },
    { header: 'Номер записки на выплату', accessor: 'numDocBonus' },
]

const makePaymentFilter = (keyword: string) => (row: EnrichedRow) =>
    row.year === CURRENT_YEAR && row.decisionCouncil.toLowerCase().includes(keyword.toLowerCase())

export default function HallOfHonorFilters() {
    useSpaceGrotesk()

    const [activeFilterId, setActiveFilterId] = useState<string | null>(null)
    const [councilDate, setCouncilDate] = useState('')
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
    const [sortColumn, setSortColumn] = useState<keyof EnrichedRow | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const rows: EnrichedRow[] = INITIAL_HONOREES.map(enrich)

    const filterDefs: FilterDef[] = [
        {
            id: 'payment_1',
            title: `На выплату (${CURRENT_YEAR}) — «Лучший сотрудник года»`,
            columns: paymentCols,
            filterFn: makePaymentFilter('лучший сотрудник'),
        },
        {
            id: 'payment_2',
            title: `На выплату (${CURRENT_YEAR}) — «Наставник года»`,
            columns: paymentCols,
            filterFn: makePaymentFilter('наставник'),
        },
        {
            id: 'payment_3',
            title: `На выплату (${CURRENT_YEAR}) — «Инновация года»`,
            columns: paymentCols,
            filterFn: makePaymentFilter('инновация'),
        },
        {
            id: 'payment_4',
            title: `На выплату (${CURRENT_YEAR}) — «Клиентский сервис года»`,
            columns: paymentCols,
            filterFn: makePaymentFilter('клиентский сервис'),
        },
        {
            id: 'approval',
            title: `Материалы на согласовании (${CURRENT_YEAR})`,
            columns: [
                { header: 'Фамилия', accessor: 'surname' },
                { header: 'Имя', accessor: 'name' },
                { header: 'Отчество', accessor: 'patronymic' },
                { header: 'Должность', accessor: 'position' },
                { header: 'Подразделение', accessor: 'department' },
                { header: 'Номинация', accessor: 'award' },
                { header: 'Согласующее подразделение', accessor: 'authority' },
                { header: 'Дата и № записки', accessor: 'dateNumDoc' },
                { header: 'Решение подразделения', accessor: 'decisionAuthority' },
                { header: 'Дата и № решения', accessor: 'dateResolutionDecision' },
            ],
            filterFn: row => row.year === CURRENT_YEAR && !!row.authority && !row.decisionCouncilAwardId,
        },
        {
            id: 'awarded',
            title: `Награждены в ${CURRENT_YEAR} году`,
            columns: [
                { header: 'Фамилия', accessor: 'surname' },
                { header: 'Имя', accessor: 'name' },
                { header: 'Отчество', accessor: 'patronymic' },
                { header: 'Должность', accessor: 'position' },
                { header: 'Подразделение', accessor: 'department' },
                { header: 'Номинация', accessor: 'decisionCouncil' },
                { header: 'Номер приказа', accessor: 'numOrder' },
                { header: 'Дата приказа', accessor: 'dateOrderFmt' },
                { header: 'Награда передана', accessor: 'awardTransferred' },
            ],
            filterFn: row => row.year === CURRENT_YEAR && !!row.numOrder,
        },
        {
            id: 'council',
            title: `Заседание комиссии по наградам (${CURRENT_YEAR})`,
            columns: [
                { header: 'Фамилия', accessor: 'surname' },
                { header: 'Имя', accessor: 'name' },
                { header: 'Отчество', accessor: 'patronymic' },
                { header: 'Должность', accessor: 'position' },
                { header: 'Подразделение', accessor: 'department' },
                { header: 'Номинация', accessor: 'award' },
                { header: 'Направление деятельности', accessor: 'field' },
                { header: 'Дата заседания комиссии', accessor: 'dateMeetingCouncilFmt' },
                { header: 'Решение комиссии', accessor: 'decisionCouncil' },
            ],
            filterFn: row => {
                if (row.year !== CURRENT_YEAR || !row.dateMeetingCouncil) return false
                if (councilDate && normalizeDate(row.dateMeetingCouncil) !== councilDate) return false
                return true
            },
            showDatePicker: true,
        },
    ]

    const activeFilter = filterDefs.find(f => f.id === activeFilterId) ?? null
    const filteredRows = activeFilter ? rows.filter(activeFilter.filterFn) : []
    const filteredDisplayRows = filteredRows.filter(row =>
        Object.entries(columnFilters).every(([key, value]) => {
            if (!value) return true
            return String(row[key as keyof EnrichedRow] ?? '').toLowerCase().includes(value.toLowerCase())
        })
    )
    const displayRows = sortColumn
        ? [...filteredDisplayRows].sort((a, b) => {
            const av = String(a[sortColumn] ?? ''); const bv = String(b[sortColumn] ?? '')
            return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
        })
        : filteredDisplayRows

    const openFilter = (id: string) => {
        setCouncilDate(''); setColumnFilters({}); setSortColumn(null); setSortDirection('asc')
        setActiveFilterId(id)
    }

    const buildTable = () => {
        if (!activeFilter) return { headers: [], rows: [] as string[][] }
        const exportColumns = buildExportColumns(activeFilter.columns)
        return {
            headers: exportColumns.map(c => c.header),
            rows: displayRows.map(row => exportColumns.map(c => c.build(row))),
        }
    }

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2b2c 0%, #0f3d3e 55%, #0a2426 100%)' }}>
                <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                    <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                        <ArrowLeft size={13} /> Все примеры
                    </Link>
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#ff8f74]">
                            <Award size={13} /> Доска почёта · печатные списки
                        </span>
                        <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight text-white" style={SPACE_GROTESK}>Фильтры</h1>
                        <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">
                            Готовые печатные подборки для делопроизводства: выплаты, согласования, заседания комиссии.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <HonorNav />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filterDefs.map(f => {
                        const count = rows.filter(f.filterFn).length
                        return (
                            <button
                                key={f.id}
                                onClick={() => openFilter(f.id)}
                                className="relative px-4 py-3 pb-6 rounded-xl text-left text-sm font-medium text-white transition-transform hover:-translate-y-0.5 leading-snug"
                                style={{ background: 'var(--honor-ink)' }}
                            >
                                {f.title}
                                <span className="absolute bottom-2 right-3 text-[11px] opacity-70 font-mono">{count}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {activeFilter && (
                <div className="fixed inset-0 z-[300] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-6 px-4">
                    <div className="relative w-full max-w-6xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                            <h2 className="text-base font-semibold text-foreground pr-4 leading-snug">{activeFilter.title}</h2>
                            <button onClick={() => setActiveFilterId(null)} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="px-6 py-4 overflow-y-auto">
                            {activeFilter.showDatePicker && (
                                <div className="mb-4 flex items-center gap-3 flex-wrap">
                                    <label className="text-xs text-muted-foreground">Дата заседания:</label>
                                    <input type="date" value={councilDate} onChange={e => setCouncilDate(e.target.value)}
                                        className="px-2 py-1 rounded-md bg-foreground/5 border border-border text-sm text-foreground" />
                                    {councilDate && (
                                        <button onClick={() => setCouncilDate('')} className="text-xs text-muted-foreground underline">Сбросить</button>
                                    )}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground mb-2">Записей: {displayRows.length}</div>
                            <div className="overflow-x-auto rounded-xl border border-border">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                                            {activeFilter.columns.map(col => (
                                                <th key={String(col.accessor)} onClick={() => {
                                                    if (sortColumn === col.accessor) setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
                                                    else { setSortColumn(col.accessor); setSortDirection('asc') }
                                                }} className="cursor-pointer px-3 py-2 text-left whitespace-nowrap select-none hover:text-foreground transition-colors">
                                                    {col.header}{sortColumn === col.accessor && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                                                </th>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-border">
                                            {activeFilter.columns.map(col => (
                                                <th key={String(col.accessor)} className="px-2 py-1.5">
                                                    <input type="text" value={columnFilters[col.accessor as string] || ''}
                                                        onChange={e => setColumnFilters(prev => ({ ...prev, [col.accessor]: e.target.value }))}
                                                        className="w-full text-xs px-2 py-1 rounded-md bg-foreground/5 border border-border text-foreground focus:outline-none" />
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {displayRows.length === 0 ? (
                                            <tr><td colSpan={activeFilter.columns.length} className="px-3 py-8 text-center text-muted-foreground text-sm">Нет данных</td></tr>
                                        ) : displayRows.map((row, i) => (
                                            <tr key={i} className="hover:bg-foreground/5 transition-colors">
                                                {activeFilter.columns.map(col => {
                                                    const val = String(row[col.accessor] ?? '')
                                                    return <td key={String(col.accessor)} className="px-3 py-2 text-[12px] text-foreground/85">{val || <span className="text-muted-foreground/50">нд</span>}</td>
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-6 py-4 border-t border-border flex-shrink-0 flex-wrap">
                            <button onClick={() => setActiveFilterId(null)} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">Закрыть</button>
                            <button onClick={() => setColumnFilters({})} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors flex items-center gap-2">
                                <BrushCleaning size={14} /> Сбросить фильтры
                            </button>
                            <button onClick={() => { const t = buildTable(); printRows(activeFilter.title, t.headers, t.rows) }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors flex items-center gap-2">
                                <FileDown size={14} /> Скачать PDF
                            </button>
                            <button onClick={() => { const t = buildTable(); exportRowsToExcel(activeFilter.title, t.headers, t.rows) }}
                                className="px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 ml-auto" style={{ background: 'var(--honor-coral)' }}>
                                <FileSpreadsheet size={14} /> Экспорт в Excel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
