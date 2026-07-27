import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Flag, Layers, Loader2, Plus, Trash2, X } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetTodoDay, apiAddTodoTasks, apiUpdateTodoTask, apiDeleteTodoTask, apiMoveTodoTask, TodoDayDetail, TodoTask } from '@/api/todo'
import ProgressBar from '@/components/ui/ProgressBar'
import ConfirmModal from '@/components/ui/ConfirmModal'

function formatDate(str: string | null | undefined) {
    if (!str) return '—'
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return '—'
    const formatted = date
        .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })
        .replace(/\s*г\.$/i, '')
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function nextDay(str: string): string {
    const d = new Date(str + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function progressColor(done: number, total: number): string {
    if (total === 0) return '#94a3b8'
    if (done === total) return '#10b981'
    if (done === 0) return '#ef4444'
    return '#f59e0b'
}

export default function TodoDayPage() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)
    const { dayId } = useParams()

    const [day, setDay] = useState<TodoDayDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [newTasksText, setNewTasksText] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [taskToDelete, setTaskToDelete] = useState<TodoTask | null>(null)
    const [taskToMove, setTaskToMove] = useState<TodoTask | null>(null)
    const [moveDate, setMoveDate] = useState('')
    const [moving, setMoving] = useState(false)
    const [moveError, setMoveError] = useState<string | null>(null)

    const load = (silent = false) => {
        if (!dayId) return
        if (!silent) setLoading(true)
        apiGetTodoDay(Number(dayId))
            .then(r => setDay(r.data))
            .catch(() => {})
            .finally(() => { if (!silent) setLoading(false) })
    }

    useEffect(() => { if (isAuth) load() }, [isAuth, dayId])

    // Периодически подтягиваем задачи (например, добавленные через Telegram-бота),
    // пока страница дня открыта и видима.
    useEffect(() => {
        if (!isAuth || !dayId) return
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
    }, [isAuth, dayId])

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const toggleTask = (task: TodoTask) => {
        if (!day) return
        setDay({ ...day, tasks: day.tasks.map(t => t.id === task.id ? { ...t, is_done: !t.is_done } : t) })
        apiUpdateTodoTask(day.id, task.id, { is_done: !task.is_done }).catch(() => load())
    }

    const togglePriority = (task: TodoTask) => {
        if (!day) return
        setDay({ ...day, tasks: day.tasks.map(t => t.id === task.id ? { ...t, is_priority: !t.is_priority } : t) })
        apiUpdateTodoTask(day.id, task.id, { is_priority: !task.is_priority }).catch(() => load())
    }

    const deleteTask = (task: TodoTask) => {
        if (!day) return
        setDay({ ...day, tasks: day.tasks.filter(t => t.id !== task.id) })
        apiDeleteTodoTask(day.id, task.id).catch(() => load())
        setTaskToDelete(null)
    }

    const openMove = (task: TodoTask) => {
        if (!day) return
        setMoveError(null)
        setMoveDate(nextDay(day.date))
        setTaskToMove(task)
    }

    const handleMoveTask = () => {
        if (!day || !taskToMove || !moveDate || moving) return
        if (moveDate === day.date) { setTaskToMove(null); return }
        setMoving(true)
        setMoveError(null)
        apiMoveTodoTask(day.id, taskToMove.id, moveDate)
            .then(r => {
                setDay(r.data)
                setTaskToMove(null)
            })
            .catch(() => setMoveError('Не удалось перенести. Попробуйте ещё раз.'))
            .finally(() => setMoving(false))
    }

    const handleMoveTaskToGeneral = () => {
        if (!day || !taskToMove || moving) return
        setMoving(true)
        setMoveError(null)
        apiMoveTodoTask(day.id, taskToMove.id, null)
            .then(r => {
                setDay(r.data)
                setTaskToMove(null)
            })
            .catch(() => setMoveError('Не удалось перенести. Попробуйте ещё раз.'))
            .finally(() => setMoving(false))
    }

    const handleAddTasks = () => {
        if (!day || !newTasksText.trim() || saving) return
        setSaving(true)
        setError(null)
        apiAddTodoTasks(day.id, newTasksText)
            .then(r => {
                setDay(r.data)
                setNewTasksText('')
                setAdding(false)
            })
            .catch(() => setError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setSaving(false))
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    }

    if (!day) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
                <p className="text-muted-foreground">День не найден</p>
                <Link to="/todo" className="text-sky-500 dark:text-sky-400 text-sm">Вернуться к списку</Link>
            </div>
        )
    }

    const total = day.tasks.length
    const done = day.tasks.filter(t => t.is_done).length
    const percent = total === 0 ? 0 : Math.round((done / total) * 100)
    const color = progressColor(done, total)

    return (
        <div className="min-h-screen pt-24 pb-16 max-w-2xl mx-auto px-4">
            <Link to="/todo" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                <ArrowLeft size={13} /> Все дни
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1 break-words">{formatDate(day.date)}</h1>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-2">
                    <span>Выполнено {done} из {total}</span>
                    <span className="font-mono text-xs tabular-nums flex-shrink-0">{percent}%</span>
                </div>
                <ProgressBar percent={percent} color={color} />
            </motion.div>

            <div className="space-y-2 mb-6">
                <AnimatePresence initial={false}>
                    {day.tasks.map(task => (
                        <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            className={`group flex items-center gap-3 card-block rounded-xl px-4 py-3 ${task.is_priority && !task.is_done ? 'border-red-500/40 bg-red-500/5' : ''}`}
                        >
                            <button type="button" onClick={() => toggleTask(task)} className="flex-shrink-0" aria-label={task.is_done ? 'Отметить невыполненным' : 'Отметить выполненным'}>
                                {task.is_done
                                    ? <CheckCircle2 className="text-emerald-500" size={20} />
                                    : <Circle className="text-muted-foreground" size={20} />}
                            </button>
                            <span className={`flex-1 min-w-0 text-sm break-words ${task.is_done ? 'line-through text-muted-foreground' : task.is_priority ? 'text-red-500' : 'text-foreground'}`}>
                                {task.title}
                            </span>
                            {!task.is_done && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => togglePriority(task)}
                                        aria-label={task.is_priority ? 'Снять приоритет' : 'Отметить приоритетным'}
                                        className={`flex-shrink-0 transition-opacity ${task.is_priority ? 'opacity-100 text-red-500' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-red-500'}`}
                                    >
                                        <Flag size={16} className={task.is_priority ? 'fill-red-500' : ''} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openMove(task)}
                                        aria-label="Перенести задание на другой день"
                                        className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-sky-500 transition-opacity"
                                    >
                                        <CalendarDays size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskToDelete(task)}
                                        aria-label="Удалить задание"
                                        className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {total === 0 && <p className="text-muted-foreground text-sm text-center py-6">Заданий пока нет</p>}
            </div>

            {adding ? (
                <div className="card-block rounded-2xl p-4">
                    <textarea
                        autoFocus
                        value={newTasksText}
                        onChange={e => setNewTasksText(e.target.value)}
                        rows={3}
                        placeholder={'Новое задание\nЕщё одно задание'}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-base sm:text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                    {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
                    <div className="flex justify-end gap-2 mt-3">
                        <button type="button" onClick={() => { setAdding(false); setNewTasksText('') }} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Отмена
                        </button>
                        <button
                            type="button"
                            onClick={handleAddTasks}
                            disabled={saving || !newTasksText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Сохранить
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-sky-500 dark:text-sky-400 border border-dashed border-sky-500/30 hover:bg-sky-500/10 transition-colors"
                >
                    <Plus size={16} /> Добавить ещё
                </button>
            )}

            <AnimatePresence>
                {taskToMove && (
                    <motion.div
                        data-no-ptr
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setTaskToMove(null)}
                        />
                        <motion.div
                            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1a30] shadow-2xl p-6 light:bg-white light:border-gray-200"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white">Перенести задание</h3>
                                <button
                                    onClick={() => setTaskToMove(null)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mb-4 break-words">«{taskToMove.title}» будет перенесено на выбранный день. Если такого дня ещё нет, он будет создан.</p>

                            <input
                                type="date"
                                value={moveDate}
                                onChange={e => setMoveDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-base text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 [color-scheme:dark]"
                            />
                            {moveError && <p className="text-xs text-red-500 mt-2">{moveError}</p>}

                            <button
                                onClick={handleMoveTaskToGeneral}
                                disabled={moving}
                                className="flex items-center gap-1.5 mt-4 text-sm text-sky-400 hover:text-sky-300 transition-colors disabled:opacity-60"
                            >
                                <Layers size={14} /> Без даты, в Общие задачи
                            </button>

                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={() => setTaskToMove(null)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleMoveTask}
                                    disabled={moving || !moveDate}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-400 transition-colors disabled:opacity-60"
                                >
                                    {moving && <Loader2 size={14} className="animate-spin" />}
                                    Перенести
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={!!taskToDelete}
                title="Удалить задание?"
                message={taskToDelete ? `«${taskToDelete.title}» будет удалено безвозвратно.` : undefined}
                onConfirm={() => taskToDelete && deleteTask(taskToDelete)}
                onClose={() => setTaskToDelete(null)}
            />
        </div>
    )
}
