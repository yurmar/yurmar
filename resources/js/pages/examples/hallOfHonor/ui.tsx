import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react'
import { STAGES, StageKey } from './data'

export const ACCENT = {
    '--honor-ink': '#0f3d3e',
    '--honor-ink-light': '#7fd8ce',
    '--honor-coral': '#ff6b4a',
} as React.CSSProperties

export const SPACE_GROTESK = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

export function useSpaceGrotesk() {
    useEffect(() => {
        if (document.getElementById('font-space-grotesk')) return
        const link = document.createElement('link')
        link.id = 'font-space-grotesk'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Рельс этапов (структурная подпись) ────────────────────────────────────

export function RankRail({ stageKey, size = 'md' }: { stageKey: StageKey; size?: 'sm' | 'md' }) {
    const idx = STAGES.findIndex(s => s.key === stageKey)
    const dot = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5'
    return (
        <div className={`flex items-center ${gap}`} title={STAGES[idx]?.label}>
            {STAGES.map((s, i) => (
                <span
                    key={s.key}
                    className={`${dot} rounded-full flex-shrink-0 transition-colors`}
                    style={{ background: i <= idx ? 'var(--honor-coral)' : 'var(--honor-ink)', opacity: i <= idx ? 1 : 0.15 }}
                />
            ))}
        </div>
    )
}

export function RankRailLabeled({ stageKey }: { stageKey: StageKey }) {
    const idx = STAGES.findIndex(s => s.key === stageKey)
    return (
        <div className="flex items-center">
            {STAGES.map((s, i) => (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors"
                            style={i < idx
                                ? { background: 'var(--honor-coral)', borderColor: 'var(--honor-coral)' }
                                : i === idx
                                    ? { background: 'transparent', borderColor: 'var(--honor-coral)' }
                                    : { background: 'transparent', borderColor: 'currentColor', opacity: 0.2 }}
                        >
                            {i < idx && <Check size={12} className="text-white" />}
                            {i === idx && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--honor-coral)' }} />}
                        </div>
                        <span className={`text-[10px] whitespace-nowrap ${i <= idx ? 'font-semibold text-foreground' : 'text-muted-foreground/50'}`}>{s.label}</span>
                    </div>
                    {i < STAGES.length - 1 && (
                        <div className="flex-1 h-0.5 mx-1 mb-4 rounded-full" style={{ background: i < idx ? 'var(--honor-coral)' : 'currentColor', opacity: i < idx ? 1 : 0.15 }} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ── Поля формы ─────────────────────────────────────────────────────────────

export function Field({ label, error, children }: { label: string; error?: boolean; children: React.ReactNode }) {
    return (
        <div className="text-sm mb-2.5">
            <label className={`block text-xs mb-1 ${error ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>{label}</label>
            {children}
        </div>
    )
}

const inputCls = 'w-full px-2.5 py-1.5 rounded-lg bg-foreground/5 border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-[var(--honor-ink-light)] transition-colors'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
    const { error, className, ...rest } = props
    return <input {...rest} className={`${inputCls} ${error ? 'border-rose-500' : ''} ${className ?? ''}`} />
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
    const { error, className, ...rest } = props
    return <textarea {...rest} className={`${inputCls} resize-none ${error ? 'border-rose-500' : ''} ${className ?? ''}`} />
}

export function SelectInput({ value, onChange, options, placeholder, error }: {
    value: number | null
    onChange: (v: number | null) => void
    options: { id: number; title: string }[]
    placeholder?: string
    error?: boolean
}) {
    return (
        <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            className={`${inputCls} appearance-none cursor-pointer ${error ? 'border-rose-500' : ''}`}
        >
            <option value="">{placeholder ?? 'Не выбрано'}</option>
            {options.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
        </select>
    )
}

// ── Модалка ────────────────────────────────────────────────────────────────

export function Dialog({ open, title, onClose, wide, children, footer }: {
    open: boolean; title: React.ReactNode; onClose: () => void; wide?: boolean; children: React.ReactNode; footer?: React.ReactNode
}) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[300] flex items-start justify-center p-4 py-8 overflow-y-auto"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className={`relative z-10 w-full ${wide ? 'max-w-4xl' : 'max-w-md'} bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh]`}
                        initial={{ scale: 0.95, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                            <div className="text-base font-semibold text-foreground pr-4">{title}</div>
                            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="px-6 py-4 overflow-y-auto">{children}</div>
                        {footer && <div className="flex items-center gap-2 px-6 py-4 border-t border-border flex-shrink-0 flex-wrap">{footer}</div>}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
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
            active   ? 'text-white shadow-lg' :
                       'text-foreground/40 hover:text-foreground hover:bg-foreground/8'
        }`
    return (
        <div className="flex items-center justify-center gap-1 mt-5">
            <button onClick={() => onChange(page - 1)} disabled={page === 1} className={btnCls(false, page === 1)}>
                <ChevronLeft size={14} />
            </button>
            {getPageNums(page, totalPages).map((p, i) =>
                p === '...'
                    ? <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-foreground/25">…</span>
                    : <button key={p} onClick={() => onChange(p)} style={p === page ? { background: 'var(--honor-ink)' } : undefined} className={btnCls(p === page)}>{p}</button>
            )}
            <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={btnCls(false, page === totalPages)}>
                <ChevronRight size={14} />
            </button>
        </div>
    )
}

// ── Печать / экспорт ────────────────────────────────────────────────────────

export function printRows(title: string, headers: string[], rows: string[][]) {
    const win = window.open('', '_blank')
    if (!win) return
    const thStyle = 'border:1px solid #555;padding:4px 6px;background:#e0e0e0;font-size:9px;text-align:left'
    const tdStyle = 'border:1px solid #ccc;padding:4px 6px;font-size:9px;vertical-align:top'
    const head = headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')
    const body = rows.map(r => `<tr>${r.map(c => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>body{font-family:Arial,sans-serif;margin:16px}h2{font-size:13px;margin-bottom:10px}table{border-collapse:collapse;width:100%}@media print{@page{size:A4 landscape;margin:10mm}}</style>
</head><body><h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}<\/script></body></html>`)
    win.document.close()
}

export async function exportRowsToExcel(title: string, headers: string[], rows: string[][]) {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Данные')
    XLSX.writeFile(wb, `${title}.xlsx`)
}
