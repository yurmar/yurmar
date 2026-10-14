import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, X } from 'lucide-react'

interface Props {
    open: boolean
    folderOptions: { id: number; label: string }[]
    defaultFolderId: number | null
    onUpload: (files: File[], folderId: number | null) => void
    onClose: () => void
}

function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} Б`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export default function UploadFilesModal({ open, folderOptions, defaultFolderId, onUpload, onClose }: Props) {
    const [files, setFiles] = useState<File[]>([])
    const [folderId, setFolderId] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setFiles([])
            setFolderId(defaultFolderId !== null ? String(defaultFolderId) : '')
        }
    }, [open, defaultFolderId])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const submit = () => {
        if (!files.length) return
        onUpload(files, folderId ? Number(folderId) : null)
        onClose()
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1a30] shadow-2xl p-6"
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Загрузить файлы</h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10" aria-label="Закрыть">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-sky-500/40 text-sky-400 text-sm font-medium whitespace-nowrap hover:bg-sky-500/10"
                                >
                                    <UploadCloud size={16} /> Выбрать файлы
                                </button>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={e => {
                                        const picked = Array.from(e.target.files ?? [])
                                        e.target.value = ''
                                        setFiles(prev => [...prev, ...picked])
                                    }}
                                />
                                {files.length > 0 && (
                                    <ul className="mt-3 max-h-40 overflow-y-auto custom-scroll space-y-1">
                                        {files.map((f, i) => (
                                            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-sm text-gray-200">
                                                <span className="truncate">{f.name}</span>
                                                <span className="flex items-center gap-2 flex-shrink-0 text-xs text-gray-400">
                                                    {formatSize(f.size)}
                                                    <button
                                                        type="button"
                                                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                                                        className="hover:text-red-400"
                                                        aria-label="Убрать из списка"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">В какую папку добавить</label>
                                <select
                                    value={folderId}
                                    onChange={e => setFolderId(e.target.value)}
                                    className="w-full input-field rounded-lg px-3 py-2 text-base sm:text-sm"
                                >
                                    <option value="">Автоматически — по типу файла</option>
                                    {folderOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg text-sm text-gray-300 hover:bg-white/10 whitespace-nowrap"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={submit}
                                disabled={files.length === 0}
                                className="h-9 px-4 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 disabled:opacity-50"
                            >
                                Загрузить{files.length > 0 ? ` (${files.length})` : ''}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
