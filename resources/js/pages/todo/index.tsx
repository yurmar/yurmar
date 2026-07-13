import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { ListChecks, LayoutGrid, List, ChevronRight, Loader2, Plus } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetTodoDays, apiCreateTodoDay, TodoDay } from '@/api/todo'
import Modal from '@/components/ui/Modal'

const FIELDS = [
    { key: 'date', label: 'Дата', type: 'date' as const },
    {
        key: 'tasks',
        label: 'Задания (каждая строка — отдельное задание)',
        type: 'textarea' as const,
        placeholder: 'Позвонить клиенту\nПодготовить отчёт\nОплатить счёт',
    },
]

type ViewMode = 'cards' | 'list'
const VIEW_MODE_KEY = 'todoViewMode'

function getSavedViewMode(): ViewMode {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'cards'
}

function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(str: string | null | undefined) {
    if (!str) return '—'
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'short' })
}

function statusOf(day: TodoDay): 'done' | 'partial' | 'none' | 'empty' {
    if (day.tasks_count === 0) return 'empty'
    if (day.done_tasks_count === day.tasks_count) return 'done'
    if (day.done_tasks_count === 0) return 'none'
    return 'partial'
}

const STATUS_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
    done: { bar: '#10b981', badge: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400', label: 'Всё выполнено' },
    partial: { bar: '#f59e0b', badge: 'bg-amber-500/15 text-amber-500 dark:text-amber-400', label: 'Есть невыполненное' },
    none: { bar: '#ef4444', badge: 'bg-red-500/15 text-red-500 dark:text-red-400', label: 'Ничего не сделано' },
    empty: { bar: '#94a3b8', badge: 'bg-slate-500/15 text-slate-500 dark:text-slate-400', label: 'Пусто' },
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
    const btnCls = (active: boolean) =>
        `p-1.5 rounded-lg transition-colors ${active ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'}`
    return (
        <div className="flex items-center gap-0.5 bg-foreground/5 border border-border rounded-xl p-1 flex-shrink-0">
            <button type="button" onClick={() => onChange('cards')} aria-label="Карточки" className={btnCls(mode === 'cards')}>
                <LayoutGrid size={15} />
            </button>
            <button type="button" onClick={() => onChange('list')} aria-label="Списком" className={btnCls(mode === 'list')}>
                <List size={15} />
            </button>
        </div>
    )
}

export default function TodoList() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [days, setDays] = useState<TodoDay[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode)

    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState<Record<string, string>>({ date: todayStr(), tasks: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        apiGetTodoDays()
            .then(r => setDays(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => { if (isAuth) load() }, [isAuth])

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(VIEW_MODE_KEY, mode)
    }

    const openCreate = () => {
        setForm({ date: todayStr(), tasks: '' })
        setError(null)
        setModalOpen(true)
    }

    const handleSave = () => {
        if (!form.date || !form.tasks?.trim() || saving) return
        setSaving(true)
        setError(null)
        apiCreateTodoDay(form.date, form.tasks)
            .then(() => {
                setModalOpen(false)
                load()
            })
            .catch(() => setError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setSaving(false))
    }

    const sorted = (Array.isArray(days) ? days : [])
        .filter(d => !!d?.date)
        .sort((a, b) => b.date.localeCompare(a.date))

    return (
        <div className="min-h-screen pt-24 pb-16 max-w-4xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                            <ListChecks className="text-sky-500 dark:text-sky-400" size={18} />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Надо сделать</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">Планируйте задачи по дням и отмечайте выполненное</p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors flex-shrink-0"
                >
                    <Plus size={16} /> Добавить день
                </button>
            </motion.div>

            {/* Список дней */}
            <div className="flex items-end justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold text-foreground">Дни ({sorted.length})</h2>
                {sorted.length > 0 && <ViewToggle mode={viewMode} onChange={setViewMode} />}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : sorted.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Пока нет ни одного дня — нажмите «Добавить день» выше</p>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {sorted.map((day, i) => {
                            const status = statusOf(day)
                            const s = STATUS_STYLES[status]
                            return (
                                <motion.div key={day.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                                    <Link to={`/todo/${day.id}`} className="group relative flex flex-col card-block rounded-2xl p-5 pt-6 hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full">
                                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.bar }} />
                                        <div className="font-semibold text-foreground capitalize mb-2">{formatDate(day.date)}</div>
                                        <div className="text-sm text-muted-foreground mb-3">
                                            Выполнено {day.done_tasks_count} из {day.tasks_count}
                                        </div>
                                        <span className={`self-start text-[10px] font-semibold px-2 py-1 rounded-full ${s.badge}`}>{s.label}</span>
                                        <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-1 text-xs text-sky-500 dark:text-sky-400 font-medium">
                                            Открыть <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {sorted.map((day, i) => {
                            const status = statusOf(day)
                            const s = STATUS_STYLES[status]
                            return (
                                <motion.div key={day.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                                    <Link to={`/todo/${day.id}`} className="group flex items-center rounded-2xl overflow-hidden card-block hover:-translate-y-0.5 transition-all duration-200">
                                        <div className="w-1.5 self-stretch flex-shrink-0" style={{ background: s.bar }} />
                                        <div className="flex-1 flex items-center justify-between px-4 py-3.5 gap-4">
                                            <div>
                                                <div className="font-semibold text-foreground capitalize">{formatDate(day.date)}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">Выполнено {day.done_tasks_count} из {day.tasks_count}</div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${s.badge}`}>{s.label}</span>
                                                <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            <Modal
                open={modalOpen}
                title="Добавить день"
                fields={FIELDS}
                values={form}
                onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))}
                onSave={handleSave}
                onClose={() => setModalOpen(false)}
                saving={saving}
                error={error}
            />
        </div>
    )
}
