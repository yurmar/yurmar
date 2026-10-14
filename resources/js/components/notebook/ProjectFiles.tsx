import { DragEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
    Archive, ChevronRight, Download, File as FileIcon, FileText, Folder, FolderPlus, Home, Image as ImageIcon,
    Loader2, MoreVertical, Music, Pencil, Search, Trash2, UploadCloud, Video, X,
} from 'lucide-react'
import {
    apiCreateFolder,
    apiDeleteFile,
    apiDeleteFolder,
    apiDownloadFile,
    apiGetNotebookProject,
    apiUpdateFile,
    apiUpdateFolder,
    apiUploadFile,
    ProjectFile,
    ProjectFilePatch,
    ProjectFolder,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
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

type Kind = 'images' | 'video' | 'docs' | 'audio' | 'archives' | 'other'

const MAX_BYTES = 50 * 1024 * 1024
const QUOTA_BYTES = 500 * 1024 * 1024

const KINDS: { value: Kind; label: string; icon: typeof FileIcon; tone: string }[] = [
    { value: 'images', label: 'Изображения', icon: ImageIcon, tone: 'bg-violet-500/15 text-violet-500' },
    { value: 'video', label: 'Видео', icon: Video, tone: 'bg-sky-500/15 text-sky-500' },
    { value: 'docs', label: 'Документы', icon: FileText, tone: 'bg-amber-500/15 text-amber-500' },
    { value: 'audio', label: 'Музыка', icon: Music, tone: 'bg-emerald-500/15 text-emerald-500' },
    { value: 'archives', label: 'Архивы', icon: Archive, tone: 'bg-fuchsia-500/15 text-fuchsia-500' },
    { value: 'other', label: 'Прочее', icon: FileIcon, tone: 'bg-slate-500/15 text-slate-400' },
]

const kindMeta = (k: Kind) => KINDS.find(x => x.value === k)!

function kindOf(file: ProjectFile): Kind {
    const mime = file.mime_type ?? ''
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (mime.startsWith('image/')) return 'images'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext)) return 'archives'
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt', 'xls', 'xlsx', 'csv', 'ppt', 'pptx'].includes(ext)) return 'docs'
    return 'other'
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} ГБ`
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function plural(n: number, one: string, few: string, many: string) {
    const m10 = n % 10
    const m100 = n % 100
    if (m10 === 1 && m100 !== 11) return one
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
    return many
}

function FileDetails({ file, folders, path, projectId, onSave, onMove, onDelete, onClose }: {
    file: ProjectFile
    folders: ProjectFolder[]
    path: string
    projectId: number
    onSave: (id: number, patch: ProjectFilePatch) => Promise<unknown>
    onMove: (file: ProjectFile, folderId: number | null) => void
    onDelete: (file: ProjectFile) => void
    onClose: () => void
}) {
    const [name, setName] = useState(file.name)
    const [description, setDescription] = useState(file.description ?? '')
    const [downloading, setDownloading] = useState(false)
    const { saveState, schedule } = useAutosave<ProjectFilePatch>({ save: patch => onSave(file.id, patch) })
    const meta = kindMeta(kindOf(file))
    const Icon = meta.icon

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
        } catch { /* скачивание не удалось */ }
        finally { setDownloading(false) }
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : '—'

    return (
        <div className="rounded-xl border border-sky-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Сведения о файле</h3>
                <button type="button" onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Закрыть сведения">
                    <X size={16} />
                </button>
            </div>
            <div className="flex flex-col items-center text-center gap-2 py-2">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${meta.tone}`}>
                    <Icon size={30} />
                </div>
                <input
                    value={name}
                    onChange={e => { setName(e.target.value); schedule({ name: e.target.value }) }}
                    maxLength={255}
                    className="w-full bg-transparent text-center font-semibold text-base sm:text-sm text-foreground focus:outline-none"
                    aria-label="Имя файла"
                />
                <div className="text-xs text-muted-foreground">
                    {formatSize(file.size)} | {formatDate(file.created_at)}
                    {saveState === 'error' && <span className="text-red-400"> · не сохранено</span>}
                </div>
            </div>
            <dl className="text-sm space-y-2">
                <div><dt className="text-xs text-muted-foreground">Формат</dt><dd className="text-foreground">{ext}</dd></div>
                <div>
                    <dt className="text-xs text-muted-foreground mb-1">Описание</dt>
                    <dd>
                        <textarea
                            value={description}
                            onChange={e => { setDescription(e.target.value); schedule({ description: e.target.value || null }) }}
                            rows={3}
                            placeholder="Добавьте описание"
                            className="w-full input-field rounded-md px-2 py-1.5 text-base sm:text-sm resize-y"
                        />
                    </dd>
                </div>
                <div><dt className="text-xs text-muted-foreground">Расположение</dt><dd className="text-foreground break-all">{path}</dd></div>
                <div>
                    <dt className="text-xs text-muted-foreground mb-1">Переместить в папку</dt>
                    <dd>
                        <select
                            value={file.folder_id ?? ''}
                            onChange={e => onMove(file, e.target.value ? Number(e.target.value) : null)}
                            className="w-full input-field rounded-md px-2 py-1.5 text-base sm:text-sm"
                        >
                            <option value="">Корень хранилища</option>
                            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                    </dd>
                </div>
            </dl>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={download}
                    disabled={downloading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 disabled:opacity-60"
                >
                    {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Скачать
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(file)}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-red-500/30 text-red-400 text-sm whitespace-nowrap hover:bg-red-500/10"
                >
                    <Trash2 size={14} /> Удалить
                </button>
            </div>
        </div>
    )
}

export default function ProjectFiles({ projectId, onCount }: Props) {
    const [files, setFiles] = useState<ProjectFile[]>([])
    const [folders, setFolders] = useState<ProjectFolder[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [currentFolder, setCurrentFolder] = useState<number | null>(null)
    const [query, setQuery] = useState('')
    const [kindFilter, setKindFilter] = useState<Kind | null>(null)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [uploads, setUploads] = useState<UploadItem[]>([])
    const [dragOver, setDragOver] = useState(false)
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [folderName, setFolderName] = useState('')
    const [renamingId, setRenamingId] = useState<number | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const [menuId, setMenuId] = useState<number | null>(null)
    const [dragFileId, setDragFileId] = useState<number | null>(null)
    const [dropFolderId, setDropFolderId] = useState<number | null>(null)
    const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null)
    const [folderToDelete, setFolderToDelete] = useState<ProjectFolder | null>(null)
    const [actionError, setActionError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const load = () => {
        setLoading(true)
        setError(false)
        apiGetNotebookProject(projectId)
            .then(r => {
                setFiles(r.data.files ?? [])
                setFolders(r.data.folders ?? [])
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(load, [projectId])

    useEffect(() => {
        if (!loading) onCount(files.length)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [files.length, loading])

    const folderById = useMemo(() => new Map(folders.map(f => [f.id, f])), [folders])

    const pathOf = (folderId: number | null): ProjectFolder[] => {
        const result: ProjectFolder[] = []
        let id = folderId
        while (id !== null) {
            const f = folderById.get(id)
            if (!f) break
            result.unshift(f)
            id = f.parent_id
        }
        return result
    }

    const descendantIds = (id: number): number[] => {
        const ids = [id]
        folders.filter(f => f.parent_id === id).forEach(c => ids.push(...descendantIds(c.id)))
        return ids
    }

    const folderStats = (id: number) => {
        const ids = new Set(descendantIds(id))
        const inside = files.filter(f => f.folder_id !== null && ids.has(f.folder_id))
        return { count: inside.length, size: inside.reduce((s, f) => s + f.size, 0) }
    }

    const kindStats = useMemo(() => {
        const stats = new Map<Kind, number>()
        files.forEach(f => stats.set(kindOf(f), (stats.get(kindOf(f)) ?? 0) + f.size))
        return stats
    }, [files])

    const totalSize = files.reduce((s, f) => s + f.size, 0)
    const searching = query.trim() !== '' || kindFilter !== null

    const visibleFiles = useMemo(() => {
        const q = query.trim().toLowerCase()
        return files.filter(f => {
            if (kindFilter && kindOf(f) !== kindFilter) return false
            if (q) return f.name.toLowerCase().includes(q)
            // Без поиска и фильтра показываем содержимое текущей папки;
            // при поиске или фильтре типа — файлы по всему хранилищу.
            return kindFilter ? true : f.folder_id === currentFolder
        })
    }, [files, query, kindFilter, currentFolder])

    const subfolders = folders.filter(f => f.parent_id === currentFolder)
    const selected = files.find(f => f.id === selectedId) ?? null
    const breadcrumbs = pathOf(currentFolder)

    const locationOf = (file: ProjectFile) =>
        ['Хранилище', ...pathOf(file.folder_id).map(f => f.name), file.name].join(' / ')

    const apiErrorMessage = (e: unknown, fallback: string) => {
        const data = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response?.data
        return data?.errors ? Object.values(data.errors)[0][0] : data?.message ?? fallback
    }

    const saveFile = async (id: number, patch: ProjectFilePatch) => {
        const r = await apiUpdateFile(projectId, id, patch)
        // Имя и описание — источник правды в поле ввода; из ответа берём серверные поля.
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, updated_at: r.data.updated_at } : f)))
    }

    const moveFile = async (file: ProjectFile, folderId: number | null) => {
        if (file.folder_id === folderId) return
        setFiles(prev => prev.map(f => (f.id === file.id ? { ...f, folder_id: folderId } : f)))
        try {
            await apiUpdateFile(projectId, file.id, { folder_id: folderId })
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Не удалось переместить файл'))
            load()
        }
    }

    const patchUpload = (key: string, patch: Partial<UploadItem>) =>
        setUploads(prev => prev.map(u => (u.key === key ? { ...u, ...patch } : u)))

    const uploadAll = async (list: File[]) => {
        const targetFolder = currentFolder
        for (const file of list) {
            const key = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`
            if (file.size > MAX_BYTES) {
                setUploads(prev => [...prev, { key, name: file.name, percent: 0, error: 'Больше 50 МБ' }])
                continue
            }
            setUploads(prev => [...prev, { key, name: file.name, percent: 0 }])
            try {
                const r = await apiUploadFile(projectId, file, targetFolder, percent => patchUpload(key, { percent }))
                setFiles(prev => [...prev, r.data])
                setUploads(prev => prev.filter(u => u.key !== key))
            } catch (e) {
                patchUpload(key, { error: apiErrorMessage(e, 'Не удалось загрузить') })
            }
        }
    }

    const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        if (e.dataTransfer.files.length) void uploadAll(Array.from(e.dataTransfer.files))
    }

    const createFolder = async () => {
        const name = folderName.trim()
        if (!name) {
            setCreatingFolder(false)
            return
        }
        try {
            const r = await apiCreateFolder(projectId, { name, parent_id: currentFolder })
            setFolders(prev => [...prev, r.data])
            setFolderName('')
            setCreatingFolder(false)
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Не удалось создать папку'))
        }
    }

    const commitRename = async () => {
        const id = renamingId
        const name = renameValue.trim()
        setRenamingId(null)
        if (id === null || !name) return
        const folder = folderById.get(id)
        if (!folder || folder.name === name) return
        try {
            const r = await apiUpdateFolder(projectId, id, { name })
            setFolders(prev => prev.map(f => (f.id === id ? r.data : f)))
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Не удалось переименовать папку'))
        }
    }

    const confirmDeleteFile = async () => {
        if (!fileToDelete) return
        try {
            await apiDeleteFile(projectId, fileToDelete.id)
            setFiles(prev => prev.filter(f => f.id !== fileToDelete.id))
            if (selectedId === fileToDelete.id) setSelectedId(null)
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Не удалось удалить файл'))
        }
        setFileToDelete(null)
    }

    const confirmDeleteFolder = async () => {
        if (!folderToDelete) return
        const ids = new Set(descendantIds(folderToDelete.id))
        try {
            await apiDeleteFolder(projectId, folderToDelete.id)
            setFolders(prev => prev.filter(f => !ids.has(f.id)))
            setFiles(prev => prev.filter(f => f.folder_id === null || !ids.has(f.folder_id)))
            if (currentFolder !== null && ids.has(currentFolder)) setCurrentFolder(folderToDelete.parent_id)
            if (selected && selected.folder_id !== null && ids.has(selected.folder_id)) setSelectedId(null)
        } catch (e) {
            setActionError(apiErrorMessage(e, 'Не удалось удалить папку'))
        }
        setFolderToDelete(null)
    }

    const onFolderKey = (e: KeyboardEvent, handler: () => void) => {
        if (e.key === 'Enter') handler()
        if (e.key === 'Escape') {
            setCreatingFolder(false)
            setRenamingId(null)
        }
    }

    const quotaPercent = Math.min(100, Math.round((totalSize / QUOTA_BYTES) * 100))

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">Файлы</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setCreatingFolder(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-sky-500/30 text-sky-500 text-sm font-medium whitespace-nowrap hover:bg-sky-500/10"
                    >
                        <FolderPlus size={14} /> Создать папку
                    </button>
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600"
                    >
                        <UploadCloud size={14} /> Загрузить файлы
                    </button>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3 items-center">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Поиск файлов"
                        className="w-full input-field rounded-lg pl-9 pr-8 py-2 text-base sm:text-sm"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Очистить поиск">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div>
                    <div className="h-1.5 rounded-full bg-sky-500/15 overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${quotaPercent}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {formatSize(totalSize)} из {formatSize(QUOTA_BYTES)}
                    </div>
                </div>
            </div>

            {actionError && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">
                    <span>{actionError}</span>
                    <button type="button" onClick={() => setActionError('')} aria-label="Скрыть"><X size={14} /></button>
                </div>
            )}

            <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Мои файлы</p>
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {KINDS.map(k => {
                        const Icon = k.icon
                        const active = kindFilter === k.value
                        return (
                            <button
                                key={k.value}
                                type="button"
                                onClick={() => setKindFilter(active ? null : k.value)}
                                className={`flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors border min-w-0 ${
                                    active ? 'border-sky-500/60 bg-sky-500/10' : 'border-transparent bg-sky-500/[0.05] hover:bg-sky-500/10'
                                }`}
                            >
                                <span className="block w-full text-[10px] sm:text-xs font-medium text-foreground leading-tight break-words">{k.label}</span>
                                <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.tone}`}>
                                    <Icon size={18} />
                                </span>
                                <span className="block text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                    {formatSize(kindStats.get(k.value) ?? 0)}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-sm">
                <button
                    type="button"
                    onClick={() => { setCurrentFolder(null); setKindFilter(null); setQuery('') }}
                    className={`inline-flex items-center gap-1 ${currentFolder === null ? 'text-foreground font-medium' : 'text-sky-400 hover:text-sky-300'}`}
                >
                    <Home size={14} /> Хранилище
                </button>
                {breadcrumbs.map((f, i) => (
                    <span key={f.id} className="inline-flex items-center gap-1">
                        <ChevronRight size={14} className="text-muted-foreground" />
                        <button
                            type="button"
                            onClick={() => setCurrentFolder(f.id)}
                            className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-sky-400 hover:text-sky-300'}
                        >
                            {f.name}
                        </button>
                    </span>
                ))}
            </div>

            {!searching && (subfolders.length > 0 || creatingFolder) && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Папки</p>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {creatingFolder && (
                            <div className="rounded-xl border border-sky-500/40 p-3">
                                <Folder size={28} className="text-sky-500 mb-2" />
                                <input
                                    autoFocus
                                    value={folderName}
                                    onChange={e => setFolderName(e.target.value)}
                                    onKeyDown={e => onFolderKey(e, createFolder)}
                                    onBlur={createFolder}
                                    placeholder="Название папки"
                                    maxLength={255}
                                    className="w-full input-field rounded-md px-2 py-1 text-base sm:text-sm"
                                />
                            </div>
                        )}
                        {subfolders.map(folder => {
                            const stats = folderStats(folder.id)
                            const isDrop = dropFolderId === folder.id
                            return (
                                <div
                                    key={folder.id}
                                    onClick={() => renamingId === null && setCurrentFolder(folder.id)}
                                    onDragOver={e => { if (dragFileId !== null) { e.preventDefault(); setDropFolderId(folder.id) } }}
                                    onDragLeave={() => setDropFolderId(null)}
                                    onDrop={e => {
                                        e.preventDefault()
                                        setDropFolderId(null)
                                        const file = files.find(f => f.id === dragFileId)
                                        setDragFileId(null)
                                        if (file) void moveFile(file, folder.id)
                                    }}
                                    className={`relative cursor-pointer rounded-xl border p-3 transition-colors ${
                                        isDrop ? 'border-sky-500 bg-sky-500/10' : 'border-sky-500/15 bg-sky-500/[0.04] hover:bg-sky-500/10'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        {renamingId === folder.id ? (
                                            <input
                                                autoFocus
                                                value={renameValue}
                                                onClick={e => e.stopPropagation()}
                                                onChange={e => setRenameValue(e.target.value)}
                                                onKeyDown={e => onFolderKey(e, commitRename)}
                                                onBlur={commitRename}
                                                maxLength={255}
                                                className="min-w-0 flex-1 input-field rounded-md px-2 py-1 text-base sm:text-sm"
                                            />
                                        ) : (
                                            <div className="min-w-0 flex-1 font-medium text-foreground truncate pt-0.5" title={folder.name}>
                                                {folder.name}
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); setMenuId(menuId === folder.id ? null : folder.id) }}
                                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-sky-500/10 flex-shrink-0"
                                            aria-label="Действия с папкой"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                    {menuId === folder.id && (
                                        <div className="absolute right-2 top-10 z-10 rounded-lg border border-sky-500/20 bg-card shadow-lg py-1 min-w-[150px]" onClick={e => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => { setMenuId(null); setRenamingId(folder.id); setRenameValue(folder.name) }}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-sky-500/10"
                                            >
                                                <Pencil size={14} /> Переименовать
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setMenuId(null); setFolderToDelete(folder) }}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                                            >
                                                <Trash2 size={14} /> Удалить
                                            </button>
                                        </div>
                                    )}
                                    <Folder size={34} className="text-sky-500 my-2" fill="currentColor" fillOpacity={0.2} />
                                    <div className="text-xs text-muted-foreground">
                                        {stats.count} {plural(stats.count, 'файл', 'файла', 'файлов')}
                                    </div>
                                    <div className="text-sm font-medium text-foreground">{formatSize(stats.size)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div
                onDragOver={e => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setDragOver(true) } }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`rounded-xl border-2 border-dashed px-4 py-3 text-center text-sm transition-colors ${
                    dragOver ? 'border-sky-500 bg-sky-500/10 text-foreground' : 'border-sky-500/20 text-muted-foreground'
                }`}
            >
                Перетащите файлы сюда — они попадут в {currentFolder === null ? 'корень хранилища' : `папку «${folderById.get(currentFolder)?.name ?? ''}»`}. До 50 МБ на файл, до 500 МБ на проект.
            </div>

            {uploads.map(u => (
                <div key={u.key} className="rounded-lg border border-sky-500/15 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-foreground">{u.name}</span>
                        {u.error ? (
                            <button type="button" onClick={() => setUploads(prev => prev.filter(x => x.key !== u.key))} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
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
            ) : (
                <div className={`grid gap-3 ${selected ? 'lg:grid-cols-[1fr_280px]' : 'grid-cols-1'}`}>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            {searching ? 'Результаты' : 'Файлы'}
                        </p>
                        {visibleFiles.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                                {searching ? 'Ничего не найдено.' : 'В этой папке пока нет файлов.'}
                            </p>
                        ) : (
                            <div className="rounded-xl border border-sky-500/15 overflow-x-auto custom-scroll">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-muted-foreground border-b border-sky-500/15">
                                            <th className="px-3 py-2 font-medium">Имя</th>
                                            <th className="px-3 py-2 font-medium hidden sm:table-cell">Категория</th>
                                            <th className="px-3 py-2 font-medium whitespace-nowrap">Размер</th>
                                            <th className="px-3 py-2 font-medium whitespace-nowrap hidden sm:table-cell">Изменён</th>
                                            <th className="px-3 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleFiles.map(file => {
                                            const meta = kindMeta(kindOf(file))
                                            const Icon = meta.icon
                                            return (
                                                <tr
                                                    key={file.id}
                                                    draggable
                                                    onDragStart={() => setDragFileId(file.id)}
                                                    onDragEnd={() => { setDragFileId(null); setDropFolderId(null) }}
                                                    onClick={() => setSelectedId(file.id === selectedId ? null : file.id)}
                                                    className={`cursor-pointer border-b last:border-0 border-sky-500/10 transition-colors ${
                                                        file.id === selectedId ? 'bg-sky-500/10' : 'odd:bg-black/[0.03] odd:dark:bg-white/[0.04] hover:bg-sky-500/10'
                                                    }`}
                                                >
                                                    <td className="px-3 py-2">
                                                        <span className="flex items-center gap-2 min-w-0">
                                                            <span className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta.tone}`}>
                                                                <Icon size={14} />
                                                            </span>
                                                            <span className="truncate max-w-[220px] text-foreground">{file.name}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground whitespace-nowrap">{meta.label}</td>
                                                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatSize(file.size)}</td>
                                                    <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground whitespace-nowrap">{formatDate(file.updated_at)}</td>
                                                    <td className="px-3 py-2 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={e => { e.stopPropagation(); setFileToDelete(file) }}
                                                            className="p-1 text-muted-foreground hover:text-red-400"
                                                            aria-label="Удалить файл"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    {selected && (
                        <FileDetails
                            key={selected.id}
                            file={selected}
                            folders={folders}
                            path={locationOf(selected)}
                            projectId={projectId}
                            onSave={saveFile}
                            onMove={moveFile}
                            onDelete={setFileToDelete}
                            onClose={() => setSelectedId(null)}
                        />
                    )}
                </div>
            )}

            <ConfirmModal
                open={!!fileToDelete}
                title="Удалить файл?"
                message={fileToDelete ? `«${fileToDelete.name}» будет удалён с сервера без возможности восстановления.` : undefined}
                confirmLabel="Удалить"
                onConfirm={confirmDeleteFile}
                onClose={() => setFileToDelete(null)}
            />
            <ConfirmModal
                open={!!folderToDelete}
                title="Удалить папку?"
                message={folderToDelete ? `Папка «${folderToDelete.name}» и все файлы внутри неё будут удалены с сервера.` : undefined}
                confirmLabel="Удалить"
                onConfirm={confirmDeleteFolder}
                onClose={() => setFolderToDelete(null)}
            />
        </section>
    )
}
