import { Calendar, Paperclip, Pencil, Pin, Trash2 } from 'lucide-react'
import type { NotebookProject } from '@/api/notebookProjects'
import { PROJECT_UNTITLED, formatProjectDate, priorityMeta, statusMeta } from './projectMeta'

interface Props {
    project: NotebookProject
    onOpen: (project: NotebookProject) => void
    onTogglePin: (project: NotebookProject) => void
    onDelete: (project: NotebookProject) => void
    active?: boolean
}

export default function ProjectCard({ project, onOpen, onTogglePin, onDelete, active }: Props) {
    const status = statusMeta(project.status)
    const progress =
        project.tasks_count && project.tasks_count > 0
            ? Math.round(((project.done_tasks_count ?? 0) / project.tasks_count) * 100)
            : null

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpen(project)}
            onKeyDown={e => { if (e.key === 'Enter') onOpen(project) }}
            className={`group w-full text-left card-block rounded-xl p-3.5 cursor-pointer transition-colors ${
                active ? 'border-sky-500/50 bg-sky-500/5' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground truncate">
                        {project.name.trim() || PROJECT_UNTITLED}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                        <span aria-hidden>·</span>
                        <span className="whitespace-nowrap">{priorityMeta(project.priority).label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onTogglePin(project) }}
                        className={`p-1 transition-opacity ${
                            project.is_pinned
                                ? 'text-sky-500'
                                : 'sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-sky-500'
                        }`}
                        aria-label={project.is_pinned ? 'Открепить проект' : 'Закрепить проект'}
                    >
                        <Pin size={14} fill={project.is_pinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onOpen(project) }}
                        className="p-1 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-sky-500 transition-opacity"
                        aria-label="Изменить проект"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={e => { e.stopPropagation(); onDelete(project) }}
                        className="p-1 sm:opacity-0 sm:group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                        aria-label="Удалить проект"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {project.description?.trim() && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{project.description}</p>
            )}

            {progress !== null && (
                <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-sky-500/15 overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {project.done_tasks_count}/{project.tasks_count} задач · {progress}%
                    </div>
                </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {project.deadline && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Calendar size={12} /> до {formatProjectDate(project.deadline)}
                    </span>
                )}
                {project.files_count !== undefined && (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <Paperclip size={12} /> {project.files_count}
                    </span>
                )}
                <span className="whitespace-nowrap">Изменён {formatProjectDate(project.updated_at)}</span>
            </div>
        </div>
    )
}
