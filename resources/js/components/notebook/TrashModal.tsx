import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiForceDeleteNote, apiGetTrashedNotes, apiRestoreNote, Note } from '@/api/notes'
import ConfirmModal from '@/components/ui/ConfirmModal'

const UNTITLED = 'Без названия'
const TRASH_LIFETIME_DAYS = 30

function stripHtml(html: string | null) {
    return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function snippet(content: string | null) {
    const text = stripHtml(content)
    return text.length > 0 ? text.slice(0, 80) : 'Пустая заметка'
}

function daysLeft(deletedAt: string) {
    const deletedMs = new Date(deletedAt).getTime()
    const purgeMs = deletedMs + TRASH_LIFETIME_DAYS * 24 * 60 * 60 * 1000
    const left = Math.ceil((purgeMs - Date.now()) / (24 * 60 * 60 * 1000))
    return Math.max(left, 0)
}

interface TrashModalProps {
    open: boolean
    onClose: () => void
    onRestored: (note: Note) => void
}

export default function TrashModal({ open, onClose, onRestored }: TrashModalProps) {
    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [restoringId, setRestoringId] = useState<number | null>(null)
    const [noteToPurge, setNoteToPurge] = useState<Note | null>(null)
    const [purging, setPurging] = useState(false)

    useEffect(() => {
        if (!open) return
        setLoading(true)
        apiGetTrashedNotes()
            .then(r => setNotes(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [open])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleRestore = async (note: Note) => {
        setRestoringId(note.id)
        try {
            const r = await apiRestoreNote(note.id)
            setNotes(prev => prev.filter(n => n.id !== note.id))
            onRestored(r.data)
        } finally {
            setRestoringId(null)
        }
    }

    const confirmPurge = async () => {
        if (!noteToPurge) return
        setPurging(true)
        try {
            await apiForceDeleteNote(noteToPurge.id)
            setNotes(prev => prev.filter(n => n.id !== noteToPurge.id))
            setNoteToPurge(null)
        } finally {
            setPurging(false)
        }
    }

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        data-no-ptr
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            className={cn(
                                'relative z-10 w-full max-w-lg rounded-2xl border border-white/10',
                                'bg-[#0d1a30] dark:bg-[#0d1a30] shadow-2xl p-6',
                                'light:bg-white light:border-gray-200',
                                'max-h-[80vh] flex flex-col'
                            )}
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <div className="flex items-center justify-between mb-3 flex-shrink-0">
                                <h3 className="text-lg font-semibold text-white">Корзина</h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                                    aria-label="Закрыть"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 mb-4 flex-shrink-0">
                                Записи удаляются безвозвратно через {TRASH_LIFETIME_DAYS} дней после перемещения в корзину.
                            </p>

                            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                                {loading ? (
                                    <p className="text-sm text-gray-500 text-center py-8">Загрузка...</p>
                                ) : notes.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-8">Корзина пуста</p>
                                ) : (
                                    notes.map(note => (
                                        <div
                                            key={note.id}
                                            className="flex items-start justify-between gap-2 rounded-xl border border-white/10 p-3.5"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-white truncate">
                                                    {note.title.trim() || UNTITLED}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {snippet(note.content)}
                                                </div>
                                                <div className="text-xs text-sky-400/80 mt-1">
                                                    {note.deleted_at
                                                        ? daysLeft(note.deleted_at) > 0
                                                            ? `Удалится безвозвратно через ${daysLeft(note.deleted_at)} дн.`
                                                            : 'Будет удалена в ближайшее время'
                                                        : null}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRestore(note)}
                                                    disabled={restoringId === note.id}
                                                    className="text-gray-400 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-50"
                                                    aria-label="Восстановить запись"
                                                >
                                                    <RotateCcw size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setNoteToPurge(note)}
                                                    className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10"
                                                    aria-label="Удалить безвозвратно"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={!!noteToPurge}
                title="Удалить навсегда?"
                message={noteToPurge ? `«${noteToPurge.title.trim() || UNTITLED}» будет удалена безвозвратно, восстановить её будет нельзя.` : undefined}
                confirmLabel="Удалить навсегда"
                confirming={purging}
                onConfirm={confirmPurge}
                onClose={() => setNoteToPurge(null)}
            />
        </>
    )
}
