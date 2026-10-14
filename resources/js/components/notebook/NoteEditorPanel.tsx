import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, FolderKanban, Loader2 } from 'lucide-react'
import { useNoteEditor } from './useNoteEditor'
import NoteFormatButton from './NoteFormatButton'
import NoteEditorContent from './NoteEditorContent'

type SaveState = 'idle' | 'saving' | 'saved'

interface NoteEditorPanelProps {
    title: string
    onTitleChange: (value: string) => void
    content: string
    onContentChange: (html: string) => void
    saveState: SaveState
    onBack: () => void
    autoFocusTitle?: boolean
    projects?: { id: number; name: string }[]
}

export default function NoteEditorPanel({ title, onTitleChange, content, onContentChange, saveState, onBack, autoFocusTitle, projects = [] }: NoteEditorPanelProps) {
    const titleRef = useRef<HTMLInputElement>(null)
    const editor = useNoteEditor({ content, onChange: onContentChange, placeholder: 'Начните печатать…' })

    useEffect(() => {
        if (autoFocusTitle) titleRef.current?.focus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <div className="flex items-center justify-between gap-3 mb-3 flex-shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="md:hidden flex items-center gap-1 text-sm text-sky-400"
                >
                    <ArrowLeft size={16} /> Назад
                </button>
                <NoteFormatButton editor={editor} />
                <div className="flex-1" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0 w-[92px] justify-end">
                    {saveState === 'saving' && (
                        <>
                            <Loader2 size={12} className="animate-spin" /> Сохранение…
                        </>
                    )}
                    {saveState === 'saved' && (
                        <>
                            <Check size={12} className="text-emerald-400" /> Сохранено
                        </>
                    )}
                </div>
            </div>

            <input
                ref={titleRef}
                value={title}
                onChange={e => onTitleChange(e.target.value)}
                placeholder="Заголовок"
                className="w-full bg-transparent text-xl font-bold text-foreground placeholder-muted-foreground/50 focus:outline-none mb-3 flex-shrink-0 text-base sm:text-xl"
            />

            {projects.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-3 flex-shrink-0">
                    {projects.map(p => (
                        <Link
                            key={p.id}
                            to={`/notebook?tab=projects&project=${p.id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-xs text-sky-400 hover:bg-sky-500/20 whitespace-nowrap"
                        >
                            <FolderKanban size={12} /> {p.name.trim() || 'Без названия'}
                        </Link>
                    ))}
                </div>
            )}

            <NoteEditorContent editor={editor} />
        </>
    )
}
