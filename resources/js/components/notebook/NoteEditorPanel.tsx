import { useEffect, useRef } from 'react'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
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
}

export default function NoteEditorPanel({ title, onTitleChange, content, onContentChange, saveState, onBack, autoFocusTitle }: NoteEditorPanelProps) {
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

            <NoteEditorContent editor={editor} />
        </>
    )
}
