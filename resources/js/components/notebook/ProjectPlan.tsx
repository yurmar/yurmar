import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react'
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

function MilestoneHeader({
    milestone, tasks, open, onToggle, isFirst, isLast, onSave, onDelete, onMove, autoFocus,
}: {
    milestone: ProjectMilestone
    tasks: ProjectTask[]
    open: boolean
    onToggle: () => void
    isFirst: boolean
    isLast: boolean
    onSave: (id: number, patch: ProjectMilestonePatch) => Promise<unknown>
    onDelete: (m: ProjectMilestone) => void
    onMove: (m: ProjectMilestone, dir: -1 | 1) => void
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
                <button type="button" disabled={isFirst} onClick={() => onMove(milestone, -1)} className="p-1 text-muted-foreground hover:text-sky-500 disabled:opacity-30" aria-label="Поднять этап"><ArrowUp size={14} /></button>
                <button type="button" disabled={isLast} onClick={() => onMove(milestone, 1)} className="p-1 text-muted-foreground hover:text-sky-500 disabled:opacity-30" aria-label="Опустить этап"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => onDelete(milestone)} className="p-1 text-muted-foreground hover:text-red-400" aria-label="Удалить этап"><Trash2 size={14} /></button>
            </div>
            <div className="flex flex-wrap items-center gap-2 pl-6">
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
            {fieldErrors.deadline && <p className="pl-6 text-xs text-red-400">{fieldErrors.deadline}</p>}
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

    const moveTask = async (task: ProjectTask, dir: -1 | 1) => {
        const group = tasksOf(task.milestone_id)
        const index = group.findIndex(t => t.id === task.id)
        const target = index + dir
        if (target < 0 || target >= group.length) return
        const reordered = [...group]
        ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
        const groupIds = new Set(group.map(t => t.id))
        const rest = sortedTasks.filter(t => !groupIds.has(t.id))
        const ids = [...rest.map(t => t.id), ...reordered.map(t => t.id)]
        const r = await apiReorderTasks(projectId, ids)
        setTasks(r.data)
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

    const moveMilestone = async (m: ProjectMilestone, dir: -1 | 1) => {
        const index = milestones.findIndex(x => x.id === m.id)
        const target = index + dir
        if (target < 0 || target >= milestones.length) return
        const next = [...milestones]
        ;[next[index], next[target]] = [next[target], next[index]]
        setMilestones(next)
        try {
            await apiReorderMilestones(projectId, next.map(x => x.id))
        } catch {
            load()
        }
    }

    const toggle = (id: number) =>
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })

    const renderTasks = (group: ProjectTask[], milestoneId: number | null) => (
        <div className="space-y-2">
            {group.map((t, i) => (
                <ProjectTaskRow
                    key={t.id}
                    task={t}
                    milestones={milestones}
                    isFirst={i === 0}
                    isLast={i === group.length - 1}
                    onSave={saveTask}
                    onDelete={setTaskToDelete}
                    onMove={moveTask}
                />
            ))}
            <AddTask onAdd={title => addTask(milestoneId, title)} />
        </div>
    )

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

            {milestones.map((m, i) => (
                <div key={m.id} className="rounded-xl border border-sky-500/20 p-3 space-y-3">
                    <MilestoneHeader
                        milestone={m}
                        tasks={tasksOf(m.id)}
                        open={!collapsed.has(m.id)}
                        onToggle={() => toggle(m.id)}
                        isFirst={i === 0}
                        isLast={i === milestones.length - 1}
                        onSave={saveMilestone}
                        onDelete={setMilestoneToDelete}
                        onMove={moveMilestone}
                        autoFocus={newMilestoneId === m.id}
                    />
                    {!collapsed.has(m.id) && renderTasks(tasksOf(m.id), m.id)}
                </div>
            ))}

            <div className="rounded-xl border border-sky-500/10 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-foreground">Без этапа</span>
                    <ProgressBar tasks={unassigned} />
                </div>
                {renderTasks(unassigned, null)}
            </div>

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
