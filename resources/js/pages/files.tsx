import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Download, FileDown, FileText, Pencil, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import {
    apiGetDocuments,
    apiCreateDocument,
    apiUpdateDocument,
    apiDeleteDocument,
    apiDocumentDownloadUrl,
    DocumentItem,
} from '@/api/documents'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { cn } from '@/lib/utils'

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} Б`
    const units = ['КБ', 'МБ', 'ГБ']
    let value = bytes
    let i = -1
    do {
        value /= 1024
        i++
    } while (value >= 1024 && i < units.length - 1)
    return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`
}

function formatDate(str: string): string {
    return new Date(str).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function UploadModal({ open, onClose, onUploaded }: { open: boolean; onClose: () => void; onUploaded: (doc: DocumentItem) => void }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            setTitle('')
            setDescription('')
            setFile(null)
            setError(null)
        }
    }, [open])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleSave = async () => {
        if (!title.trim() || !file) return
        setSaving(true)
        setError(null)
        try {
            const formData = new FormData()
            formData.append('title', title)
            formData.append('description', description)
            formData.append('file', file)
            const r = await apiCreateDocument(formData)
            onUploaded(r.data)
            onClose()
        } catch {
            setError('Не удалось загрузить файл. Попробуйте ещё раз.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    data-no-ptr
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className={cn(
                            'relative z-10 w-full max-w-lg rounded-2xl border border-white/10',
                            'bg-[#0d1a30] dark:bg-[#0d1a30] shadow-2xl p-6',
                            'light:bg-white light:border-gray-200'
                        )}
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">Добавить файл</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Название</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Например: Прайс-лист"
                                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Описание</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Необязательно"
                                    rows={3}
                                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Файл</label>
                                {file ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <FileText size={18} className="text-sky-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFile(null)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => inputRef.current?.click()}
                                        className="w-full h-28 rounded-xl border-2 border-dashed border-white/15 hover:border-sky-500/50 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-sky-400"
                                    >
                                        <UploadCloud size={22} />
                                        <span className="text-xs font-medium">Нажмите, чтобы выбрать файл</span>
                                        <span className="text-[10px]">до 50 МБ</span>
                                    </button>
                                )}
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

                        <div className="flex gap-3 mt-6 justify-end">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                Отмена
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !title.trim() || !file}
                                className="px-4 py-2 rounded-lg text-sm bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Загрузка...' : 'Загрузить'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

function EditModal({
    open,
    doc,
    onClose,
    onSaved,
}: {
    open: boolean
    doc: DocumentItem | null
    onClose: () => void
    onSaved: (doc: DocumentItem) => void
}) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [newFile, setNewFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open && doc) {
            setTitle(doc.title)
            setDescription(doc.description ?? '')
            setNewFile(null)
            setError(null)
        }
    }, [open, doc])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        window.document.addEventListener('keydown', onKey)
        return () => window.document.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleSave = async () => {
        if (!doc || !title.trim()) return
        setSaving(true)
        setError(null)
        try {
            const r = await apiUpdateDocument(doc.id, { title, description, file: newFile })
            onSaved(r.data)
            onClose()
        } catch {
            setError('Не удалось сохранить изменения. Попробуйте ещё раз.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {open && doc && (
                <motion.div
                    data-no-ptr
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className={cn(
                            'relative z-10 w-full max-w-lg rounded-2xl border border-white/10',
                            'bg-[#0d1a30] dark:bg-[#0d1a30] shadow-2xl p-6',
                            'light:bg-white light:border-gray-200'
                        )}
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-white">Редактировать файл</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Название</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Описание</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Необязательно"
                                    rows={3}
                                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Файл</label>
                                {newFile ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <FileText size={18} className="text-sky-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">{newFile.name}</p>
                                                <p className="text-xs text-gray-500">{formatSize(newFile.size)} · новый файл</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setNewFile(null)}
                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <FileText size={18} className="text-sky-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-white truncate">{doc.original_name}</p>
                                                <p className="text-xs text-gray-500">{formatSize(doc.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => inputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/25 transition-colors shrink-0"
                                        >
                                            <UploadCloud size={13} /> Заменить
                                        </button>
                                    </div>
                                )}
                                <input
                                    ref={inputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={e => setNewFile(e.target.files?.[0] ?? null)}
                                />
                            </div>
                        </div>

                        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

                        <div className="flex gap-3 mt-6 justify-end">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                Отмена
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !title.trim()}
                                className="px-4 py-2 rounded-lg text-sm bg-sky-500 hover:bg-sky-400 text-white font-medium transition-colors disabled:opacity-60"
                            >
                                {saving ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default function Files() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const [items, setItems] = useState<DocumentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [toDelete, setToDelete] = useState<DocumentItem | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [editing, setEditing] = useState<DocumentItem | null>(null)
    const [expanded, setExpanded] = useState<Set<number>>(new Set())

    useEffect(() => {
        apiGetDocuments()
            .then(r => setItems(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [])

    const handleUploaded = (doc: DocumentItem) => setItems(prev => [doc, ...prev])

    const toggleExpanded = (id: number) =>
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })

    const handleDownloadClick = (id: number) =>
        setItems(prev => prev.map(d => (d.id === id ? { ...d, downloads_count: d.downloads_count + 1 } : d)))

    const openEdit = (doc: DocumentItem) => setEditing(doc)

    const handleEditSaved = (doc: DocumentItem) => {
        setItems(prev => prev.map(d => (d.id === doc.id ? doc : d)))
        setEditing(null)
    }

    const handleDelete = async () => {
        if (!toDelete) return
        setDeleting(true)
        try {
            await apiDeleteDocument(toDelete.id)
            setItems(prev => prev.filter(d => d.id !== toDelete.id))
            setToDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <main className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center justify-between gap-4 mb-10"
                >
                    <div>
                        <p className="text-sky-400 text-sm font-medium tracking-widest uppercase mb-2">Загрузки</p>
                        <h1 className="text-4xl font-bold">Файлы</h1>
                    </div>
                    {isAuth && (
                        <button
                            onClick={() => setModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors shrink-0"
                        >
                            <Plus size={12} /> Добавить
                        </button>
                    )}
                </motion.div>

                {loading && <p className="text-muted-foreground text-sm">Загрузка…</p>}

                {!loading && items.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-24 text-muted-foreground"
                    >
                        <FileText size={48} className="opacity-30" />
                        <p>Файлов пока нет</p>
                    </motion.div>
                )}

                <div className="space-y-3">
                    <AnimatePresence>
                        {items.map((doc, i) => (
                            <motion.div
                                key={doc.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ delay: i * 0.04, duration: 0.4 }}
                                className="card-block rounded-2xl p-5 flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                                    <FileText size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-sm truncate">{doc.title}</h3>
                                    {doc.description && (
                                        <>
                                            <p
                                                className={cn(
                                                    'text-xs text-muted-foreground mt-0.5',
                                                    !expanded.has(doc.id) && 'line-clamp-2'
                                                )}
                                            >
                                                {doc.description}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpanded(doc.id)}
                                                className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 mt-1 font-medium"
                                            >
                                                {expanded.has(doc.id) ? (
                                                    <>
                                                        Свернуть <ChevronUp size={12} />
                                                    </>
                                                ) : (
                                                    <>
                                                        Раскрыть описание <ChevronDown size={12} />
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}
                                    <p className="text-[11px] text-muted-foreground/60 mt-1.5 truncate">
                                        {doc.original_name} · {formatSize(doc.size)} · {formatDate(doc.created_at)}
                                    </p>
                                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground/60 mt-0.5">
                                        <Download size={11} /> {doc.downloads_count} скачиваний
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <a
                                        href={apiDocumentDownloadUrl(doc.id)}
                                        download
                                        onClick={() => handleDownloadClick(doc.id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/25 transition-colors"
                                    >
                                        <FileDown size={13} /> Скачать
                                    </a>
                                    {isAuth && (
                                        <>
                                            <button
                                                onClick={() => openEdit(doc)}
                                                className="p-2 rounded-lg hover:bg-sky-500/20 text-sky-400 transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setToDelete(doc)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <UploadModal open={modal} onClose={() => setModal(false)} onUploaded={handleUploaded} />

            <EditModal open={!!editing} doc={editing} onClose={() => setEditing(null)} onSaved={handleEditSaved} />

            <ConfirmModal
                open={!!toDelete}
                title="Удалить файл?"
                message={toDelete ? `«${toDelete.title}» будет удалён безвозвратно.` : undefined}
                confirming={deleting}
                onConfirm={handleDelete}
                onClose={() => setToDelete(null)}
            />
        </main>
    )
}
