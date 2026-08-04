import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { BookOpen, Loader2, Plus, Search, Trash, Trash2, X } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetNotes, apiCreateNote, apiUpdateNote, apiDeleteNote, Note } from '@/api/notes'
import ConfirmModal from '@/components/ui/ConfirmModal'
import NoteEditorPanel from '@/components/notebook/NoteEditorPanel'
import TrashModal from '@/components/notebook/TrashModal'

const UNTITLED = 'Без названия'

const SAVE_DELAY = 700

type SaveState = 'idle' | 'saving' | 'saved'

function formatDate(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' в ' +
        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function stripHtml(html: string | null) {
    return (html ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function snippet(content: string | null) {
    const text = stripHtml(content)
    return text.length > 0 ? text.slice(0, 80) : 'Новая заметка'
}

export default function Notebook() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [notes, setNotes] = useState<Note[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<number | null>(null)
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [saveState, setSaveState] = useState<SaveState>('idle')
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [justCreatedId, setJustCreatedId] = useState<number | null>(null)
    const [search, setSearch] = useState('')
    const [trashOpen, setTrashOpen] = useState(false)

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const POLL_INTERVAL = 20000

    useEffect(() => {
        if (!isAuth) return
        apiGetNotes()
            .then(r => {
                setNotes(r.data)
                const first = r.data[0]
                if (first) {
                    setActiveId(first.id)
                    setTitle(first.title)
                    setContent(first.content ?? '')
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [isAuth])

    // Периодически подтягиваем список — заметки могут меняться из приложения на Mac
    useEffect(() => {
        if (!isAuth) return
        const timer = setInterval(() => {
            apiGetNotes()
                .then(r => setNotes(r.data))
                .catch(() => {})
        }, POLL_INTERVAL)
        return () => clearInterval(timer)
    }, [isAuth])

    const activeNote = useMemo(() => notes.find(n => n.id === activeId) ?? null, [notes, activeId])

    const filteredNotes = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return notes
        return notes.filter(n =>
            n.title.toLowerCase().includes(query) || stripHtml(n.content).toLowerCase().includes(query)
        )
    }, [notes, search])

    const selectNote = (note: Note) => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaveState('idle')
        setActiveId(note.id)
        setTitle(note.title)
        setContent(note.content ?? '')
    }

    const scheduleSave = useCallback((id: number, data: { title: string; content: string }) => {
        if (saveTimer.current) clearTimeout(saveTimer.current)
        setSaveState('saving')
        saveTimer.current = setTimeout(() => {
            const payload = { ...data, title: data.title.trim() || UNTITLED }
            apiUpdateNote(id, payload)
                .then(r => {
                    setNotes(prev => [r.data, ...prev.filter(n => n.id !== id)])
                    setSaveState('saved')
                })
                .catch(() => setSaveState('idle'))
        }, SAVE_DELAY)
    }, [])

    const handleTitleChange = (value: string) => {
        setTitle(value)
        if (!activeNote) return
        scheduleSave(activeNote.id, { title: value, content })
    }

    const handleContentChange = (value: string) => {
        setContent(value)
        if (!activeNote) return
        scheduleSave(activeNote.id, { title, content: value })
    }

    const handleCreate = async () => {
        const r = await apiCreateNote()
        setNotes(prev => [r.data, ...prev])
        selectNote(r.data)
        setJustCreatedId(r.data.id)
    }

    const handleDeleteRequest = (note: Note, e: React.MouseEvent) => {
        e.stopPropagation()
        setNoteToDelete(note)
    }

    const confirmDelete = async () => {
        if (!noteToDelete) return
        setDeleting(true)
        try {
            await apiDeleteNote(noteToDelete.id)
            setNotes(prev => prev.filter(n => n.id !== noteToDelete.id))
            if (activeId === noteToDelete.id) {
                if (saveTimer.current) clearTimeout(saveTimer.current)
                setActiveId(null)
            }
            setNoteToDelete(null)
        } finally {
            setDeleting(false)
        }
    }

    // Флашим несохранённые изменения при уходе со страницы
    useEffect(() => {
        return () => {
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [])

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    return (
        <div className="min-h-screen pt-20">
            <div className="max-w-6xl mx-auto px-4 py-8 h-[calc(100vh-5rem)]">
                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 h-full">
                    {/* Список записей */}
                    <div className={`flex-col h-full min-h-0 ${activeNote ? 'hidden md:flex' : 'flex'}`}>
                        <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center flex-shrink-0">
                                    <BookOpen className="text-sky-500 dark:text-sky-400" size={18} />
                                </div>
                                <h1 className="text-xl font-bold text-foreground">Блокнот</h1>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setTrashOpen(true)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-sky-500/10 transition-colors"
                                    aria-label="Корзина"
                                >
                                    <Trash size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreate}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-500 text-white hover:bg-sky-600 transition-colors"
                                    aria-label="Добавить запись"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="relative mb-3 flex-shrink-0">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Поиск по записям"
                                className="w-full input-field rounded-lg pl-9 pr-8 py-2 text-base sm:text-sm"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label="Очистить поиск"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                            {loading ? (
                                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : notes.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Пока нет записей — нажмите «+», чтобы добавить</p>
                            ) : filteredNotes.length === 0 ? (
                                <p className="text-muted-foreground text-sm text-center py-8">Ничего не найдено</p>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredNotes.map(note => (
                                        <motion.button
                                            key={note.id}
                                            type="button"
                                            layout="position"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.97 }}
                                            transition={{ layout: { type: 'spring', damping: 40, stiffness: 180, mass: 0.9 } }}
                                            onClick={() => selectNote(note)}
                                            className={`group w-full text-left card-block rounded-xl p-3.5 transition-colors ${
                                                activeId === note.id ? 'border-sky-500/50 bg-sky-500/5' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-foreground truncate">
                                                        {note.title.trim() || UNTITLED}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-0.5 truncate">
                                                        {formatDate(note.updated_at)} · {snippet(note.content)}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={e => handleDeleteRequest(note, e)}
                                                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity flex-shrink-0 p-1"
                                                    aria-label="Удалить запись"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.button>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>

                    {/* Редактор */}
                    <div className={`h-full min-h-0 ${activeNote ? 'flex' : 'hidden md:flex'} flex-col card-block rounded-2xl p-5 sm:p-6`}>
                        {!activeNote ? (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                Выберите запись слева или создайте новую
                            </div>
                        ) : (
                            <NoteEditorPanel
                                key={activeNote.id}
                                title={title}
                                onTitleChange={handleTitleChange}
                                content={content}
                                onContentChange={handleContentChange}
                                saveState={saveState}
                                onBack={() => setActiveId(null)}
                                autoFocusTitle={justCreatedId === activeNote.id}
                            />
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={!!noteToDelete}
                title="Удалить запись?"
                message={noteToDelete ? `«${noteToDelete.title.trim() || UNTITLED}» будет перемещена в корзину.` : undefined}
                confirmLabel="Удалить"
                confirming={deleting}
                onConfirm={confirmDelete}
                onClose={() => setNoteToDelete(null)}
            />

            <TrashModal
                open={trashOpen}
                onClose={() => setTrashOpen(false)}
                onRestored={note => setNotes(prev => [note, ...prev])}
            />
        </div>
    )
}
