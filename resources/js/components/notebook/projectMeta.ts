import type { MilestoneStatus, ProjectPriority, ProjectStatus, TaskStatus } from '@/api/notebookProjects'

export const PROJECT_UNTITLED = 'Без названия'

export const STATUS_OPTIONS: { value: ProjectStatus; label: string; dot: string }[] = [
    { value: 'idea', label: 'Идея', dot: 'bg-violet-400' },
    { value: 'planning', label: 'Планирование', dot: 'bg-sky-400' },
    { value: 'active', label: 'В работе', dot: 'bg-emerald-400' },
    { value: 'paused', label: 'Приостановлен', dot: 'bg-amber-400' },
    { value: 'completed', label: 'Завершён', dot: 'bg-teal-400' },
    { value: 'archived', label: 'Архив', dot: 'bg-slate-400' },
]

export const PRIORITY_OPTIONS: { value: ProjectPriority; label: string; rank: number }[] = [
    { value: 'low', label: 'Низкий', rank: 0 },
    { value: 'normal', label: 'Обычный', rank: 1 },
    { value: 'high', label: 'Высокий', rank: 2 },
]

export const statusMeta = (s: ProjectStatus) => STATUS_OPTIONS.find(o => o.value === s) ?? STATUS_OPTIONS[0]
export const priorityMeta = (p: ProjectPriority) => PRIORITY_OPTIONS.find(o => o.value === p) ?? PRIORITY_OPTIONS[1]

export function formatProjectDate(iso: string | null) {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'К выполнению' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Готово' },
    { value: 'cancelled', label: 'Отменена' },
]

export const MILESTONE_STATUS_OPTIONS: { value: MilestoneStatus; label: string }[] = [
    { value: 'todo', label: 'Не начат' },
    { value: 'in_progress', label: 'В работе' },
    { value: 'done', label: 'Завершён' },
]
