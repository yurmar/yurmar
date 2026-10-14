import { AlertCircle, ArrowLeft, Check, Loader2, Pin, Trash2 } from 'lucide-react'
import { apiUpdateNotebookProject, NotebookProject, NotebookProjectPatch } from '@/api/notebookProjects'
import ProjectForm from './ProjectForm'
import ProjectPlan from './ProjectPlan'
import ProjectLinks from './ProjectLinks'
import ProjectFiles from './ProjectFiles'
import ProjectNotes from './ProjectNotes'
import { useAutosave } from './useAutosave'

interface Props {
    project: NotebookProject
    onSaved: (project: NotebookProject) => void
    onCounts: (id: number, counts: { tasks_count?: number; done_tasks_count?: number; links_count?: number; files_count?: number; notes_count?: number }) => void
    onTogglePin: (project: NotebookProject) => void
    onDelete: (project: NotebookProject) => void
    onBack: () => void
    autoFocusName?: boolean
}

/** Правая панель: редактирование выбранного проекта с автосохранением. */
export default function ProjectEditor({ project, onSaved, onCounts, onTogglePin, onDelete, onBack, autoFocusName }: Props) {
    const { saveState, fieldErrors, schedule } = useAutosave<NotebookProjectPatch>({
        save: async patch => {
            const r = await apiUpdateNotebookProject(project.id, patch)
            onSaved(r.data)
        },
    })

    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-4 flex-shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="md:hidden flex items-center gap-1 text-sm text-sky-400"
                >
                    <ArrowLeft size={16} /> Назад
                </button>
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 min-w-[110px] justify-end">
                    {saveState === 'saving' && (<><Loader2 size={12} className="animate-spin" /> Сохранение…</>)}
                    {saveState === 'saved' && (<><Check size={12} className="text-emerald-400" /> Сохранено</>)}
                    {saveState === 'error' && (<><AlertCircle size={12} className="text-red-400" /> Не сохранено</>)}
                </div>
                <button
                    type="button"
                    onClick={() => onTogglePin(project)}
                    className={`p-1.5 rounded-lg transition-colors ${
                        project.is_pinned ? 'text-sky-500' : 'text-muted-foreground hover:text-sky-500'
                    }`}
                    aria-label={project.is_pinned ? 'Открепить проект' : 'Закрепить проект'}
                >
                    <Pin size={16} fill={project.is_pinned ? 'currentColor' : 'none'} />
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(project)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                    aria-label="Удалить проект"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <ProjectForm
                    project={project}
                    errors={fieldErrors}
                    autoFocusName={autoFocusName}
                    onChange={schedule}
                />
                <div className="mt-8 pt-6 border-t border-sky-500/15">
                    <ProjectPlan
                        projectId={project.id}
                        onCounts={counts => onCounts(project.id, counts)}
                    />
                </div>
                <div className="mt-8 pt-6 border-t border-sky-500/15">
                    <ProjectLinks
                        projectId={project.id}
                        onCount={links_count => onCounts(project.id, { links_count })}
                    />
                </div>
                <div className="mt-8 pt-6 border-t border-sky-500/15">
                    <ProjectFiles
                        projectId={project.id}
                        onCount={files_count => onCounts(project.id, { files_count })}
                    />
                </div>
                <div className="mt-8 pt-6 border-t border-sky-500/15">
                    <ProjectNotes
                        projectId={project.id}
                        onCount={notes_count => onCounts(project.id, { notes_count })}
                    />
                </div>
            </div>
        </>
    )
}
