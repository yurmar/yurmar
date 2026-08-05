import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import {
    Archive,
    CalendarDays,
    CheckCircle2,
    Circle,
    ChevronDown,
    ChevronRight,
    Flag,
    Layers,
    ListChecks,
    ListTodo,
    Loader2,
    Pencil,
    Plus,
    Trash2,
    X,
} from 'lucide-react'
import { RootState } from '@/store'
import {
    apiGetTodoDays,
    apiCreateTodoDay,
    apiGetGeneralTasks,
    apiGetTodoLists,
    apiGetTodoList,
    apiCreateTodoList,
    apiRenameTodoList,
    apiDeleteTodoList,
    apiAddTodoListTasks,
    apiUpdateTodoListTask,
    apiDeleteTodoListTask,
    apiMoveTodoListTask,
    TodoDay,
    TodoList,
    TodoTask,
} from '@/api/todo'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProgressBar from '@/components/ui/ProgressBar'
import { DayCard, DayListItem, VIEW_MODE_KEY, ViewMode, ViewToggle, getSavedViewMode, isArchivable, todayStr } from './shared'

const DAY_FIELDS = [
    { key: 'date', label: 'Дата', type: 'date' as const },
    {
        key: 'tasks',
        label: 'Задания (каждая строка — отдельное задание)',
        type: 'textarea' as const,
        placeholder: 'Позвонить клиенту\nПодготовить отчёт\nОплатить счёт',
    },
]

const LIST_FIELDS = [
    { key: 'name', label: 'Название списка', type: 'text' as const, placeholder: 'Например: Покупки' },
    {
        key: 'tasks',
        label: 'Задания (каждая строка — отдельное задание, необязательно)',
        type: 'textarea' as const,
        placeholder: 'Молоко\nХлеб\nЯйца',
    },
]

function progressColor(done: number, total: number): string {
    if (total === 0) return '#94a3b8'
    if (done === total) return '#10b981'
    if (done === 0) return '#ef4444'
    return '#f59e0b'
}

function percentOf(done: number, total: number): number {
    if (total === 0) return 0
    return Math.round((done / total) * 100)
}

export default function TodoPage() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [days, setDays] = useState<TodoDay[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode)
    const [generalTotal, setGeneralTotal] = useState(0)
    const [generalDone, setGeneralDone] = useState(0)

    const [dayModalOpen, setDayModalOpen] = useState(false)
    const [dayForm, setDayForm] = useState<Record<string, string>>({ date: todayStr(), tasks: '' })
    const [daySaving, setDaySaving] = useState(false)
    const [dayError, setDayError] = useState<string | null>(null)

    const [lists, setLists] = useState<TodoList[]>([])
    const [loadingLists, setLoadingLists] = useState(true)

    const [listModalOpen, setListModalOpen] = useState(false)
    const [listForm, setListForm] = useState<Record<string, string>>({ name: '', tasks: '' })
    const [listSaving, setListSaving] = useState(false)
    const [listError, setListError] = useState<string | null>(null)

    const [expandedListId, setExpandedListId] = useState<number | null>(null)
    const [expandedTasks, setExpandedTasks] = useState<TodoTask[]>([])
    const [expandedLoading, setExpandedLoading] = useState(false)

    const [adding, setAdding] = useState(false)
    const [newTasksText, setNewTasksText] = useState('')
    const [taskSaving, setTaskSaving] = useState(false)
    const [taskError, setTaskError] = useState<string | null>(null)
    const [taskToDelete, setTaskToDelete] = useState<TodoTask | null>(null)
    const [taskToMove, setTaskToMove] = useState<TodoTask | null>(null)
    const [moveDate, setMoveDate] = useState('')
    const [moving, setMoving] = useState(false)
    const [moveError, setMoveError] = useState<string | null>(null)

    const [renaming, setRenaming] = useState<TodoList | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const [renameSaving, setRenameSaving] = useState(false)
    const [listToDelete, setListToDelete] = useState<TodoList | null>(null)
    const [deletingList, setDeletingList] = useState(false)

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

    const loadLists = (silent = false) => {
        if (!silent) setLoadingLists(true)
        apiGetTodoLists()
            .then(r => setLists(r.data))
            .catch(() => {})
            .finally(() => { if (!silent) setLoadingLists(false) })
    }

    useEffect(() => { if (isAuth) { load(); loadLists() } }, [isAuth])

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

    const openCreateDay = () => {
        setDayForm({ date: todayStr(), tasks: '' })
        setDayError(null)
        setDayModalOpen(true)
    }

    const handleSaveDay = () => {
        if (!dayForm.date || !dayForm.tasks?.trim() || daySaving) return
        setDaySaving(true)
        setDayError(null)
        apiCreateTodoDay(dayForm.date, dayForm.tasks)
            .then(() => {
                setDayModalOpen(false)
                load()
            })
            .catch(() => setDayError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setDaySaving(false))
    }

    const openCreateList = () => {
        setListForm({ name: '', tasks: '' })
        setListError(null)
        setListModalOpen(true)
    }

    const handleSaveList = () => {
        if (!listForm.name?.trim() || listSaving) return
        setListSaving(true)
        setListError(null)
        apiCreateTodoList(listForm.name.trim(), listForm.tasks)
            .then(() => {
                setListModalOpen(false)
                loadLists()
            })
            .catch(() => setListError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setListSaving(false))
    }

    const resetTaskUi = () => {
        setAdding(false)
        setNewTasksText('')
        setTaskError(null)
    }

    const toggleExpand = (list: TodoList) => {
        if (expandedListId === list.id) {
            setExpandedListId(null)
            return
        }
        setExpandedListId(list.id)
        resetTaskUi()
        setExpandedLoading(true)
        apiGetTodoList(list.id)
            .then(r => setExpandedTasks(r.data.tasks))
            .catch(() => setExpandedTasks([]))
            .finally(() => setExpandedLoading(false))
    }

    const syncListCounts = (listId: number, tasks: TodoTask[]) => {
        setLists(prev => prev.map(l => l.id === listId
            ? { ...l, tasks_count: tasks.length, done_tasks_count: tasks.filter(t => t.is_done).length }
            : l))
    }

    const toggleTask = (task: TodoTask) => {
        if (!expandedListId) return
        const next = expandedTasks.map(t => t.id === task.id ? { ...t, is_done: !t.is_done } : t)
        setExpandedTasks(next)
        syncListCounts(expandedListId, next)
        const listId = expandedListId
        apiUpdateTodoListTask(listId, task.id, { is_done: !task.is_done })
            .catch(() => apiGetTodoList(listId).then(r => setExpandedTasks(r.data.tasks)).catch(() => {}))
    }

    const togglePriority = (task: TodoTask) => {
        if (!expandedListId) return
        const next = expandedTasks.map(t => t.id === task.id ? { ...t, is_priority: !t.is_priority } : t)
        setExpandedTasks(next)
        apiUpdateTodoListTask(expandedListId, task.id, { is_priority: !task.is_priority }).catch(() => {})
    }

    const deleteTask = (task: TodoTask) => {
        if (!expandedListId) return
        const next = expandedTasks.filter(t => t.id !== task.id)
        setExpandedTasks(next)
        syncListCounts(expandedListId, next)
        apiDeleteTodoListTask(expandedListId, task.id).catch(() => {})
        setTaskToDelete(null)
    }

    const openMove = (task: TodoTask) => {
        setMoveError(null)
        setMoveDate(todayStr())
        setTaskToMove(task)
    }

    const handleMoveTask = () => {
        if (!taskToMove || !moveDate || moving || !expandedListId) return
        setMoving(true)
        setMoveError(null)
        apiMoveTodoListTask(expandedListId, taskToMove.id, moveDate)
            .then(() => {
                const next = expandedTasks.filter(t => t.id !== taskToMove.id)
                setExpandedTasks(next)
                syncListCounts(expandedListId, next)
                setTaskToMove(null)
            })
            .catch(() => setMoveError('Не удалось перенести. Попробуйте ещё раз.'))
            .finally(() => setMoving(false))
    }

    const handleAddTasks = () => {
        if (!newTasksText.trim() || taskSaving || !expandedListId) return
        setTaskSaving(true)
        setTaskError(null)
        apiAddTodoListTasks(expandedListId, newTasksText)
            .then(r => {
                setExpandedTasks(r.data.tasks)
                syncListCounts(expandedListId, r.data.tasks)
                setNewTasksText('')
                setAdding(false)
            })
            .catch(() => setTaskError('Не удалось сохранить. Попробуйте ещё раз.'))
            .finally(() => setTaskSaving(false))
    }

    const openRename = (list: TodoList) => {
        setRenameValue(list.name)
        setRenaming(list)
    }

    const handleRename = () => {
        if (!renaming || !renameValue.trim() || renameSaving) return
        setRenameSaving(true)
        apiRenameTodoList(renaming.id, renameValue.trim())
            .then(r => {
                setLists(prev => prev.map(l => l.id === renaming.id ? { ...l, name: r.data.name } : l))
                setRenaming(null)
            })
            .catch(() => {})
            .finally(() => setRenameSaving(false))
    }

    const handleDeleteList = () => {
        if (!listToDelete) return
        setDeletingList(true)
        apiDeleteTodoList(listToDelete.id)
            .then(() => {
                setLists(prev => prev.filter(l => l.id !== listToDelete.id))
                if (expandedListId === listToDelete.id) setExpandedListId(null)
                setListToDelete(null)
            })
            .catch(() => {})
            .finally(() => setDeletingList(false))
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
                <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={openCreateList}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex-1 sm:flex-none whitespace-nowrap"
                    >
                        <Plus size={16} /> Добавить список
                    </button>
                    <button
                        type="button"
                        onClick={openCreateDay}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 transition-colors flex-1 sm:flex-none whitespace-nowrap"
                    >
                        <Plus size={16} /> Добавить день
                    </button>
                </div>
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

            {/* Списки задач */}
            <div className="flex items-end justify-between mb-4 gap-4 mt-10">
                <h2 className="text-lg font-semibold text-foreground">Списки ({lists.length})</h2>
            </div>

            {loadingLists ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : lists.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">Пока нет ни одного списка — нажмите «Добавить список» выше</p>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {lists.map(list => {
                            const isOpen = expandedListId === list.id
                            const color = progressColor(list.done_tasks_count, list.tasks_count)
                            return (
                                <motion.div key={list.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-block rounded-2xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleExpand(list)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-foreground/[0.03] transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center flex-shrink-0">
                                            <ListTodo className="text-emerald-500 dark:text-emerald-400" size={15} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-foreground truncate mb-1">{list.name}</div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 max-w-[160px]">
                                                    <ProgressBar percent={percentOf(list.done_tasks_count, list.tasks_count)} color={color} />
                                                </div>
                                                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums font-mono">
                                                    {list.done_tasks_count}/{list.tasks_count}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); openRename(list) }}
                                            aria-label="Переименовать список"
                                            className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                                        >
                                            <Pencil size={15} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setListToDelete(list) }}
                                            aria-label="Удалить список"
                                            className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                        <ChevronDown size={16} className={`text-muted-foreground flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-border"
                                            >
                                                <div className="p-4">
                                                    {expandedLoading ? (
                                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                                                    ) : (
                                                        <div className="space-y-2 mb-4">
                                                            <AnimatePresence initial={false}>
                                                                {expandedTasks.map(task => (
                                                                    <motion.div
                                                                        key={task.id}
                                                                        layout
                                                                        initial={{ opacity: 0, y: 8 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, x: -12 }}
                                                                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 bg-foreground/[0.03] ${task.is_priority && !task.is_done ? 'border border-red-500/40 bg-red-500/5' : ''}`}
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
                                                            {expandedTasks.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">В этом списке пока нет заданий</p>}
                                                        </div>
                                                    )}

                                                    {adding ? (
                                                        <div className="rounded-xl bg-foreground/[0.03] p-3">
                                                            <textarea
                                                                autoFocus
                                                                value={newTasksText}
                                                                onChange={e => setNewTasksText(e.target.value)}
                                                                rows={3}
                                                                placeholder={'Новое задание\nЕщё одно задание'}
                                                                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-base sm:text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                                                            />
                                                            {taskError && <p className="text-xs text-red-500 mt-2">{taskError}</p>}
                                                            <div className="flex justify-end gap-2 mt-3">
                                                                <button type="button" onClick={() => { setAdding(false); setNewTasksText('') }} className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
                                                                    Отмена
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleAddTasks}
                                                                    disabled={taskSaving || !newTasksText.trim()}
                                                                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    {taskSaving && <Loader2 size={14} className="animate-spin" />}
                                                                    Сохранить
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setAdding(true)}
                                                            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-sky-500 dark:text-sky-400 border border-dashed border-sky-500/30 hover:bg-sky-500/10 transition-colors"
                                                        >
                                                            <Plus size={16} /> Добавить ещё
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            <Modal
                open={dayModalOpen}
                title="Добавить день"
                fields={DAY_FIELDS}
                values={dayForm}
                onChange={(k, v) => setDayForm(p => ({ ...p, [k]: v }))}
                onSave={handleSaveDay}
                onClose={() => setDayModalOpen(false)}
                saving={daySaving}
                error={dayError}
            />

            <Modal
                open={listModalOpen}
                title="Новый список"
                fields={LIST_FIELDS}
                values={listForm}
                onChange={(k, v) => setListForm(p => ({ ...p, [k]: v }))}
                onSave={handleSaveList}
                onClose={() => setListModalOpen(false)}
                saving={listSaving}
                error={listError}
            />

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

            <AnimatePresence>
                {renaming && (
                    <motion.div
                        data-no-ptr
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setRenaming(null)}
                        />
                        <motion.div
                            className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1a30] shadow-2xl p-6 light:bg-white light:border-gray-200"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white">Переименовать список</h3>
                                <button
                                    onClick={() => setRenaming(null)}
                                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <input
                                type="text"
                                autoFocus
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-base text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                            />

                            <div className="flex gap-3 mt-6 justify-end">
                                <button
                                    onClick={() => setRenaming(null)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleRename}
                                    disabled={renameSaving || !renameValue.trim()}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-400 transition-colors disabled:opacity-60"
                                >
                                    {renameSaving && <Loader2 size={14} className="animate-spin" />}
                                    Сохранить
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

            <ConfirmModal
                open={!!listToDelete}
                title="Удалить список?"
                message={listToDelete ? `Список «${listToDelete.name}» и все задания в нём будут удалены безвозвратно.` : undefined}
                confirming={deletingList}
                onConfirm={handleDeleteList}
                onClose={() => setListToDelete(null)}
            />
        </div>
    )
}
