import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BookOpen, Loader2, Plus, Search, X } from 'lucide-react'
import { RootState } from '@/store'
import {
    apiCreateNotebookProject,
    apiDeleteNotebookProject,
    apiGetNotebookProjects,
    apiUpdateNotebookProject,
    NotebookProject,
    ProjectStatus,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProjectCard from '@/components/notebook/ProjectCard'
import ProjectEditor from '@/components/notebook/ProjectEditor'
import { PROJECT_UNTITLED, STATUS_OPTIONS, priorityMeta } from '@/components/notebook/projectMeta'

type SortKey = 'updated' | 'deadline' | 'priority'

interface Filters {
    search: string
    status: ProjectStatus | 'all'
    sort: SortKey
}

const FILTERS_KEY = 'notebook_projects_filters'
const DEFAULT_FILTERS: Filters = { search: '', status: 'all', sort: 'updated' }

function loadFilters(): Filters {
    try {
        const raw = sessionStorage.getItem(FILTERS_KEY)
        return raw ? { ...DEFAULT_FILTERS, ...JSON.parse(raw) } : DEFAULT_FILTERS
    } catch {
        return DEFAULT_FILTERS
    }
}

export default function NotebookProjects({ switcher }: { switcher: ReactNode }) {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)
    const [params, setParams] = useSearchParams()

    const [projects, setProjects] = useState<NotebookProject[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [creating, setCreating] = useState(false)
    const [justCreatedId, setJustCreatedId] = useState<number | null>(null)
    const [filters, setFilters] = useState<Filters>(loadFilters)
    const [toDelete, setToDelete] = useState<NotebookProject | null>(null)
    const [deleting, setDeleting] = useState(false)

    const selectedId = Number(params.get('project')) || null
    const selected = useMemo(() => projects.find(p => p.id === selectedId) ?? null, [projects, selectedId])

    const select = (id: number | null) =>
        setParams(id ? { tab: 'projects', project: String(id) } : { tab: 'projects' }, { replace: true })

    const load = () => {
        setLoading(true)
        setLoadError(false)
        apiGetNotebookProjects()
            .then(r => setProjects(r.data))
            .catch(() => setLoadError(true))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        if (isAuth) load()
    }, [isAuth])

    useEffect(() => {
        try {
            sessionStorage.setItem(FILTERS_KEY, JSON.stringify(filters))
        } catch { /* sessionStorage недоступен — фильтры просто не запоминаются */ }
    }, [filters])

    const visible = useMemo(() => {
        const q = filters.search.trim().toLowerCase()
        const list = projects.filter(p => {
            if (filters.status !== 'all' && p.status !== filters.status) return false
            if (!q) return true
            return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
        })
        const byUpdated = (a: NotebookProject, b: NotebookProject) => b.updated_at.localeCompare(a.updated_at)
        return [...list].sort((a, b) => {
            if (filters.sort === 'deadline') {
                if (!a.deadline && !b.deadline) return byUpdated(a, b)
                if (!a.deadline) return 1
                if (!b.deadline) return -1
                return a.deadline.localeCompare(b.deadline)
            }
            if (filters.sort === 'priority') {
                const d = priorityMeta(b.priority).rank - priorityMeta(a.priority).rank
                return d !== 0 ? d : byUpdated(a, b)
            }
            return byUpdated(a, b)
        })
    }, [projects, filters])

    const pinned = visible.filter(p => p.is_pinned)
    const rest = visible.filter(p => !p.is_pinned)

    const handleCreate = async () => {
        setCreating(true)
        try {
            const r = await apiCreateNotebookProject()
            setProjects(prev => [r.data, ...prev])
            setJustCreatedId(r.data.id)
            select(r.data.id)
        } catch {
            setLoadError(true)
        } finally {
            setCreating(false)
        }
    }

    const handleSaved = (saved: NotebookProject) =>
        setProjects(prev => prev.map(p => (p.id === saved.id ? { ...p, ...saved } : p)))

    const handleCounts = (id: number, counts: { tasks_count?: number; done_tasks_count?: number; links_count?: number; files_count?: number; notes_count?: number }) =>
        setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...counts } : p)))

    const handleTogglePin = async (p: NotebookProject) => {
        try {
            const r = await apiUpdateNotebookProject(p.id, { is_pinned: !p.is_pinned })
            handleSaved(r.data)
        } catch { /* состояние не меняем */ }
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await apiDeleteNotebookProject(toDelete.id)
            setProjects(prev => prev.filter(p => p.id !== toDelete.id))
            if (selectedId === toDelete.id) select(null)
            setToDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const selectClass = 'w-full input-field rounded-lg px-2.5 py-2 text-base sm:text-sm'
    const sectionTitle = 'text-xs font-medium text-muted-foreground uppercase tracking-wide px-1'

    const renderCard = (p: NotebookProject) => (
        <ProjectCard
            key={p.id}
            project={p}
            active={p.id === selectedId}
            onOpen={proj => select(proj.id)}
            onTogglePin={handleTogglePin}
            onDelete={setToDelete}
        />
    )

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-5rem)]">
                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 h-full">
                    {/* Список проектов */}
                    <div className={`flex-col h-full min-h-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
                        <div className="flex items-center justify-between mb-3 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="text-sky-500 dark:text-sky-400" size={18} />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Блокнот</h1>
                            </div>
                            <button
                                type="button"
                                onClick={handleCreate}
                                disabled={creating}
                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 transition-colors disabled:opacity-60"
                            >
                                {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Добавить проект
                            </button>
                        </div>

                        <div className="mb-3 flex-shrink-0">{switcher}</div>

                        <div className="relative mb-2 flex-shrink-0">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={filters.search}
                                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                                placeholder="Поиск по проектам"
                                className="w-full input-field rounded-lg pl-9 pr-8 py-2 text-base sm:text-sm"
                            />
                            {filters.search && (
                                <button
                                    type="button"
                                    onClick={() => setFilters(f => ({ ...f, search: '' }))}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Очистить поиск"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
                            <select
                                value={filters.status}
                                onChange={e => setFilters(f => ({ ...f, status: e.target.value as Filters['status'] }))}
                                className={selectClass}
                                aria-label="Фильтр по статусу"
                            >
                                <option value="all">Все статусы</option>
                                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <select
                                value={filters.sort}
                                onChange={e => setFilters(f => ({ ...f, sort: e.target.value as SortKey }))}
                                className={selectClass}
                                aria-label="Сортировка"
                            >
                                <option value="updated">По изменению</option>
                                <option value="deadline">По дедлайну</option>
                                <option value="priority">По приоритету</option>
                            </select>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                            {loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : loadError ? (
                                <div className="text-center py-8">
                                    <p className="text-sm text-muted-foreground mb-3">Не удалось загрузить проекты</p>
                                    <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">
                                        Повторить
                                    </button>
                                </div>
                            ) : projects.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    Пока нет проектов — нажмите «Добавить проект»
                                </p>
                            ) : visible.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Ничего не найдено</p>
                            ) : (
                                <>
                                    {pinned.length > 0 && (
                                        <>
                                            <p className={sectionTitle}>Закреплённые</p>
                                            {pinned.map(renderCard)}
                                        </>
                                    )}
                                    {rest.length > 0 && (
                                        <>
                                            {pinned.length > 0 && <p className={`${sectionTitle} pt-2`}>Остальные</p>}
                                            {rest.map(renderCard)}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Выбранный проект */}
                    <div className={`h-full min-h-0 ${selected ? 'flex' : 'hidden md:flex'} flex-col card-block rounded-2xl p-5 sm:p-6`}>
                        {!selected ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                Выберите проект слева или создайте новый
                            </div>
                        ) : (
                            <ProjectEditor
                                key={selected.id}
                                project={selected}
                                onSaved={handleSaved}
                                onCounts={handleCounts}
                                onTogglePin={handleTogglePin}
                                onDelete={setToDelete}
                                onBack={() => select(null)}
                                autoFocusName={justCreatedId === selected.id}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={!!toDelete}
                title="Удалить проект?"
                message={toDelete ? `«${toDelete.name.trim() || PROJECT_UNTITLED}» будет удалён.` : undefined}
                confirmLabel="Удалить"
                confirming={deleting}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </div>
    )
}
