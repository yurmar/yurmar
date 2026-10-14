import { useState } from 'react'
import { GripVertical, Trash2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProjectMilestone, ProjectTask, ProjectTaskPatch } from '@/api/notebookProjects'
import { PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './projectMeta'
import { useAutosave } from './useAutosave'

interface Props {
    task: ProjectTask
    milestones: ProjectMilestone[]
    onSave: (id: number, patch: ProjectTaskPatch) => Promise<unknown>
    onDelete: (task: ProjectTask) => void
}

const small = 'input-field rounded-md px-2 py-1 text-base sm:text-xs'

export default function ProjectTaskRow({ task, milestones, onSave, onDelete }: Props) {
    const [title, setTitle] = useState(task.title)
    const [dueDate, setDueDate] = useState(task.due_date ?? '')
    const { saveState, schedule, flush } = useAutosave<ProjectTaskPatch>({
        save: patch => onSave(task.id, patch),
    })

    const saveNow = (patch: ProjectTaskPatch) => {
        schedule(patch)
        void flush()
    }

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `t-${task.id}`,
        data: { type: 'task' },
    })

    const done = task.status === 'done'
    const cancelled = task.status === 'cancelled'

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`rounded-lg border border-sky-500/10 bg-sky-500/[0.03] p-2.5 ${
                isDragging ? 'opacity-60 shadow-lg relative z-10' : ''
            }`}
        >
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="touch-none cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-sky-500 flex-shrink-0"
                    aria-label="Перетащить задачу"
                >
                    <GripVertical size={14} />
                </button>
                <input
                    type="checkbox"
                    checked={done}
                    onChange={e => saveNow({ status: e.target.checked ? 'done' : 'todo' })}
                    className="w-4 h-4 accent-sky-500 flex-shrink-0"
                    aria-label="Задача выполнена"
                />
                <input
                    value={title}
                    onChange={e => {
                        setTitle(e.target.value)
                        schedule({ title: e.target.value })
                    }}
                    placeholder="Название задачи"
                    maxLength={255}
                    className={`flex-1 min-w-0 bg-transparent text-base sm:text-sm focus:outline-none ${
                        done || cancelled ? 'line-through text-muted-foreground' : 'text-foreground'
                    } ${saveState === 'error' ? 'underline decoration-red-400' : ''}`}
                />
                <div className="flex items-center flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => onDelete(task)}
                        className="p-1 text-muted-foreground hover:text-red-400"
                        aria-label="Удалить задачу"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 pl-12">
                <select
                    value={task.status}
                    onChange={e => saveNow({ status: e.target.value as ProjectTask['status'] })}
                    className={small}
                    aria-label="Статус задачи"
                >
                    {TASK_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                    value={task.priority}
                    onChange={e => saveNow({ priority: e.target.value as ProjectTask['priority'] })}
                    className={small}
                    aria-label="Приоритет задачи"
                >
                    {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                    type="date"
                    value={dueDate}
                    onChange={e => {
                        setDueDate(e.target.value)
                        schedule({ due_date: e.target.value || null })
                    }}
                    className={small}
                    aria-label="Срок задачи"
                />
                <select
                    value={task.milestone_id ?? ''}
                    onChange={e => saveNow({ milestone_id: e.target.value ? Number(e.target.value) : null })}
                    className={`${small} max-w-[180px]`}
                    aria-label="Этап задачи"
                >
                    <option value="">Без этапа</option>
                    {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
            </div>
        </div>
    )
}
