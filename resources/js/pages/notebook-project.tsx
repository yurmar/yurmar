import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AlertCircle, ArrowLeft, Check, Loader2, Pin, Trash2 } from 'lucide-react'
import { RootState } from '@/store'
import {
    apiDeleteNotebookProject,
    apiGetNotebookProject,
    apiUpdateNotebookProject,
    NotebookProject,
    NotebookProjectPatch,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProjectForm from '@/components/notebook/ProjectForm'
import { useAutosave } from '@/components/notebook/useAutosave'
import { PROJECT_UNTITLED } from '@/components/notebook/projectMeta'

const BACK_URL = '/notebook?tab=projects'

export default function NotebookProjectPage() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)
    const { projectId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const id = Number(projectId)

    const [project, setProject] = useState<NotebookProject | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const { saveState, fieldErrors, schedule, flush } = useAutosave<NotebookProjectPatch>({
        save: patch => apiUpdateNotebookProject(id, patch),
    })

    useEffect(() => {
        if (!isAuth) return
        setLoading(true)
        apiGetNotebookProject(id)
            .then(r => setProject(r.data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false))
    }, [isAuth, id])

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await apiDeleteNotebookProject(id)
            navigate(BACK_URL, { replace: true })
        } finally {
            setDeleting(false)
        }
    }

    const handleBack = async () => {
        await flush()
        navigate(BACK_URL)
    }

    const handleTogglePin = () => {
        if (!project) return
        const next = !project.is_pinned
        setProject({ ...project, is_pinned: next })
        schedule({ is_pinned: next })
    }

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />
    if (notFound) return <Navigate to={BACK_URL} replace />

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-1.5 text-sm text-sky-400 hover:text-sky-300 whitespace-nowrap"
                    >
                        <ArrowLeft size={16} /> К проектам
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-[96px] justify-end">
                            {saveState === 'saving' && (<><Loader2 size={12} className="animate-spin" /> Сохранение…</>)}
                            {saveState === 'saved' && (<><Check size={12} className="text-emerald-400" /> Сохранено</>)}
                            {saveState === 'error' && (<><AlertCircle size={12} className="text-red-400" /> Не сохранено</>)}
                        </div>
                        {project && (
                            <button
                                type="button"
                                onClick={handleTogglePin}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    project.is_pinned ? 'text-sky-500' : 'text-muted-foreground hover:text-sky-500'
                                }`}
                                aria-label={project.is_pinned ? 'Открепить проект' : 'Закрепить проект'}
                            >
                                <Pin size={16} fill={project.is_pinned ? 'currentColor' : 'none'} />
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 transition-colors"
                            aria-label="Удалить проект"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <div className="card-block rounded-2xl p-5 sm:p-6">
                    {loading || !project ? (
                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : (
                        <ProjectForm
                            key={project.id}
                            project={project}
                            errors={fieldErrors}
                            autoFocusName={!!(location.state as { justCreated?: boolean } | null)?.justCreated}
                            onChange={schedule}
                        />
                    )}
                </div>
            </div>

            <ConfirmModal
                open={confirmDelete}
                title="Удалить проект?"
                message={project ? `«${project.name.trim() || PROJECT_UNTITLED}» будет удалён.` : undefined}
                confirmLabel="Удалить"
                confirming={deleting}
                onConfirm={handleDelete}
                onClose={() => setConfirmDelete(false)}
            />
        </div>
    )
}
