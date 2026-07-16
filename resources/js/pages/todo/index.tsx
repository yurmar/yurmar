import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Archive, ChevronRight, Layers, ListChecks, Loader2, Plus } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetTodoDays, apiCreateTodoDay, apiGetGeneralTasks, TodoDay } from '@/api/todo'
import Modal from '@/components/ui/Modal'
import { DayCard, DayListItem, VIEW_MODE_KEY, ViewMode, ViewToggle, getSavedViewMode, isArchivable, todayStr } from './shared'

const FIELDS = [
    { key: 'date', label: 'Дата', type: 'date' as const },
    {
        key: 'tasks',
        label: 'Задания (каждая строка — отдельное задание)',
        type: 'textarea' as const,
        placeholder: 'Позвонить клиенту\nПодготовить отчёт\nОплатить счёт',
    },
]

export default function TodoList() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [days, setDays] = useState<TodoDay[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode)
    const [generalTotal, setGeneralTotal] = useState(0)
    const [generalDone, setGeneralDone] = useState(0)

    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState<Record<string, string>>({ date: todayStr(), tasks: '' })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = (silent = false) => {
        if (!silent) setLoading(true)
        apiGetTodoDays()
            .then(r => setDays(r.data))
            .catch(() => {})
            .finally(() => { if (!silent) setLoading(false) })
        apiGetGeneralTasks()
            .then(r => {
                setGeneralTotal(r.data.length)
                setGeneralDone(r.data.filter(t => t.is_done).length)
            })
            .catch(() => {})
    }

    useEffect(() => { if (isAuth) load() }, [isAuth])

    // Периодически подтягиваем дни (например, добавленные через Telegram-бота),
    // пока страница списка открыта и видима.
    useEffect(() => {
        if (!isAuth) return
        const POLL_MS = 12000
        let interval: ReturnType<typeof setInterval> | null = null

        const start = () => {
            if (interval) return
            interval = setInterval(() => load(true), POLL_MS)
        }
        const stop = () => {
            if (interval) { clearInterval(interval); interval = null }
        }
        const onVisibility = () => {
            if (document.hidden) {
                stop()
            } else {
                load(true)
                start()
            }
        }

        document.addEventListener('visibilitychange', onVisibility)
        if (!document.hidden) start()

        return () => {
            stop()
            document.removeEventListener('visibilitychange', onVisibility)
        }
    }, [isAuth])

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

    const today = todayStr()
    const sorted = (Array.isArray(days) ? days : [])
        .filter(d => !!d?.date)
        .sort((a, b) => a.date.localeCompare(b.date))
    const active = sorted.filter(d => !isArchivable(d, today))
    const archivedCount = sorted.length - active.length

    return (
        <div className="min-h-screen pt-24 pb-16 max-w-4xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                            <ListChecks className="text-sky-500 dark:text-sky-400" size={18} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Надо сделать</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">Планируйте задачи по дням и отмечайте выполненное</p>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors flex-shrink-0 w-full sm:w-auto"
                >
                    <Plus size={16} /> Добавить день
                </button>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <Link
                    to="/todo/general"
                    className="group relative flex items-center gap-4 card-block rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                    <div className="w-11 h-11 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                        <Layers className="text-violet-500 dark:text-violet-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-0.5">Общие задачи</div>
                        <div className="text-sm text-muted-foreground">
                            {generalTotal === 0 ? 'Задачи без привязки к дню' : `Выполнено ${generalDone} из ${generalTotal}`}
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>

                <Link
                    to="/todo/archive"
                    className="group relative flex items-center gap-4 card-block rounded-2xl p-5 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                    <div className="w-11 h-11 rounded-xl bg-slate-500/15 border border-slate-500/25 flex items-center justify-center flex-shrink-0">
                        <Archive className="text-slate-500 dark:text-slate-400" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground mb-0.5">Архив</div>
                        <div className="text-sm text-muted-foreground">
                            {archivedCount === 0 ? 'Завершённых прошедших дней нет' : `Завершённых дней: ${archivedCount}`}
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
            </div>

            {/* Список дней */}
            <div className="flex items-end justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold text-foreground">Дни ({active.length})</h2>
                {active.length > 0 && <ViewToggle mode={viewMode} onChange={setViewMode} />}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : active.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Пока нет ни одного дня — нажмите «Добавить день» выше</p>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {active.map((day, i) => (
                            <DayCard key={day.id} day={day} index={i} isToday={day.date === today} />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {active.map(day => (
                            <DayListItem key={day.id} day={day} isToday={day.date === today} />
                        ))}
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
