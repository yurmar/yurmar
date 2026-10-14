import { DragEvent, useEffect, useRef, useState } from 'react'
import {
    Archive, Download, File as FileIcon, FileText, Image as ImageIcon, Loader2, Music, Trash2, UploadCloud, Video, Code,
} from 'lucide-react'
import {
    apiDeleteFile,
    apiDownloadFile,
    apiGetNotebookProject,
    apiUpdateFile,
    apiUploadFile,
    ProjectFile,
    ProjectFilePatch,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { MATERIAL_CATEGORY_OPTIONS } from './projectMeta'
import { useAutosave } from './useAutosave'

interface Props {
    projectId: number
    onCount: (count: number) => void
}

interface UploadItem {
    key: string
    name: string
    percent: number
    error?: string
}

const MAX_BYTES = 50 * 1024 * 1024
const small = 'input-field rounded-md px-2 py-1 text-base sm:text-xs'

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} ГБ`
}

function iconFor(file: ProjectFile) {
    const mime = file.mime_type ?? ''
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (mime.startsWith('image/')) return ImageIcon
    if (mime.startsWith('video/')) return Video
    if (mime.startsWith('audio/')) return Music
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return Archive
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'xls', 'xlsx', 'ppt', 'pptx', 'odt'].includes(ext)) return FileText
    if (['js', 'ts', 'tsx', 'jsx', 'json', 'html', 'css', 'py', 'java', 'cs', 'go', 'rs', 'sql', 'sh', 'yml', 'yaml', 'xml'].includes(ext)) return Code
    return FileIcon
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FileCard({ file, projectId, onSave, onDelete }: {
    file: ProjectFile
    projectId: number
    onSave: (id: number, patch: ProjectFilePatch) => Promise<unknown>
    onDelete: (file: ProjectFile) => void
}) {
    const [name, setName] = useState(file.name)
    const [description, setDescription] = useState(file.description ?? '')
    const [downloading, setDownloading] = useState(false)
    const { saveState, schedule, flush } = useAutosave<ProjectFilePatch>({
        save: patch => onSave(file.id, patch),
    })
    const Icon = iconFor(file)

    const download = async () => {
        setDownloading(true)
        try {
            const r = await apiDownloadFile(projectId, file.id)
            const url = URL.createObjectURL(r.data)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            document.body.appendChild(a)
            a.click()
            a.remove()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
        } catch { /* скачивание не удалось — состояние не меняем */ }
        finally { setDownloading(false) }
    }

    return (
        <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.03] p-3 space-y-2">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-sky-500 dark:text-sky-400" />
                </div>
                <div className="min-w-0 flex-1">
                    <input
                        value={name}
                        onChange={e => { setName(e.target.value); schedule({ name: e.target.value }) }}
                        maxLength={255}
                        className="w-full bg-transparent text-base sm:text-sm font-medium text-foreground focus:outline-none truncate"
                        aria-label="Имя файла"
                    />
                    <div className="text-xs text-muted-foreground">
                        {formatSize(file.size)} · {formatDate(file.created_at)}
                        {saveState === 'error' && <span className="text-red-400"> · не сохранено</span>}
                    </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                    <button
                        type="button"
                        onClick={download}
                        disabled={downloading}
                        className="p-1.5 text-muted-foreground hover:text-sky-500 disabled:opacity-50"
                        aria-label="Скачать файл"
                    >
                        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(file)}
                        className="p-1.5 text-muted-foreground hover:text-red-400"
                        aria-label="Удалить файл"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={file.category ?? ''}
                    onChange={e => { schedule({ category: (e.target.value || null) as ProjectFile['category'] }); void flush() }}
                    className={small}
                    aria-label="Категория файла"
                >
                    <option value="">Без категории</option>
                    {MATERIAL_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                    value={description}
                    onChange={e => { setDescription(e.target.value); schedule({ description: e.target.value || null }) }}
                    placeholder="Описание"
                    className={`flex-1 min-w-[140px] ${small}`}
                />
            </div>
        </div>
    )
}

export default function ProjectFiles({ projectId, onCount }: Props) {
    const [files, setFiles] = useState<ProjectFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [uploads, setUploads] = useState<UploadItem[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [toDelete, setToDelete] = useState<ProjectFile | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const load = () => {
        setLoading(true)
        setError(false)
        apiGetNotebookProject(projectId)
            .then(r => setFiles(r.data.files ?? []))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(load, [projectId])

    useEffect(() => {
        if (!loading) onCount(files.length)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files.length, loading])

    const save = async (id: number, patch: ProjectFilePatch) => {
        const r = await apiUpdateFile(projectId, id, patch)
        // Имя и описание — источник правды в поле ввода; обновляем только категорию.
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, category: r.data.category } : f)))
    }

    const patchUpload = (key: string, patch: Partial<UploadItem>) =>
        setUploads(prev => prev.map(u => (u.key === key ? { ...u, ...patch } : u)))

    const uploadAll = async (list: File[]) => {
        for (const file of list) {
            const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
            if (file.size > MAX_BYTES) {
                setUploads(prev => [...prev, { key, name: file.name, percent: 0, error: 'Больше 50 МБ' }])
                continue
            }
            setUploads(prev => [...prev, { key, name: file.name, percent: 0 }])
            try {
                const r = await apiUploadFile(projectId, file, percent => patchUpload(key, { percent }))
                setFiles(prev => [...prev, r.data])
                setUploads(prev => prev.filter(u => u.key !== key))
            } catch (e: unknown) {
                const errors = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })
                    .response?.data
                const message = errors?.errors ? Object.values(errors.errors)[0][0] : errors?.message ?? 'Не удалось загрузить'
                patchUpload(key, { error: message })
            }
        }
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const list = Array.from(e.dataTransfer.files)
        if (list.length) void uploadAll(list)
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        await apiDeleteFile(projectId, toDelete.id)
        setFiles(prev => prev.filter(f => f.id !== toDelete.id))
        setToDelete(null)
    }

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return (
        <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-foreground">Файлы</h2>
                {files.length > 0 && (
                    <span className="text-xs text-muted-foreground">{files.length} · {formatSize(totalSize)}</span>
                )}
            </div>

            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
                className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors ${
                    dragOver ? 'border-sky-500 bg-sky-500/10' : 'border-sky-500/25 hover:bg-sky-500/5'
                }`}
            >
                <UploadCloud size={22} className="mx-auto text-sky-500 dark:text-sky-400" />
                <p className="mt-1 text-sm text-foreground">Перетащите файлы сюда или нажмите, чтобы выбрать</p>
                <p className="text-xs text-muted-foreground">До 50 МБ на файл, до 500 МБ на проект</p>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={e => {
                        const list = Array.from(e.target.files ?? [])
                        e.target.value = ''
                        if (list.length) void uploadAll(list)
                    }}
                />
            </div>

            {uploads.map(u => (
                <div key={u.key} className="rounded-lg border border-sky-500/15 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-foreground">{u.name}</span>
                        {u.error ? (
                            <button
                                type="button"
                                onClick={() => setUploads(prev => prev.filter(x => x.key !== u.key))}
                                className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap"
                            >
                                Скрыть
                            </button>
                        ) : (
                            <span className="text-xs text-muted-foreground">{u.percent}%</span>
                        )}
                    </div>
                    {u.error ? (
                        <p className="text-xs text-red-400 mt-1">{u.error}</p>
                    ) : (
                        <div className="mt-1.5 h-1.5 rounded-full bg-sky-500/15 overflow-hidden">
                            <div className="h-full bg-sky-500 transition-all" style={{ width: `${u.percent}%` }} />
                        </div>
                    )}
                </div>
            ))}

            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : error ? (
                <div className="py-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Не удалось загрузить файлы</p>
                    <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">Повторить</button>
                </div>
            ) : files.length === 0 && uploads.length === 0 ? (
                <p className="text-sm text-muted-foreground">В хранилище проекта пока нет файлов.</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {files.map(f => (
                        <FileCard key={f.id} file={f} projectId={projectId} onSave={save} onDelete={setToDelete} />
                    ))}
                </div>
            )}

            <ConfirmModal
                open={!!toDelete}
                title="Удалить файл?"
                message={toDelete ? `«${toDelete.name}» будет удалён с сервера без возможности восстановления.` : undefined}
                confirmLabel="Удалить"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </section>
    )
}
