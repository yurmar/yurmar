import { useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import { wrappingInputRule } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import LinkExt from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import ParagraphExt from '@tiptap/extension-paragraph'
import BulletListExt from '@tiptap/extension-bullet-list'

export const CustomParagraph = ParagraphExt.extend({
    addAttributes() {
        return {
            variant: {
                default: 'body',
                parseHTML: (el: HTMLElement) => el.getAttribute('data-variant') || 'body',
                renderHTML: (attrs: { variant?: string }) =>
                    attrs.variant === 'code' ? { 'data-variant': 'code' } : {},
            },
        }
    },
})

export const CustomBulletList = BulletListExt.extend({
    addAttributes() {
        return {
            marker: {
                default: 'disc',
                parseHTML: (el: HTMLElement) => el.getAttribute('data-marker') || 'disc',
                renderHTML: (attrs: { marker?: string }) =>
                    attrs.marker === 'dash' ? { 'data-marker': 'dash' } : {},
            },
        }
    },
    // "- " в начале строки → список с тире, "* "/"+ " → обычный маркированный
    addInputRules() {
        return [
            wrappingInputRule({
                find: /^\s*-\s$/,
                type: this.type,
                getAttributes: () => ({ marker: 'dash' }),
            }),
            wrappingInputRule({
                find: /^\s*[*+]\s$/,
                type: this.type,
                getAttributes: () => ({ marker: 'disc' }),
            }),
        ]
    },
})

interface UseNoteEditorOptions {
    content: string
    onChange: (html: string) => void
    placeholder?: string
}

export function useNoteEditor({ content, onChange, placeholder }: UseNoteEditorOptions) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false,
                bulletList: false,
                heading: { levels: [1, 2, 3] },
                codeBlock: false,
            }),
            CustomParagraph,
            CustomBulletList,
            UnderlineExt,
            Highlight.configure({ multicolor: true }),
            LinkExt.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
            Placeholder.configure({ placeholder: placeholder ?? 'Начните печатать…' }),
        ],
        content,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    })

    // Синхронизируем контент, если он изменился не изнутри редактора
    useEffect(() => {
        if (!editor) return
        if (editor.getHTML() !== content) {
            editor.commands.setContent(content, { emitUpdate: false })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editor, content])

    return editor
}
