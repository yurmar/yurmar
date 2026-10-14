import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react'
import {
    closestCorners,
    CollisionDetection,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    apiCreateMilestone,
    apiCreateTask,
    apiDeleteMilestone,
    apiDeleteTask,
    apiGetNotebookProject,
    apiReorderMilestones,
    apiReorderTasks,
    apiUpdateMilestone,
    apiUpdateTask,
    ProjectMilestone,
    ProjectMilestonePatch,
    ProjectTask,
    ProjectTaskPatch,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProjectTaskRow from './ProjectTaskRow'
import { MILESTONE_STATUS_OPTIONS } from './projectMeta'
import { useAutosave } from './useAutosave'

interface Props {
    projectId: number
    onCounts: (counts: { tasks_count: number; done_tasks_count: number }) => void
}

const small = 'input-field rounded-md px-2 py-1 text-base sm:text-xs'

const groupId = (milestoneId: number | null) => `g-${milestoneId ?? 'none'}`
const parseGroup = (id: string): number | null | undefined => {
    if (!id.startsWith('g-')) return undefined
    const raw = id.slice(2)
    return raw === 'none' ? null : Number(raw)
}

// Задачи сталкиваются только с задачами и группами, этапы — только с этапами.
const collisionDetection: CollisionDetection = args => {
    const dragging = args.active.data.current?.type
    const containers = args.droppableContainers.filter(c =>
        dragging === 'milestone' ? c.data.current?.type === 'milestone' : c.data.current?.type !== 'milestone'
    )
    return closestCorners({ ...args, droppableContainers: containers })
}

export const progressOf = (tasks: ProjectTask[]) => {
    const counted = tasks.filter(t => t.status !== 'cancelled')
    const done = counted.filter(t => t.status === 'done').length
    return { total: counted.length, done, percent: counted.length ? Math.round((done / counted.length) * 100) : 0 }
}

function ProgressBar({ tasks }: { tasks: ProjectTask[] }) {
    const { total, done, percent } = progressOf(tasks)
    if (total === 0) return <span className="text-xs text-muted-foreground">нет задач</span>
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="h-1.5 flex-1 rounded-full bg-sky-500/15 overflow-hidden">
                <div className="h-full bg-sky-500" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{done}/{total} · {percent}%</span>
        </div>
    )
}

function AddTask({ onAdd }: { onAdd: (title: string) => void }) {
    const [value, setValue] = useState('')
    const submit = () => {
        const title = value.trim()
        if (!title) return
        onAdd(title)
        setValue('')
    }
    return (
        <div className="flex items-center gap-2">
            <input
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit() } }}
                placeholder="Новая задача — Enter"
                maxLength={255}
                className="flex-1 min-w-0 input-field rounded-md px-2.5 py-1.5 text-base sm:text-sm"
            />
            <button
                type="button"
                onClick={submit}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-sky-500/15 text-sky-500 text-sm whitespace-nowrap hover:bg-sky-500/25"
            >
                <Plus size={14} /> Добавить
            </button>
        </div>
    )
}

/** Контейнер задач группы: принимает перетаскивание, в том числе в пустую группу. */
function TaskGroup({ milestoneId, taskIds, children }: { milestoneId: number | null; taskIds: string[]; children: ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: groupId(milestoneId), data: { type: 'group' } })
    return (
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <div
                ref={setNodeRef}
                className={`space-y-2 min-h-[8px] rounded-lg transition-colors ${isOver ? 'bg-sky-500/5' : ''}`}
            >
                {children}
            </div>
        </SortableContext>
    )
}

function SortableMilestone({
    id, children,
}: {
    id: number
    children: (handle: ReactNode) => ReactNode
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `m-${id}`,
        data: { type: 'milestone' },
    })
    const handle = (
        <button
            type="button"
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-sky-500 flex-shrink-0"
            aria-label="Перетащить этап"
        >
            <GripVertical size={16} />
        </button>
    )
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`rounded-xl border border-sky-500/20 p-3 space-y-3 ${isDragging ? 'opacity-60 shadow-lg relative z-10' : ''}`}
        >
            {children(handle)}
        </div>
    )
}

function MilestoneHeader({
    milestone, tasks, open, onToggle, handle, onSave, onDelete, autoFocus,
}: {
    milestone: ProjectMilestone
    tasks: ProjectTask[]
    open: boolean
    onToggle: () => void
    handle: ReactNode
    onSave: (id: number, patch: ProjectMilestonePatch) => Promise<unknown>
    onDelete: (m: ProjectMilestone) => void
    autoFocus: boolean
}) {
    const [title, setTitle] = useState(milestone.title)
    const [start, setStart] = useState(milestone.start_date ?? '')
    const [deadline, setDeadline] = useState(milestone.deadline ?? '')
    const { fieldErrors, schedule, flush } = useAutosave<ProjectMilestonePatch>({
        save: patch => onSave(milestone.id, patch),
    })

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                {handle}
                <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label={open ? 'Свернуть этап' : 'Развернуть этап'}>
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <input
                    autoFocus={autoFocus}
                    value={title}
                    onChange={e => { setTitle(e.target.value); schedule({ title: e.target.value }) }}
                    placeholder="Название этапа"
                    maxLength={255}
                    className="flex-1 min-w-0 bg-transparent font-semibold text-base sm:text-sm text-foreground focus:outline-none"
                />
                <button type="button" onClick={() => onDelete(milestone)} className="p-1 text-muted-foreground hover:text-red-400" aria-label="Удалить этап"><Trash2 size={14} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-12">
                <select
                    value={milestone.status}
                    onChange={e => { schedule({ status: e.target.value as ProjectMilestone['status'] }); void flush() }}
                    className={small}
                    aria-label="Статус этапа"
                >
                    {MILESTONE_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input type="date" value={start} onChange={e => { setStart(e.target.value); schedule({ start_date: e.target.value || null }) }} className={small} aria-label="Начало этапа" />
                <input type="date" value={deadline} onChange={e => { setDeadline(e.target.value); schedule({ deadline: e.target.value || null }) }} className={small} aria-label="Дедлайн этапа" />
                <ProgressBar tasks={tasks} />
            </div>
            {fieldErrors.deadline && <p className="pl-12 text-xs text-red-400">{fieldErrors.deadline}</p>}
        </div>
    )
}

export default function ProjectPlan({ projectId, onCounts }: Props) {
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
    const [tasks, setTasks] = useState<ProjectTask[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
    const [newMilestoneId, setNewMilestoneId] = useState<number | null>(null)
    const [milestoneToDelete, setMilestoneToDelete] = useState<ProjectMilestone | null>(null)
    const [taskToDelete, setTaskToDelete] = useState<ProjectTask | null>(null)
    const dragOrigin = useRef<{ taskId: number; milestoneId: number | null } | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const load = useCallback(() => {
        setLoading(true)
        setError(false)
        apiGetNotebookProject(projectId)
            .then(r => {
                setMilestones(r.data.milestones ?? [])
                setTasks(r.data.tasks ?? [])
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [projectId])

    useEffect(load, [load])

    useEffect(() => {
        if (loading) return
        const { total, done } = progressOf(tasks)
        onCounts({ tasks_count: total, done_tasks_count: done })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tasks, loading])

    const sortedTasks = useMemo(() => [...tasks].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id), [tasks])
    const tasksOf = (milestoneId: number | null) => sortedTasks.filter(t => t.milestone_id === milestoneId)

    const saveTask = async (id: number, patch: ProjectTaskPatch) => {
        const r = await apiUpdateTask(projectId, id, patch)
        // Название и дату не перезаписываем: поля в строке — источник правды, пока идёт ввод.
        setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...r.data, title: t.title, due_date: t.due_date } : t)))
    }

    const saveMilestone = async (id: number, patch: ProjectMilestonePatch) => {
        const r = await apiUpdateMilestone(projectId, id, patch)
        setMilestones(prev => prev.map(m => (m.id === id ? { ...m, status: r.data.status } : m)))
    }

    const addTask = async (milestoneId: number | null, title: string) => {
        const r = await apiCreateTask(projectId, { title, milestone_id: milestoneId })
        setTasks(prev => [...prev, r.data])
    }

    const confirmTaskDelete = async () => {
        if (!taskToDelete) return
        await apiDeleteTask(projectId, taskToDelete.id)
        setTasks(prev => prev.filter(t => t.id !== taskToDelete.id))
        setTaskToDelete(null)
    }

    const addMilestone = async () => {
        const r = await apiCreateMilestone(projectId, { title: 'Новый этап' })
        setMilestones(prev => [...prev, r.data])
        setNewMilestoneId(r.data.id)
    }

    const confirmMilestoneDelete = async () => {
        if (!milestoneToDelete) return
        await apiDeleteMilestone(projectId, milestoneToDelete.id)
        setMilestones(prev => prev.filter(m => m.id !== milestoneToDelete.id))
        setTasks(prev => prev.map(t => (t.milestone_id === milestoneToDelete.id ? { ...t, milestone_id: null } : t)))
        setMilestoneToDelete(null)
    }

    const toggle = (id: number) =>
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    // ---- drag and drop ----

    const containerOfOver = (overId: string): number | null | undefined => {
        const g = parseGroup(overId)
        if (g !== undefined) return g
        if (overId.startsWith('t-')) {
            const over = tasks.find(t => t.id === Number(overId.slice(2)))
            return over ? over.milestone_id : undefined
        }
        return undefined
    }

    const handleDragStart = (e: DragStartEvent) => {
        const id = String(e.active.id)
        if (!id.startsWith('t-')) return
        const task = tasks.find(t => t.id === Number(id.slice(2)))
        if (task) dragOrigin.current = { taskId: task.id, milestoneId: task.milestone_id }
    }

    // Перенос задачи в другой этап «на лету», чтобы список перестроился под курсором.
    const handleDragOver = (e: DragOverEvent) => {
        const activeId = String(e.active.id)
        if (!activeId.startsWith('t-') || !e.over) return
        const taskId = Number(activeId.slice(2))
        const target = containerOfOver(String(e.over.id))
        if (target === undefined) return
        setTasks(prev => {
            const task = prev.find(t => t.id === taskId)
            if (!task || task.milestone_id === target) return prev
            return prev.map(t => (t.id === taskId ? { ...t, milestone_id: target } : t))
        })
    }

    const persistTaskOrder = async (ordered: ProjectTask[], movedId: number, from: number | null) => {
        const moved = ordered.find(t => t.id === movedId)
        try {
            if (moved && moved.milestone_id !== from) {
                await apiUpdateTask(projectId, movedId, { milestone_id: moved.milestone_id })
            }
            await apiReorderTasks(projectId, ordered.map(t => t.id))
        } catch {
            load()
        }
    }

    const handleDragEnd = (e: DragEndEvent) => {
        const activeId = String(e.active.id)
        const overId = e.over ? String(e.over.id) : null

        if (activeId.startsWith('m-')) {
            if (!overId || !overId.startsWith('m-') || overId === activeId) return
            const from = milestones.findIndex(m => `m-${m.id}` === activeId)
            const to = milestones.findIndex(m => `m-${m.id}` === overId)
            if (from < 0 || to < 0) return
            const next = arrayMove(milestones, from, to)
            setMilestones(next)
            apiReorderMilestones(projectId, next.map(m => m.id)).catch(load)
            return
        }

        const origin = dragOrigin.current
        dragOrigin.current = null
        if (!activeId.startsWith('t-') || !origin) return

        const taskId = Number(activeId.slice(2))
        const task = tasks.find(t => t.id === taskId)
        if (!task) return

        // Порядок внутри группы: ставим на место задачи, над которой отпустили.
        let group = tasksOf(task.milestone_id)
        if (overId?.startsWith('t-') && overId !== activeId) {
            const overTaskId = Number(overId.slice(2))
            const from = group.findIndex(t => t.id === taskId)
            const to = group.findIndex(t => t.id === overTaskId)
            if (from >= 0 && to >= 0) group = arrayMove(group, from, to)
        }

        const groups: (number | null)[] = [...milestones.map(m => m.id), null]
        const ordered: ProjectTask[] = groups.flatMap(g =>
            g === task.milestone_id ? group : tasksOf(g)
        )

        const sameSpot =
            origin.milestoneId === task.milestone_id &&
            ordered.every((t, i) => t.id === sortedTasks[i]?.id)
        if (sameSpot) return

        setTasks(ordered.map((t, i) => ({ ...t, sort_order: i })))
        void persistTaskOrder(ordered, taskId, origin.milestoneId)
    }

    const handleDragCancel = () => {
        if (dragOrigin.current) {
            const { taskId, milestoneId } = dragOrigin.current
            setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, milestone_id: milestoneId } : t)))
            dragOrigin.current = null
        }
    }

    const renderTasks = (milestoneId: number | null) => {
        const group = tasksOf(milestoneId)
        return (
            <>
                <TaskGroup milestoneId={milestoneId} taskIds={group.map(t => `t-${t.id}`)}>
                    {group.map(t => (
                        <ProjectTaskRow
                            key={t.id}
                            task={t}
                            milestones={milestones}
                            onSave={saveTask}
                            onDelete={setTaskToDelete}
                        />
                    ))}
                </TaskGroup>
                <AddTask onAdd={title => addTask(milestoneId, title)} />
            </>
        )
    }

    if (loading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-muted-foreground" /></div>
    if (error) {
        return (
            <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">Не удалось загрузить план</p>
                <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">Повторить</button>
            </div>
        )
    }

    const unassigned = tasksOf(null)

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">План</h2>
                <button
                    type="button"
                    onClick={addMilestone}
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600"
                >
                    <Plus size={14} /> Добавить этап
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={milestones.map(m => `m-${m.id}`)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {milestones.map(m => (
                            <SortableMilestone key={m.id} id={m.id}>
                                {handle => (
                                    <>
                                        <MilestoneHeader
                                            milestone={m}
                                            tasks={tasksOf(m.id)}
                                            open={!collapsed.has(m.id)}
                                            onToggle={() => toggle(m.id)}
                                            handle={handle}
                                            onSave={saveMilestone}
                                            onDelete={setMilestoneToDelete}
                                            autoFocus={newMilestoneId === m.id}
                                        />
                                        {!collapsed.has(m.id) && renderTasks(m.id)}
                                    </>
                                )}
                            </SortableMilestone>
                        ))}
                    </div>
                </SortableContext>

                <div className="rounded-xl border border-sky-500/10 p-3 space-y-3 mt-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-foreground">Без этапа</span>
                        <ProgressBar tasks={unassigned} />
                    </div>
                    {renderTasks(null)}
                </div>
            </DndContext>

            <ConfirmModal
                open={!!taskToDelete}
                title="Удалить задачу?"
                message={taskToDelete ? `«${taskToDelete.title}» будет удалена.` : undefined}
                confirmLabel="Удалить"
                onConfirm={confirmTaskDelete}
                onClose={() => setTaskToDelete(null)}
            />
            <ConfirmModal
                open={!!milestoneToDelete}
                title="Удалить этап?"
                message="Задачи этапа не удаляются — они переместятся в «Без этапа»."
                confirmLabel="Удалить"
                onConfirm={confirmMilestoneDelete}
                onClose={() => setMilestoneToDelete(null)}
            />
        </section>
    )
}
