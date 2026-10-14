import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus, Link2, Loader2, StickyNote, Unlink } from 'lucide-react'
import {
    apiAttachNote,
    apiDetachNote,
    apiGetNotebookProject,
    LinkedNote,
} from '@/api/notebookProjects'
import { apiCreateNote, apiGetNotes, Note } from '@/api/notes'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Props {
    projectId: number
    onCount: (count: number) => void
}

const UNTITLED = 'Без названия'

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ProjectNotes({ projectId, onCount }: Props) {
    const [notes, setNotes] = useState<LinkedNote[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [allNotes, setAllNotes] = useState<Note[] | null>(null)
    const [picking, setPicking] = useState(false)
    const [pickValue, setPickValue] = useState('')
    const [busy, setBusy] = useState(false)
    const [actionError, setActionError] = useState('')
    const [toDetach, setToDetach] = useState<LinkedNote | null>(null)

    const load = () => {
        setLoading(true)
        setError(false)
        apiGetNotebookProject(projectId)
            .then(r => setNotes(r.data.notes ?? []))
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }

    useEffect(load, [projectId])

    useEffect(() => {
        if (!loading) onCount(notes.length)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notes.length, loading])

    const openPicker = async () => {
        setPicking(true)
        setPickValue('')
        if (allNotes === null) {
            try {
                setAllNotes((await apiGetNotes()).data)
            } catch {
                setActionError('Не удалось загрузить список записей')
                setPicking(false)
            }
        }
    }

    const available = useMemo(() => {
        const linked = new Set(notes.map(n => n.id))
        return (allNotes ?? []).filter(n => !linked.has(n.id))
    }, [allNotes, notes])

    const attach = async (noteId: number) => {
        setBusy(true)
        setActionError('')
        try {
            const r = await apiAttachNote(projectId, noteId)
            setNotes(prev => (prev.some(n => n.id === noteId) ? prev : [r.data, ...prev]))
            setPicking(false)
            setPickValue('')
        } catch {
            setActionError('Не удалось привязать запись')
        } finally {
            setBusy(false)
        }
    }

    const createAndAttach = async () => {
        setBusy(true)
        setActionError('')
        try {
            const created = await apiCreateNote()
            await attach(created.data.id)
            setAllNotes(prev => (prev ? [created.data, ...prev] : prev))
        } catch {
            setActionError('Не удалось создать запись')
            setBusy(false)
        }
    }

    const confirmDetach = async () => {
        if (!toDetach) return
        try {
            await apiDetachNote(projectId, toDetach.id)
            setNotes(prev => prev.filter(n => n.id !== toDetach.id))
        } catch {
            setActionError('Не удалось отвязать запись')
        }
        setToDetach(null)
    }

    return (
        <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">Записи</h2>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={openPicker}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-sky-500/30 text-sky-500 text-sm font-medium whitespace-nowrap hover:bg-sky-500/10 disabled:opacity-60"
                    >
                        <Link2 size={14} /> Привязать запись
                    </button>
                    <button
                        type="button"
                        onClick={createAndAttach}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 disabled:opacity-60"
                    >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <FilePlus size={14} />} Создать запись
                    </button>
                </div>
            </div>

            {picking && (
                <div className="flex items-center gap-2">
                    {allNotes === null ? (
                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    ) : available.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Все ваши записи уже привязаны или записей нет.</p>
                    ) : (
                        <>
                            <select
                                value={pickValue}
                                onChange={e => setPickValue(e.target.value)}
                                className="flex-1 min-w-0 input-field rounded-md px-2.5 py-1.5 text-base sm:text-sm"
                                aria-label="Выберите запись"
                            >
                                <option value="">Выберите запись…</option>
                                {available.map(n => (
                                    <option key={n.id} value={n.id}>{n.title.trim() || UNTITLED}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                disabled={!pickValue || busy}
                                onClick={() => attach(Number(pickValue))}
                                className="h-8 px-3 rounded-md bg-sky-500/15 text-sky-500 text-sm whitespace-nowrap hover:bg-sky-500/25 disabled:opacity-50"
                            >
                                Привязать
                            </button>
                        </>
                    )}
                    <button type="button" onClick={() => setPicking(false)} className="text-xs text-muted-foreground hover:text-foreground whitespace-nowrap">
                        Отмена
                    </button>
                </div>
            )}

            {actionError && <p className="text-xs text-red-400">{actionError}</p>}

            {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : error ? (
                <div className="py-3 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Не удалось загрузить записи</p>
                    <button type="button" onClick={load} className="text-sm text-sky-400 hover:text-sky-300">Повторить</button>
                </div>
            ) : notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">К проекту пока не привязано ни одной записи.</p>
            ) : (
                <div className="space-y-2">
                    {notes.map(n => (
                        <div key={n.id} className="flex items-center gap-3 rounded-lg border border-sky-500/15 bg-sky-500/[0.03] px-3 py-2">
                            <StickyNote size={16} className="text-sky-500 flex-shrink-0" />
                            <Link
                                to={`/notebook?note=${n.id}`}
                                className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:text-sky-400"
                            >
                                {n.title.trim() || UNTITLED}
                            </Link>
                            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                                {formatDate(n.updated_at)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setToDetach(n)}
                                className="p-1 text-muted-foreground hover:text-red-400"
                                aria-label="Отвязать запись"
                            >
                                <Unlink size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                open={!!toDetach}
                title="Отвязать запись?"
                message={toDetach ? `«${toDetach.title.trim() || UNTITLED}» останется в блокноте, пропадёт только связь с проектом.` : undefined}
                confirmLabel="Отвязать"
                danger={false}
                onConfirm={confirmDetach}
                onClose={() => setToDetach(null)}
            />
        </section>
    )
}
