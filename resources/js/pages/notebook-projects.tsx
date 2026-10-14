import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
    const navigate = useNavigate()

    const [projects, setProjects] = useState<NotebookProject[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(false)
    const [creating, setCreating] = useState(false)
    const [filters, setFilters] = useState<Filters>(loadFilters)
    const [toDelete, setToDelete] = useState<NotebookProject | null>(null)
    const [deleting, setDeleting] = useState(false)

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

    const open = (p: NotebookProject) => navigate(`/notebook/projects/${p.id}`)

    const handleCreate = async () => {
        setCreating(true)
        try {
            const r = await apiCreateNotebookProject()
            navigate(`/notebook/projects/${r.data.id}`, { state: { justCreated: true } })
        } catch {
            setLoadError(true)
        } finally {
            setCreating(false)
        }
    }

    const handleTogglePin = async (p: NotebookProject) => {
        try {
            const r = await apiUpdateNotebookProject(p.id, { is_pinned: !p.is_pinned })
            setProjects(prev => prev.map(x => (x.id === p.id ? { ...x, ...r.data } : x)))
        } catch { /* состояние не меняем */ }
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await apiDeleteNotebookProject(toDelete.id)
            setProjects(prev => prev.filter(p => p.id !== toDelete.id))
            setToDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const selectClass = 'input-field rounded-lg px-3 py-2 text-base sm:text-sm'

    const renderCards = (list: NotebookProject[]) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {list.map(p => (
                <ProjectCard key={p.id} project={p} onOpen={open} onTogglePin={handleTogglePin} onDelete={setToDelete} />
            ))}
        </div>
    )

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="text-sky-500 dark:text-sky-400" size={18} />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">Блокнот</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {switcher}
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={creating}
                            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 transition-colors disabled:opacity-60"
                        >
                            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                            Добавить проект
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-5">
                    <div className="relative flex-1">
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

                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : loadError ? (
                    <div className="text-center py-10">
                        <p className="text-sm text-muted-foreground mb-3">Не удалось загрузить проекты</p>
                        <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">
                            Повторить
                        </button>
                    </div>
                ) : projects.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-10">
                        Пока нет проектов — нажмите «Добавить проект»
                    </p>
                ) : visible.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-10">Ничего не найдено</p>
                ) : (
                    <div className="space-y-5">
                        {pinned.length > 0 && (
                            <section>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-2">
                                    Закреплённые
                                </p>
                                {renderCards(pinned)}
                            </section>
                        )}
                        {rest.length > 0 && (
                            <section>
                                {pinned.length > 0 && (
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 mb-2">
                                        Остальные
                                    </p>
                                )}
                                {renderCards(rest)}
                            </section>
                        )}
                    </div>
                )}
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
