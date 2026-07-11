import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
    ArrowLeft, Archive, Search, X, Star, Plus, Upload, BarChart3, Trash2,
    File as FileIconLucide, FolderTree, ChevronDown, ChevronUp, Layers,
} from 'lucide-react'
import {
    ArchiveSection, ArchiveFile, FileExt, INITIAL_SECTIONS, INITIAL_REPORTS,
    MONTH_NAMES, formatSize, formatDate, isFileNew, groupReportsByYear,
} from './data'
import { SECTION_ICONS, FileIcon, DotLeader, NewBadge, ViewToggle, Pagination, Dialog } from './ui'

const ITEMS_PER_PAGE = 9
const FAVORITES_KEY = 'docArchiveFavorites'
const VIEWED_KEY = 'docArchiveViewedFiles'
const VIEW_MODE_KEY = 'docArchiveViewMode'
const FRAUNCES = { fontFamily: "'Fraunces', Georgia, serif" }

const ACCENT = { '--archive-ink': '#8f3244', '--archive-ink-light': '#e7aab4', '--archive-brass': '#b8925a' } as React.CSSProperties

function loadSet(key: string, fallback: (string | number)[] = []): Set<any> {
    try {
        const saved = localStorage.getItem(key)
        return new Set(saved ? JSON.parse(saved) : fallback)
    } catch {
        return new Set(fallback)
    }
}

function useFraunces() {
    useEffect(() => {
        if (document.getElementById('font-fraunces')) return
        const link = document.createElement('link')
        link.id = 'font-fraunces'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Карточка файла (сетка) ───────────────────────────────────────────────

function FileGridCard({ file, sectionTag, onOpen, onDelete }: {
    file: ArchiveFile; sectionTag?: string; onOpen: (f: ArchiveFile) => void; onDelete: (f: ArchiveFile) => void
}) {
    const viewed = useViewed(file.id)
    const isNew = isFileNew(file.uploadDate) && !viewed
    return (
        <div className="group relative rounded-2xl border-t-2 bg-card p-4 hover:-translate-y-1 transition-all duration-200" style={{ borderColor: 'var(--archive-brass)' }}>
            <button onClick={() => onDelete(file)} className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 rounded" title="Удалить">
                <Trash2 size={13} />
            </button>
            <FileIcon extension={file.extension} box="w-9 h-9" size={16} />
            <button onClick={() => onOpen(file)} className="block text-xs text-left mt-3 hover:text-[var(--archive-ink)] dark:hover:text-[var(--archive-ink-light)] line-clamp-2 leading-tight font-medium text-foreground/90">
                {file.name}.{file.extension}
            </button>
            {sectionTag && <p className="text-[10px] text-muted-foreground mt-1">{sectionTag}</p>}
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-border">
                <span className="font-mono text-[10px] text-muted-foreground">{file.code}</span>
                <span className="text-[10px] text-muted-foreground">{formatSize(file.sizeKb)}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{formatDate(file.uploadDate)}</span>
                {isNew && <NewBadge />}
            </div>
        </div>
    )
}

// ── Строка файла (список, leader dots) ────────────────────────────────────

function FileRow({ file, sectionTag, onOpen, onDelete }: {
    file: ArchiveFile; sectionTag?: string; onOpen: (f: ArchiveFile) => void; onDelete: (f: ArchiveFile) => void
}) {
    const viewed = useViewed(file.id)
    const isNew = isFileNew(file.uploadDate) && !viewed
    return (
        <div className="group flex items-center gap-3 rounded-xl border-t-2 bg-card px-3 py-2.5 hover:shadow-sm transition-all" style={{ borderColor: 'rgba(184,146,90,0.35)' }}>
            <FileIcon extension={file.extension} />
            <button onClick={() => onOpen(file)} className="text-xs font-medium text-left hover:text-[var(--archive-ink)] dark:hover:text-[var(--archive-ink-light)] truncate flex-shrink-0 max-w-[40%]">
                {file.name}.{file.extension}
            </button>
            {sectionTag && <span className="text-[10px] text-muted-foreground hidden sm:inline flex-shrink-0">{sectionTag}</span>}
            <DotLeader />
            <span className="font-mono text-[10px] text-muted-foreground flex-shrink-0 hidden sm:inline">{file.code}</span>
            <span className="text-[11px] text-muted-foreground flex-shrink-0 w-16 text-right">{formatDate(file.uploadDate)}</span>
            <span className="text-[11px] text-muted-foreground flex-shrink-0 w-14 text-right hidden sm:inline">{formatSize(file.sizeKb)}</span>
            {isNew && <NewBadge />}
            <button onClick={() => onDelete(file)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 rounded flex-shrink-0" title="Удалить">
                <Trash2 size={13} />
            </button>
        </div>
    )
}

// ── Хук просмотренных файлов ───────────────────────────────────────────────

let viewedCache: Set<number> | null = null
function getViewed(): Set<number> {
    if (!viewedCache) viewedCache = loadSet(VIEWED_KEY)
    return viewedCache
}
function markViewed(id: number) {
    getViewed().add(id)
    localStorage.setItem(VIEWED_KEY, JSON.stringify(Array.from(getViewed())))
}
function useViewed(id: number) {
    return getViewed().has(id)
}

// ── Дерево отчётов Год → Месяц ────────────────────────────────────────────

function ReportsTree({ reportsByYear, onOpen }: { reportsByYear: Record<number, Record<number, typeof INITIAL_REPORTS>>; onOpen: () => void }) {
    const years = Object.keys(reportsByYear).map(Number).sort((a, b) => b - a)
    const [openYears, setOpenYears] = useState<Set<number>>(() => new Set(years.length ? [years[0]] : []))
    const [openMonths, setOpenMonths] = useState<Set<string>>(() => {
        if (!years.length) return new Set()
        const months = Object.keys(reportsByYear[years[0]]).map(Number).sort((a, b) => b - a)
        return new Set(months.length ? [`${years[0]}-${months[0]}`] : [])
    })

    const toggleYear = (y: number) => setOpenYears(prev => { const n = new Set(prev); n.has(y) ? n.delete(y) : n.add(y); return n })
    const toggleMonth = (k: string) => setOpenMonths(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n })

    return (
        <div className="space-y-2">
            {years.map(year => {
                const months = Object.keys(reportsByYear[year]).map(Number).sort((a, b) => b - a)
                const total = months.reduce((s, m) => s + reportsByYear[year][m].length, 0)
                const isOpen = openYears.has(year)
                return (
                    <div key={year} className="rounded-2xl border-t-2 bg-card overflow-hidden" style={{ borderColor: 'var(--archive-brass)' }}>
                        <button onClick={() => toggleYear(year)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors">
                            <div className="flex items-center gap-2">
                                <FolderTree size={15} style={{ color: 'var(--archive-brass)' }} />
                                <span className="font-semibold text-sm" style={FRAUNCES}>{year}</span>
                                <span className="text-xs text-muted-foreground">({total} файлов)</span>
                            </div>
                            {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                        </button>
                        {isOpen && (
                            <div className="px-3 pb-3 space-y-2">
                                {months.map(month => {
                                    const key = `${year}-${month}`
                                    const isMonthOpen = openMonths.has(key)
                                    const files = reportsByYear[year][month]
                                    return (
                                        <div key={month} className="rounded-xl border border-border overflow-hidden">
                                            <button onClick={() => toggleMonth(key)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-foreground/5 transition-colors">
                                                <span className="text-xs font-medium text-foreground">{MONTH_NAMES[month - 1]}</span>
                                                <span className="text-[11px] text-muted-foreground">{files.length} файлов {isMonthOpen ? '▲' : '▼'}</span>
                                            </button>
                                            {isMonthOpen && (
                                                <div className="p-2 space-y-1.5">
                                                    {files.map(r => (
                                                        <button
                                                            key={r.id}
                                                            onClick={onOpen}
                                                            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-foreground/5 transition-colors text-left"
                                                        >
                                                            <FileIconLucide size={12} style={{ color: 'var(--archive-brass)' }} className="flex-shrink-0" />
                                                            <span className="text-xs text-foreground/85 truncate flex-shrink-0 max-w-[45%]">{r.name}</span>
                                                            <DotLeader />
                                                            <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(r.date)}</span>
                                                            <span className="text-[11px] text-muted-foreground flex-shrink-0 w-14 text-right hidden sm:inline">{formatSize(r.sizeKb)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Основной компонент ─────────────────────────────────────────────────────

export default function DocumentArchive() {
    useFraunces()

    const [sections, setSections] = useState<ArchiveSection[]>(INITIAL_SECTIONS)
    const [favorites, setFavorites] = useState<Set<string>>(() => loadSet(FAVORITES_KEY, ['regulations', 'technical']))
    const [onlyFavorites, setOnlyFavorites] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('regulations')
    const [searchTerm, setSearchTerm] = useState('')
    const [viewMode, setViewModeState] = useState<'cards' | 'list'>(() => localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'cards')
    const [page, setPage] = useState(1)
    const [, forceRerender] = useState(0)

    const [statsOpen, setStatsOpen] = useState(false)
    const [addSectionOpen, setAddSectionOpen] = useState(false)
    const [addFileOpen, setAddFileOpen] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ArchiveFile | null>(null)
    const [sectionName, setSectionName] = useState('')
    const [uploadForm, setUploadForm] = useState<{ sectionId: string; name: string; file: File | null }>({ sectionId: '', name: '', file: null })

    const setViewMode = (m: 'cards' | 'list') => { setViewModeState(m); localStorage.setItem(VIEW_MODE_KEY, m) }

    const toggleFavorite = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setFavorites(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(next)))
            return next
        })
    }

    const reportsByYear = useMemo(() => groupReportsByYear(INITIAL_REPORTS), [])

    const visibleSections = onlyFavorites ? sections.filter(s => favorites.has(s.id)) : sections
    const activeSection = sections.find(s => s.id === activeTab)

    useEffect(() => { setPage(1) }, [activeTab, searchTerm])

    const searchResults = useMemo(() => {
        if (!searchTerm.trim() || activeTab === 'reports') return null
        const term = searchTerm.toLowerCase()
        const results: { section: ArchiveSection; files: ArchiveFile[] }[] = []
        sections.forEach(section => {
            const matched = section.files.filter(f => f.name.toLowerCase().includes(term) || f.code.toLowerCase().includes(term))
            if (matched.length) results.push({ section, files: matched })
        })
        return results
    }, [searchTerm, sections, activeTab])

    const filteredFiles: { file: ArchiveFile; sectionTag?: string }[] = searchResults
        ? searchResults.flatMap(r => r.files.map(f => ({ file: f, sectionTag: r.section.name })))
        : (activeSection?.files ?? []).map(f => ({ file: f }))

    const totalPages = Math.max(1, Math.ceil(filteredFiles.length / ITEMS_PER_PAGE))
    const paginated = filteredFiles.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

    const filteredReports = useMemo(() => {
        if (!searchTerm.trim()) return null
        const term = searchTerm.toLowerCase()
        return INITIAL_REPORTS.filter(r => r.name.toLowerCase().includes(term) || String(r.year).includes(term))
    }, [searchTerm])

    const handleOpen = (file: ArchiveFile) => {
        markViewed(file.id)
        forceRerender(x => x + 1)
        window.open(file.url || '#', '_blank', 'noopener,noreferrer')
    }

    const nextFileId = useMemo(() => Math.max(0, ...sections.flatMap(s => s.files.map(f => f.id))) + 1, [sections])

    const handleAddSection = () => {
        const name = sectionName.trim()
        if (!name) return
        if (sections.some(s => s.name.toLowerCase() === name.toLowerCase())) return
        const id = `custom-${Date.now()}`
        setSections(prev => [...prev, { id, name, description: 'Пользовательский раздел', icon: 'scroll', prefix: 'НР', files: [] }])
        setFavorites(prev => new Set(prev).add(id))
        setActiveTab(id)
        setSectionName('')
        setAddSectionOpen(false)
    }

    const handleUploadFile = () => {
        if (!uploadForm.sectionId || !uploadForm.file || !uploadForm.name.trim()) return
        const file = uploadForm.file
        const ext = (file.name.split('.').pop()?.toLowerCase() || 'pdf') as FileExt
        const section = sections.find(s => s.id === uploadForm.sectionId)
        const code = `${section?.prefix ?? 'НР'}-${String((section?.files.length ?? 0) + 1).padStart(3, '0')}`
        const newFile: ArchiveFile = {
            id: nextFileId,
            name: uploadForm.name.trim(),
            extension: (['pdf', 'docx', 'xlsx', 'pptx'] as FileExt[]).includes(ext) ? ext : 'pdf',
            sizeKb: Math.max(1, Math.round(file.size / 1024)),
            uploadDate: new Date().toISOString().slice(0, 10),
            code,
            url: URL.createObjectURL(file),
        }
        setSections(prev => prev.map(s => s.id === uploadForm.sectionId ? { ...s, files: [newFile, ...s.files] } : s))
        setActiveTab(uploadForm.sectionId)
        setUploadForm({ sectionId: '', name: '', file: null })
        setAddFileOpen(false)
    }

    const handleConfirmDelete = () => {
        if (!deleteTarget) return
        setSections(prev => prev.map(s => ({ ...s, files: s.files.filter(f => f.id !== deleteTarget.id) })))
        setDeleteTarget(null)
    }

    const stats = useMemo(() => sections.map(s => ({
        name: s.name,
        count: s.files.length,
        sizeKb: s.files.reduce((sum, f) => sum + f.sizeKb, 0),
    })), [sections])
    const maxCount = Math.max(1, ...stats.map(s => s.count))

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>

            {/* ── Hero: читальный зал ── */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #1a0e10 0%, #2b1216 45%, #170b0d 100%)' }}>
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(184,146,90,0.06) 28px)' }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-16 select-none opacity-[0.07] leading-none"
                    style={{ ...FRAUNCES, fontSize: '340px', color: '#e7aab4' }}
                >
                    §
                </div>

                <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
                    <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                        <ArrowLeft size={13} /> Все примеры
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-xl">
                        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#e7aab4]">
                            <Archive size={13} /> Архив документов · база знаний
                        </span>
                        <h1 className="mt-3 text-4xl md:text-5xl font-semibold leading-tight text-white" style={FRAUNCES}>
                            Архив документов
                        </h1>
                        <div className="mt-3 h-px w-16" style={{ background: 'var(--archive-brass)' }} />
                        <p className="mt-4 text-sm leading-relaxed text-white/60">
                            Регламенты, шаблоны и справочные материалы компании — в одном каталоге,
                            разложенном по разделам, как в читальном зале.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                        className="flex flex-wrap gap-2 mt-7"
                    >
                        <button onClick={() => setStatsOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
                            <BarChart3 size={13} /> Статистика
                        </button>
                        <button
                            onClick={() => setOnlyFavorites(v => !v)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium backdrop-blur transition-colors ${onlyFavorites ? 'bg-[var(--archive-brass)] text-[#1a0e10]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Star size={13} className={onlyFavorites ? 'fill-current' : ''} /> Только избранное
                        </button>
                        <button onClick={() => setAddSectionOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
                            <Plus size={13} /> Раздел
                        </button>
                        <button
                            onClick={() => { setUploadForm(f => ({ ...f, sectionId: activeSection?.id ?? sections[0]?.id ?? '' })); setAddFileOpen(true) }}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                            style={{ background: 'var(--archive-brass)', color: '#1a0e10' }}
                        >
                            <Upload size={13} /> Файл
                        </button>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">

                {/* ── Поиск ── */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Поиск по названию или шифру документа..."
                        className="w-full rounded-xl border border-border bg-card py-2.5 pl-11 pr-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1"
                        style={{ '--tw-ring-color': 'var(--archive-ink)' } as React.CSSProperties}
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* ── Вкладки разделов ── */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                    <button
                        onClick={() => { setActiveTab('reports'); setSearchTerm('') }}
                        className={`flex items-center gap-2 rounded-lg border-t-2 px-3 py-1.5 transition-all ${
                            activeTab === 'reports' ? 'text-white shadow-sm' : 'border-transparent bg-card hover:opacity-80'
                        }`}
                        style={activeTab === 'reports' ? { borderColor: 'var(--archive-brass)', background: 'var(--archive-ink)' } : { borderColor: 'transparent' }}
                    >
                        <FileIconLucide className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'reports' ? 'text-[var(--archive-brass)]' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-medium">Отчёты</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'reports' ? 'bg-white/15 text-white' : 'bg-foreground/8 text-muted-foreground'}`}>
                            {INITIAL_REPORTS.length}
                        </span>
                    </button>

                    {visibleSections.map(section => {
                        const Icon = SECTION_ICONS[section.icon]
                        const active = activeTab === section.id && !searchTerm
                        const fav = favorites.has(section.id)
                        return (
                            <button
                                key={section.id}
                                onClick={() => { setActiveTab(section.id); setSearchTerm('') }}
                                title={section.name}
                                className="group flex items-center gap-2 rounded-lg border-t-2 px-3 py-1.5 transition-all"
                                style={active ? { borderColor: 'var(--archive-brass)', background: 'var(--archive-ink)', color: '#fff' } : { borderColor: 'transparent' }}
                            >
                                <Icon size={14} className={active ? 'text-[var(--archive-brass)] flex-shrink-0' : 'text-muted-foreground flex-shrink-0'} />
                                <span className={`text-xs font-medium truncate max-w-[140px] ${active ? '' : 'text-foreground'}`}>{section.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${active ? 'bg-white/15 text-white' : 'bg-foreground/8 text-muted-foreground'}`}>
                                    {section.files.length}
                                </span>
                                <span
                                    onClick={(e) => toggleFavorite(section.id, e)}
                                    className="flex-shrink-0 cursor-pointer"
                                    title={fav ? 'Убрать из избранного' : 'В избранное'}
                                >
                                    <Star size={11} className={fav ? 'fill-amber-400 text-amber-400' : active ? 'text-white/40' : 'text-muted-foreground/40'} />
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* ── Контент ── */}
                {activeTab === 'reports' ? (
                    <div>
                        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                            <FileIconLucide size={15} style={{ color: 'var(--archive-brass)' }} />
                            <h2 className="font-semibold text-sm text-foreground" style={FRAUNCES}>Отчёты</h2>
                            <span className="text-xs text-muted-foreground">({INITIAL_REPORTS.length} файлов)</span>
                        </div>
                        {filteredReports ? (
                            filteredReports.length ? (
                                <div className="space-y-1.5">
                                    {filteredReports.map(r => (
                                        <button
                                            key={r.id}
                                            onClick={() => window.open('#', '_blank')}
                                            className="w-full flex items-center gap-2 rounded-xl border-t-2 bg-card px-3 py-2.5 hover:shadow-sm transition-all text-left"
                                            style={{ borderColor: 'rgba(184,146,90,0.35)' }}
                                        >
                                            <FileIconLucide size={14} style={{ color: 'var(--archive-brass)' }} className="flex-shrink-0" />
                                            <span className="text-xs text-foreground/85 truncate flex-shrink-0 max-w-[40%]">{r.name}</span>
                                            <DotLeader />
                                            <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatDate(r.date)}</span>
                                            <span className="text-[11px] text-muted-foreground flex-shrink-0 w-14 text-right hidden sm:inline">{formatSize(r.sizeKb)}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="Отчёты не найдены" />
                            )
                        ) : (
                            <ReportsTree reportsByYear={reportsByYear} onOpen={() => window.open('#', '_blank')} />
                        )}
                    </div>
                ) : (
                    <>
                        {(activeSection || searchResults) && (
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    {searchResults ? (
                                        <>
                                            <Search size={15} style={{ color: 'var(--archive-brass)' }} className="flex-shrink-0" />
                                            <h2 className="font-semibold text-sm text-foreground truncate" style={FRAUNCES}>Результаты поиска: {filteredFiles.length}</h2>
                                        </>
                                    ) : activeSection ? (
                                        <>
                                            {(() => { const Icon = SECTION_ICONS[activeSection.icon]; return <Icon size={15} style={{ color: 'var(--archive-brass)' }} className="flex-shrink-0" /> })()}
                                            <div className="min-w-0">
                                                <h2 className="font-semibold text-sm text-foreground truncate" style={FRAUNCES}>{activeSection.name}</h2>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                                {filteredFiles.length > 0 && <ViewToggle mode={viewMode} onChange={setViewMode} />}
                            </div>
                        )}

                        {filteredFiles.length === 0 ? (
                            <EmptyState text={searchTerm ? 'Файлы не найдены' : 'В этом разделе пока нет файлов'} />
                        ) : (
                            <>
                                {viewMode === 'cards' ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <AnimatePresence mode="popLayout">
                                            {paginated.map(({ file, sectionTag }) => (
                                                <motion.div key={file.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                                                    <FileGridCard file={file} sectionTag={sectionTag} onOpen={handleOpen} onDelete={setDeleteTarget} />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <AnimatePresence mode="popLayout">
                                            {paginated.map(({ file, sectionTag }) => (
                                                <motion.div key={file.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                    <FileRow file={file} sectionTag={sectionTag} onOpen={handleOpen} onDelete={setDeleteTarget} />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                                <p className="text-center text-xs text-muted-foreground mt-3">
                                    Показано {paginated.length} из {filteredFiles.length} файлов
                                </p>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* ── Модалка: статистика ── */}
            <Dialog open={statsOpen} title="Статистика по разделам" onClose={() => setStatsOpen(false)}>
                <div className="space-y-3">
                    {stats.map(s => (
                        <div key={s.name}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-foreground/80 truncate pr-2">{s.name}</span>
                                <span className="text-muted-foreground flex-shrink-0">{s.count} · {formatSize(s.sizeKb)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-foreground/8 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(s.count / maxCount) * 100}%`, background: 'var(--archive-ink)' }} />
                            </div>
                        </div>
                    ))}
                </div>
            </Dialog>

            {/* ── Модалка: новый раздел ── */}
            <Dialog open={addSectionOpen} title="Новый раздел" onClose={() => setAddSectionOpen(false)}>
                <label className="block text-xs text-muted-foreground mb-1">Название раздела</label>
                <input
                    autoFocus
                    value={sectionName}
                    onChange={e => setSectionName(e.target.value)}
                    placeholder="Например, Юридические заключения"
                    className="w-full px-3 py-2 rounded-xl bg-foreground/5 border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                />
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setAddSectionOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleAddSection} className="flex-1 px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors" style={{ background: 'var(--archive-ink)' }}>
                        Создать
                    </button>
                </div>
            </Dialog>

            {/* ── Модалка: загрузка файла ── */}
            <Dialog open={addFileOpen} title="Загрузить файл" onClose={() => setAddFileOpen(false)}>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Раздел</label>
                        <select
                            value={uploadForm.sectionId}
                            onChange={e => setUploadForm(f => ({ ...f, sectionId: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl bg-foreground/5 border border-border text-sm text-foreground appearance-none cursor-pointer focus:outline-none"
                        >
                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Название документа</label>
                        <input
                            value={uploadForm.name}
                            onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Например, Инструкция по охране труда"
                            className="w-full px-3 py-2 rounded-xl bg-foreground/5 border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Файл</label>
                        <input
                            type="file"
                            onChange={e => setUploadForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))}
                            className="w-full text-xs text-muted-foreground file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-medium file:text-white file:bg-[var(--archive-ink)]"
                        />
                    </div>
                </div>
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setAddFileOpen(false)} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleUploadFile} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors" style={{ background: 'var(--archive-brass)', color: '#1a0e10' }}>
                        Загрузить
                    </button>
                </div>
            </Dialog>

            {/* ── Модалка: удаление файла ── */}
            <Dialog open={!!deleteTarget} title="Удалить файл?" onClose={() => setDeleteTarget(null)}>
                <p className="text-muted-foreground text-sm mb-1">Это действие нельзя отменить. Удалить документ:</p>
                <p className="font-semibold text-foreground text-sm mb-6">{deleteTarget?.name}.{deleteTarget?.extension}</p>
                <div className="flex gap-2">
                    <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleConfirmDelete} className="flex-1 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-medium transition-colors">
                        Удалить
                    </button>
                </div>
            </Dialog>
        </div>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="text-center py-14 rounded-2xl border-t-2 bg-card" style={{ borderColor: 'var(--archive-brass)' }}>
            <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-xs">{text}</p>
        </div>
    )
}
