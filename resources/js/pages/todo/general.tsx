import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Flag, Layers, Loader2, Plus, Trash2, X } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetGeneralTasks, apiAddGeneralTasks, apiUpdateGeneralTask, apiDeleteGeneralTask, apiMoveGeneralTaskToDay, TodoTask } from '@/api/todo'
import ConfirmModal from '@/components/ui/ConfirmModal'

function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function progressColor(done: number, total: number): string {
    if (total === 0) return '#94a3b8'
    if (done === total) return '#10b981'
    if (done === 0) return '#ef4444'
    return '#f59e0b'
}

export default function TodoGeneralPage() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [tasks, setTasks] = useState<TodoTask[]>([])
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
        if (!silent) setLoading(true)
        apiGetGeneralTasks()
            .then(r => setTasks(r.data))
            .catch(() => {})
            .finally(() => { if (!silent) setLoading(false) })
    }

    useEffect(() => { if (isAuth) load() }, [isAuth])

    // Периодически подтягиваем задачи (например, добавленные через Telegram-бота),
    // пока страница открыта и видима.
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

    const toggleTask = (task: TodoTask) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_done: !t.is_done } : t))
        apiUpdateGeneralTask(task.id, { is_done: !task.is_done }).catch(() => load())
    }

    const togglePriority = (task: TodoTask) => {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_priority: !t.is_priority } : t))
        apiUpdateGeneralTask(task.id, { is_priority: !task.is_priority }).catch(() => load())
    }

    const deleteTask = (task: TodoTask) => {
        setTasks(prev => prev.filter(t => t.id !== task.id))
        apiDeleteGeneralTask(task.id).catch(() => load())
        setTaskToDelete(null)
    }

    const openMove = (task: TodoTask) => {
        setMoveError(null)
        setMoveDate(todayStr())
        setTaskToMove(task)
    }

    const handleMoveTask = () => {
        if (!taskToMove || !moveDate || moving) return
        setMoving(true)
        setMoveError(null)
        apiMoveGeneralTaskToDay(taskToMove.id, moveDate)
            .then(() => {
                setTasks(prev => prev.filter(t => t.id !== taskToMove.id))
                setTaskToMove(null)
            })
            .catch(() => setMoveError('Не удалось перенести. Попробуйте ещё раз.'))
            .finally(() => setMoving(false))
    }

    const handleAddTasks = () => {
        if (!newTasksText.trim() || saving) return
        setSaving(true)
        setError(null)
        apiAddGeneralTasks(newTasksText)
            .then(r => {
                setTasks(r.data)
                setNewTasksText('')
                setAdding(false)
            })
            .catch(() => setError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setSaving(false))
    }

    const total = tasks.length
    const done = tasks.filter(t => t.is_done).length
    const color = progressColor(done, total)

    return (
        <div className="min-h-screen pt-24 pb-16 max-w-2xl mx-auto px-4">
            <Link to="/todo" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                <ArrowLeft size={13} /> Все дни
            </Link>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                        <Layers className="text-sky-500 dark:text-sky-400" size={18} />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Общие задачи</h1>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground mb-2">
                    <span>Выполнено {done} из {total}</span>
                </div>
                {total > 0 && (
                    <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${total === 0 ? 0 : Math.round((done / total) * 100)}%`, background: color }} />
                    </div>
                )}
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-2 mb-6">
                    <AnimatePresence initial={false}>
                        {tasks.map(task => (
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
                                            aria-label="Перенести задание на день"
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
                    {total === 0 && <p className="text-muted-foreground text-sm text-center py-6">Общих заданий пока нет</p>}
                </div>
            )}

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
                                <h3 className="text-lg font-semibold text-white">Перенести на день</h3>
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
