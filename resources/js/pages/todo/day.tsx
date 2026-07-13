import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { ArrowLeft, CheckCircle2, Circle, Loader2, Plus, Trash2 } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetTodoDay, apiAddTodoTasks, apiUpdateTodoTask, apiDeleteTodoTask, TodoDayDetail, TodoTask } from '@/api/todo'
import ProgressBar from '@/components/ui/ProgressBar'

function formatDate(str: string | null | undefined) {
    if (!str) return '—'
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return '—'
    const formatted = date
        .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })
        .replace(/\s*г\.$/i, '')
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
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

    const load = () => {
        if (!dayId) return
        setLoading(true)
        apiGetTodoDay(Number(dayId))
            .then(r => setDay(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }

    useEffect(() => { if (isAuth) load() }, [isAuth, dayId])

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const toggleTask = (task: TodoTask) => {
        if (!day) return
        setDay({ ...day, tasks: day.tasks.map(t => t.id === task.id ? { ...t, is_done: !t.is_done } : t) })
        apiUpdateTodoTask(day.id, task.id, { is_done: !task.is_done }).catch(() => load())
    }

    const deleteTask = (task: TodoTask) => {
        if (!day) return
        setDay({ ...day, tasks: day.tasks.filter(t => t.id !== task.id) })
        apiDeleteTodoTask(day.id, task.id).catch(() => load())
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
                            className="group flex items-center gap-3 card-block rounded-xl px-4 py-3"
                        >
                            <button type="button" onClick={() => toggleTask(task)} className="flex-shrink-0" aria-label={task.is_done ? 'Отметить невыполненным' : 'Отметить выполненным'}>
                                {task.is_done
                                    ? <CheckCircle2 className="text-emerald-500" size={20} />
                                    : <Circle className="text-muted-foreground" size={20} />}
                            </button>
                            <span className={`flex-1 min-w-0 text-sm break-words ${task.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                            </span>
                            <button
                                type="button"
                                onClick={() => deleteTask(task)}
                                aria-label="Удалить задание"
                                className="flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>
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
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-sky-500/40"
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
        </div>
    )
}
