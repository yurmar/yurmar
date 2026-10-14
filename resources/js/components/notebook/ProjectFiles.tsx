import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import {
    apiCreateFile,
    apiDeleteFile,
    apiGetNotebookProject,
    apiUpdateFile,
    FileType,
    ProjectFile,
    ProjectFilePatch,
} from '@/api/notebookProjects'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { FILE_CATEGORY_OPTIONS, FILE_TYPE_OPTIONS } from './projectMeta'
import { useAutosave } from './useAutosave'

interface Props {
    projectId: number
    onCount: (count: number) => void
}

const small = 'input-field rounded-md px-2 py-1 text-base sm:text-xs'

const isHttp = (value: string | null) => !!value && /^https?:\/\//i.test(value)

function guessName(type: FileType, value: string) {
    const v = value.trim()
    if (type === 'url') {
        try {
            return new URL(v).hostname
        } catch {
            return v
        }
    }
    const parts = v.replace(/[\\/]+$/, '').split(/[\\/]/)
    return parts[parts.length - 1] || v
}

function FileRow({ file, onSave, onDelete }: {
    file: ProjectFile
    onSave: (id: number, patch: ProjectFilePatch) => Promise<unknown>
    onDelete: (file: ProjectFile) => void
}) {
    const [name, setName] = useState(file.name)
    const [value, setValue] = useState((file.type === 'url' ? file.url : file.path) ?? '')
    const [description, setDescription] = useState(file.description ?? '')
    const [tags, setTags] = useState((file.tags ?? []).join(', '))
    const [copied, setCopied] = useState(false)
    const { fieldErrors, saveState, schedule, flush } = useAutosave<ProjectFilePatch>({
        save: patch => onSave(file.id, patch),
    })

    const valueKey = file.type === 'url' ? 'url' : 'path'
    const error = fieldErrors[valueKey] ?? fieldErrors.name

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch { /* буфер обмена недоступен */ }
    }

    const changeType = (type: FileType) => {
        // Значение другого типа не сохраняем: поле нужно заполнить заново.
        setValue('')
        schedule({ type, [type === 'url' ? 'url' : 'path']: '' })
        void flush()
    }

    return (
        <div className="rounded-lg border border-sky-500/10 bg-sky-500/[0.03] p-2.5 space-y-2">
            <div className="flex items-center gap-2">
                <input
                    value={name}
                    onChange={e => { setName(e.target.value); schedule({ name: e.target.value }) }}
                    placeholder="Название"
                    maxLength={255}
                    className="flex-1 min-w-0 bg-transparent text-base sm:text-sm font-medium text-foreground focus:outline-none"
                />
                {saveState === 'error' && <span className="text-xs text-red-400 whitespace-nowrap">Не сохранено</span>}
                <button type="button" onClick={() => onDelete(file)} className="p-1 text-muted-foreground hover:text-red-400" aria-label="Удалить">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="flex items-center gap-2">
                <select
                    value={file.type}
                    onChange={e => changeType(e.target.value as FileType)}
                    className={small}
                    aria-label="Тип"
                >
                    {FILE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                    value={value}
                    onChange={e => { setValue(e.target.value); schedule({ [valueKey]: e.target.value }) }}
                    placeholder={file.type === 'url' ? 'https://…' : '/путь/к/файлу/или/каталогу'}
                    maxLength={file.type === 'url' ? 2048 : 1024}
                    className={`flex-1 min-w-0 ${small}`}
                />
                {file.type === 'local_path' ? (
                    <button type="button" onClick={copy} className="p-1.5 text-muted-foreground hover:text-sky-500" aria-label="Скопировать путь">
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                ) : (
                    isHttp(file.url) && (
                        <a href={file.url!} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:text-sky-500" aria-label="Открыть ссылку">
                            <ExternalLink size={14} />
                        </a>
                    )
                )}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex flex-wrap items-center gap-2">
                <select
                    value={file.category ?? ''}
                    onChange={e => { schedule({ category: (e.target.value || null) as ProjectFile['category'] }); void flush() }}
                    className={small}
                    aria-label="Категория"
                >
                    <option value="">Без категории</option>
                    {FILE_CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <input
                    value={tags}
                    onChange={e => {
                        setTags(e.target.value)
                        const list = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        schedule({ tags: list.length ? list : null })
                    }}
                    placeholder="Теги через запятую"
                    className={`flex-1 min-w-[140px] ${small}`}
                />
            </div>
            <input
                value={description}
                onChange={e => { setDescription(e.target.value); schedule({ description: e.target.value || null }) }}
                placeholder="Описание"
                className={`w-full ${small}`}
            />
        </div>
    )
}

export default function ProjectFiles({ projectId, onCount }: Props) {
    const [files, setFiles] = useState<ProjectFile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [addType, setAddType] = useState<FileType>('url')
    const [addValue, setAddValue] = useState('')
    const [addError, setAddError] = useState('')
    const [adding, setAdding] = useState(false)
    const [toDelete, setToDelete] = useState<ProjectFile | null>(null)

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
        // Поля ввода — источник правды; из ответа берём только то, что вводом не меняется.
        setFiles(prev => prev.map(f => (f.id === id ? { ...f, type: r.data.type, category: r.data.category } : f)))
    }

    const add = async () => {
        const value = addValue.trim()
        if (!value) return
        setAdding(true)
        setAddError('')
        try {
            const r = await apiCreateFile(projectId, {
                name: guessName(addType, value),
                type: addType,
                [addType === 'url' ? 'url' : 'path']: value,
            })
            setFiles(prev => [...prev, r.data])
            setAddValue('')
        } catch (e: unknown) {
            const errors = (e as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors
            setAddError(errors ? Object.values(errors)[0][0] : 'Не удалось добавить')
        } finally {
            setAdding(false)
        }
    }

    const confirmDelete = async () => {
        if (!toDelete) return
        await apiDeleteFile(projectId, toDelete.id)
        setFiles(prev => prev.filter(f => f.id !== toDelete.id))
        setToDelete(null)
    }

    return (
        <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Файлы и ссылки</h2>

            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : error ? (
                <div className="py-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Не удалось загрузить файлы</p>
                    <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">Повторить</button>
                </div>
            ) : (
                <>
                    {files.length === 0 && (
                        <p className="text-sm text-muted-foreground">Пока ничего нет — добавьте путь к каталогу или ссылку.</p>
                    )}
                    {files.map(f => (
                        <FileRow key={f.id} file={f} onSave={save} onDelete={setToDelete} />
                    ))}

                    <div className="flex items-center gap-2">
                        <select
                            value={addType}
                            onChange={e => setAddType(e.target.value as FileType)}
                            className={small}
                            aria-label="Тип нового материала"
                        >
                            {FILE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input
                            value={addValue}
                            onChange={e => setAddValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void add() } }}
                            placeholder={addType === 'url' ? 'https://… — Enter' : '/путь/к/каталогу — Enter'}
                            className="flex-1 min-w-0 input-field rounded-md px-2.5 py-1.5 text-base sm:text-sm"
                        />
                        <button
                            type="button"
                            onClick={add}
                            disabled={adding}
                            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-sky-500/15 text-sky-500 text-sm whitespace-nowrap hover:bg-sky-500/25 disabled:opacity-60"
                        >
                            <Plus size={14} /> Добавить
                        </button>
                    </div>
                    {addError && <p className="text-xs text-red-400">{addError}</p>}
                    <p className="text-xs text-muted-foreground">
                        Локальные пути — справочные, браузер их не открывает. Не храните здесь пароли и токены.
                    </p>
                </>
            )}

            <ConfirmModal
                open={!!toDelete}
                title="Удалить материал?"
                message={toDelete ? `«${toDelete.name}» будет удалён из проекта (сам файл не затрагивается).` : undefined}
                confirmLabel="Удалить"
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </section>
    )
}
