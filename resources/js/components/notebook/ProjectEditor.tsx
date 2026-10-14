import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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

type TabKey = 'info' | 'plan' | 'links' | 'files' | 'notes'

const TABS: { value: TabKey; label: string; short?: string; count?: (p: NotebookProject) => number | undefined }[] = [
    { value: 'info', label: 'Общая информация', short: 'Общее' },
    { value: 'plan', label: 'План', count: p => p.tasks_count },
    { value: 'links', label: 'Ссылки', count: p => p.links_count },
    { value: 'files', label: 'Файлы', count: p => p.files_count },
    { value: 'notes', label: 'Записи', count: p => p.notes_count },
]

const TAB_STORAGE_KEY = 'notebook_project_tab'

const isTabKey = (value: string | null): value is TabKey => TABS.some(t => t.value === value)

function storedTab(): TabKey | null {
    try {
        const value = localStorage.getItem(TAB_STORAGE_KEY)
        return isTabKey(value) ? value : null
    } catch {
        return null
    }
}

/** Правая панель: редактирование выбранного проекта с автосохранением. */
export default function ProjectEditor({ project, onSaved, onCounts, onTogglePin, onDelete, onBack, autoFocusName }: Props) {
    // Вкладка хранится в адресе (?section=) и в localStorage: переживает перезагрузку страницы.
    const [params, setParams] = useSearchParams()
    const [tab, setTab] = useState<TabKey>(() => {
        const fromUrl = params.get('section')
        return isTabKey(fromUrl) ? fromUrl : storedTab() ?? 'info'
    })
    // Растёт после импорта плана: перечитываем форму и ссылки.
    const [importVersion, setImportVersion] = useState(0)
    // Вкладка монтируется при первом открытии и дальше остаётся в DOM скрытой — без повторной загрузки.
    const [visited, setVisited] = useState<Set<TabKey>>(() => new Set<TabKey>(['info', tab]))
    const selectTab = (next: TabKey) => {
        setTab(next)
        try {
            localStorage.setItem(TAB_STORAGE_KEY, next)
        } catch { /* хранилище недоступно — вкладка просто не запоминается */ }
        setParams(prev => {
            const nextParams = new URLSearchParams(prev)
            nextParams.set('section', next)
            return nextParams
        }, { replace: true })
        setVisited(prev => (prev.has(next) ? prev : new Set(prev).add(next)))
    }

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

            <div className="flex-shrink-0 mb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
                <div className="inline-flex min-w-full gap-1 border-b border-sky-500/15">
                    {TABS.map(t => {
                        const count = t.count?.(project)
                        const active = tab === t.value
                        return (
                            <button
                                key={t.value}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => selectTab(t.value)}
                                className={`px-2.5 sm:px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                    active
                                        ? 'border-sky-500 text-sky-500'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t.short ? (
                                    <>
                                        <span className="sm:hidden">{t.short}</span>
                                        <span className="hidden sm:inline">{t.label}</span>
                                    </>
                                ) : t.label}
                                {count !== undefined && count > 0 && (
                                    <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className={tab === 'info' ? '' : 'hidden'}>
                    <ProjectForm
                        key={importVersion}
                        project={project}
                        errors={fieldErrors}
                        autoFocusName={autoFocusName}
                        onChange={schedule}
                    />
                </div>
                {visited.has('plan') && (
                    <div className={tab === 'plan' ? '' : 'hidden'}>
                        <ProjectPlan
                            projectId={project.id}
                            onCounts={counts => onCounts(project.id, counts)}
                            onImported={imported => {
                                onSaved(imported)
                                setImportVersion(v => v + 1)
                            }}
                        />
                    </div>
                )}
                {visited.has('links') && (
                    <div className={tab === 'links' ? '' : 'hidden'}>
                        <ProjectLinks
                            projectId={project.id}
                            reloadToken={importVersion}
                            onCount={links_count => onCounts(project.id, { links_count })}
                        />
                    </div>
                )}
                {visited.has('files') && (
                    <div className={tab === 'files' ? '' : 'hidden'}>
                        <ProjectFiles
                            projectId={project.id}
                            onCount={files_count => onCounts(project.id, { files_count })}
                        />
                    </div>
                )}
                {visited.has('notes') && (
                    <div className={tab === 'notes' ? '' : 'hidden'}>
                        <ProjectNotes
                            projectId={project.id}
                            onCount={notes_count => onCounts(project.id, { notes_count })}
                        />
                    </div>
                )}
            </div>
        </>
    )
}
