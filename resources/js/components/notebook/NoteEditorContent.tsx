import type { Editor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'

export default function NoteEditorContent({ editor }: { editor: Editor | null }) {
    if (!editor) return null

    return (
        <div className="note-editor flex-1 min-h-0 overflow-y-auto text-foreground text-base sm:text-sm leading-snug">
            <EditorContent editor={editor} />
        </div>
    )
}
