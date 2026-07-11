import { AnimatePresence, motion } from 'framer-motion'
import {
    FileText, ScrollText, FileSignature, TerminalSquare, Palette, Users2,
    ChevronLeft, ChevronRight, X, LayoutGrid, List,
} from 'lucide-react'
import type { FileExt, SectionIconKey } from './data'

// ── Иконки разделов ───────────────────────────────────────────────────────

export const SECTION_ICONS: Record<SectionIconKey, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
    scroll: ScrollText,
    signature: FileSignature,
    terminal: TerminalSquare,
    palette: Palette,
    users: Users2,
}

// ── Иконка файла по расширению ───────────────────────────────────────────

const EXT_META: Record<FileExt, { className: string }> = {
    pdf: { className: 'text-rose-500 bg-rose-500/10' },
    docx: { className: 'text-sky-500 bg-sky-500/10' },
    xlsx: { className: 'text-emerald-500 bg-emerald-500/10' },
    pptx: { className: 'text-violet-500 bg-violet-500/10' },
}

export function FileIcon({ extension, size = 14, box = 'w-8 h-8' }: { extension: FileExt; size?: number; box?: string }) {
    const meta = EXT_META[extension]
    return (
        <div className={`${box} rounded-lg flex items-center justify-center flex-shrink-0 ${meta.className}`}>
            <FileText size={size} />
        </div>
    )
}

// ── Leader dots (каталожная строка) ──────────────────────────────────────

export function DotLeader() {
    return <span className="flex-1 mx-2 border-b border-dotted border-foreground/25 translate-y-[-3px]" />
}

// ── Бейдж «Новый» ─────────────────────────────────────────────────────────

export function NewBadge() {
    return (
        <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500 text-white animate-pulse flex-shrink-0">
            Новый
        </span>
    )
}

// ── Переключатель вида ────────────────────────────────────────────────────

export function ViewToggle({ mode, onChange }: { mode: 'cards' | 'list'; onChange: (m: 'cards' | 'list') => void }) {
    const cls = (active: boolean) =>
        `p-1.5 rounded-lg transition-colors ${active ? 'bg-[var(--archive-ink)]/15 text-[var(--archive-ink)] dark:text-[var(--archive-ink-light)]' : 'text-muted-foreground hover:text-foreground'}`
    return (
        <div className="flex items-center gap-0.5 bg-foreground/5 border border-border rounded-xl p-1 flex-shrink-0">
            <button type="button" onClick={() => onChange('cards')} aria-label="Карточки" className={cls(mode === 'cards')}>
                <LayoutGrid size={15} />
            </button>
            <button type="button" onClick={() => onChange('list')} aria-label="Списком" className={cls(mode === 'list')}>
                <List size={15} />
            </button>
        </div>
    )
}

// ── Пагинация ──────────────────────────────────────────────────────────────

function getPageNums(current: number, total: number): (number | '...')[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (current > 3) pages.push('...')
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
    if (current < total - 2) pages.push('...')
    pages.push(total)
    return pages
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    if (totalPages <= 1) return null
    const btnCls = (active: boolean, disabled?: boolean) =>
        `w-8 h-8 rounded-xl text-xs font-medium flex items-center justify-center transition-colors ${
            disabled ? 'text-foreground/15 cursor-not-allowed' :
            active   ? 'bg-[var(--archive-ink)] text-white shadow-lg' :
                       'text-foreground/40 hover:text-foreground hover:bg-foreground/8'
        }`
    return (
        <div className="flex items-center justify-center gap-1 mt-6">
            <button onClick={() => onChange(page - 1)} disabled={page === 1} className={btnCls(false, page === 1)}>
                <ChevronLeft size={14} />
            </button>
            {getPageNums(page, totalPages).map((p, i) =>
                p === '...'
                    ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-foreground/25">…</span>
                    : <button key={p} onClick={() => onChange(p)} className={btnCls(p === page)}>{p}</button>
            )}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={btnCls(false, page === totalPages)}>
                <ChevronRight size={14} />
            </button>
        </div>
    )
}

// ── Модальное окно ────────────────────────────────────────────────────────

export function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
                        initial={{ scale: 0.92, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-semibold text-base text-foreground">{title}</h3>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/10 text-foreground/50 hover:text-foreground transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
