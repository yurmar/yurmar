import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Pencil, Check, Type, Quote, List, ListOrdered, ListMinus, Link2, Link2Off,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const HIGHLIGHT_COLORS = ['#fde68a', '#bbf7d0', '#bfdbfe', '#fbcfe8']

function normalizeUrl(url: string) {
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(trimmed)) return trimmed
    return `https://${trimmed}`
}

export default function NoteFormatButton({ editor }: { editor: Editor | null }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [colorPickerOpen, setColorPickerOpen] = useState(false)
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
    const [linkValue, setLinkValue] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setMenuOpen(false)
                setColorPickerOpen(false)
                setLinkPopoverOpen(false)
            }
        }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [])

    if (!editor) return null

    const openLinkPopover = () => {
        setLinkValue(editor.getAttributes('link').href ?? '')
        setColorPickerOpen(false)
        setLinkPopoverOpen(o => !o)
    }

    const applyLink = () => {
        const url = normalizeUrl(linkValue)
        const chain = editor.chain().focus().extendMarkRange('link')
        if (url) chain.setLink({ href: url }).run()
        else chain.unsetLink().run()
        setLinkPopoverOpen(false)
    }

    const removeLink = () => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        setLinkPopoverOpen(false)
    }

    const isParagraph = (variant: 'body' | 'code') =>
        editor.isActive('paragraph', { variant }) || (variant === 'body' && editor.isActive('paragraph') && !editor.getAttributes('paragraph').variant)

    const setBody = () => { editor.chain().focus().setParagraph().updateAttributes('paragraph', { variant: 'body' }).run(); setMenuOpen(false) }
    const setCode = () => { editor.chain().focus().setParagraph().updateAttributes('paragraph', { variant: 'code' }).run(); setMenuOpen(false) }
    const setHeading = (level: 1 | 2 | 3) => { editor.chain().focus().setNode('heading', { level }).run(); setMenuOpen(false) }
    const setBulletList = () => {
        if (!editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run()
        editor.chain().focus().updateAttributes('bulletList', { marker: 'disc' }).run()
        setMenuOpen(false)
    }
    const setDashList = () => {
        if (!editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run()
        editor.chain().focus().updateAttributes('bulletList', { marker: 'dash' }).run()
        setMenuOpen(false)
    }
    const setOrderedList = () => { editor.chain().focus().toggleOrderedList().run(); setMenuOpen(false) }
    const setBlockquote = () => { editor.chain().focus().toggleBlockquote().run(); setMenuOpen(false) }

    const isDashList = editor.isActive('bulletList', { marker: 'dash' })
    const isBulletList = editor.isActive('bulletList') && !isDashList

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-colors',
                    menuOpen ? 'bg-sky-500/15 border-sky-500/30 text-sky-400' : 'border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/5'
                )}
                aria-label="Формат текста"
            >
                <Type size={13} /> Aa
            </button>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-9 left-0 z-30 w-72 rounded-2xl border border-white/10 bg-[#0d1a30] shadow-2xl p-3"
                    >
                        {/* Инлайн-форматирование */}
                        <div className="flex items-center gap-1 pb-3 mb-3 border-b border-white/10">
                            {[
                                { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Жирный' },
                                { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Курсив' },
                                { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), label: 'Подчёркнутый' },
                                { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: 'Зачёркнутый' },
                            ].map(({ icon: Icon, action, active, label }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={action}
                                    aria-label={label}
                                    className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                        active ? 'bg-sky-500/20 text-sky-400' : 'text-white/80 hover:bg-white/10'
                                    )}
                                >
                                    <Icon size={15} />
                                </button>
                            ))}
                            <div className="w-px h-5 bg-white/10 mx-1" />
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHighlight({ color: HIGHLIGHT_COLORS[0] }).run()}
                                aria-label="Выделение маркером"
                                className={cn(
                                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                    editor.isActive('highlight') ? 'bg-sky-500/20 text-sky-400' : 'text-white/80 hover:bg-white/10'
                                )}
                            >
                                <Pencil size={14} />
                            </button>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setColorPickerOpen(o => !o)}
                                    aria-label="Цвет выделения"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <span className="w-3.5 h-3.5 rounded-full bg-fuchsia-400 block" />
                                </button>
                                {colorPickerOpen && (
                                    <div className="absolute top-9 right-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0d1a30] p-2 shadow-xl z-40">
                                        {HIGHLIGHT_COLORS.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => {
                                                    editor.chain().focus().toggleHighlight({ color }).run()
                                                    setColorPickerOpen(false)
                                                }}
                                                className="w-5 h-5 rounded-full ring-1 ring-white/20"
                                                style={{ backgroundColor: color }}
                                                aria-label={`Цвет ${color}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={openLinkPopover}
                                    aria-label="Ссылка"
                                    className={cn(
                                        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                                        editor.isActive('link') ? 'bg-sky-500/20 text-sky-400' : 'text-white/80 hover:bg-white/10'
                                    )}
                                >
                                    <Link2 size={14} />
                                </button>
                                {linkPopoverOpen && (
                                    <div className="absolute top-9 right-0 z-40 w-60 rounded-xl border border-white/10 bg-[#0d1a30] p-2.5 shadow-xl">
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                autoFocus
                                                value={linkValue}
                                                onChange={e => setLinkValue(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') { e.preventDefault(); applyLink() }
                                                    if (e.key === 'Escape') setLinkPopoverOpen(false)
                                                }}
                                                placeholder="Вставьте ссылку"
                                                className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={applyLink}
                                                aria-label="Применить ссылку"
                                                className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-sky-500 hover:bg-sky-400 text-white transition-colors"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                        {editor.isActive('link') && (
                                            <button
                                                type="button"
                                                onClick={removeLink}
                                                className="mt-2 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Link2Off size={12} /> Удалить ссылку
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Стили абзаца */}
                        <div className="space-y-0.5">
                            <button type="button" onClick={() => setHeading(1)} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-2xl font-extrabold transition-colors">
                                {editor.isActive('heading', { level: 1 }) && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <span className={editor.isActive('heading', { level: 1 }) ? '' : 'ml-[19px]'}>Название</span>
                            </button>
                            <button type="button" onClick={() => setHeading(2)} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-lg font-bold transition-colors">
                                {editor.isActive('heading', { level: 2 }) && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <span className={editor.isActive('heading', { level: 2 }) ? '' : 'ml-[19px]'}>Заголовок</span>
                            </button>
                            <button type="button" onClick={() => setHeading(3)} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-base font-bold transition-colors">
                                {editor.isActive('heading', { level: 3 }) && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <span className={editor.isActive('heading', { level: 3 }) ? '' : 'ml-[19px]'}>Подзаголовок</span>
                            </button>
                            <button type="button" onClick={setBody} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {isParagraph('body') && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <span className={isParagraph('body') ? '' : 'ml-[19px]'}>Основной текст</span>
                            </button>
                            <button type="button" onClick={setCode} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {isParagraph('code') && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <span className={cn('font-mono', isParagraph('code') ? '' : 'ml-[19px]')}>Код</span>
                            </button>

                            <div className="h-px bg-white/10 my-1.5" />

                            <button type="button" onClick={setBulletList} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {isBulletList && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <List size={13} className={isBulletList ? '' : 'ml-[19px]'} /> Маркированный список
                            </button>
                            <button type="button" onClick={setDashList} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {isDashList && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <ListMinus size={13} className={isDashList ? '' : 'ml-[19px]'} /> Список с тире
                            </button>
                            <button type="button" onClick={setOrderedList} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {editor.isActive('orderedList') && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <ListOrdered size={13} className={editor.isActive('orderedList') ? '' : 'ml-[19px]'} /> Нумерованный список
                            </button>

                            <div className="h-px bg-white/10 my-1.5" />

                            <button type="button" onClick={setBlockquote} className="w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg hover:bg-white/10 text-white text-sm transition-colors">
                                {editor.isActive('blockquote') && <Check size={13} className="text-sky-400 flex-shrink-0" />}
                                <Quote size={13} className={editor.isActive('blockquote') ? '' : 'ml-[19px]'} /> Блок цитаты
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
