import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import type { PollStatus } from './data'

export const STATUS_BADGE: Record<PollStatus, { label: string; cls: string }> = {
    active: { label: 'Идёт', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
    upcoming: { label: 'Скоро', cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400' },
    finished: { label: 'Завершён', cls: 'bg-sky-500/15 text-sky-500 dark:text-sky-400' },
}

export const CHIP = 'inline-flex items-center gap-1.5 rounded-lg border border-border bg-foreground/5 px-2.5 py-1 text-xs font-medium'

export const FIELD =
    'w-full rounded-xl border border-border bg-foreground/5 px-3 py-2.5 text-base sm:text-sm outline-none focus:border-sky-500/60 transition-colors'

export const BTN =
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-sky-500/30 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-500 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-sky-400'

export const BTN_GHOST =
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-border bg-foreground/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50'

export const BTN_ICON =
    'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-foreground/5 transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-40'

export const BTN_DANGER_ICON =
    'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40'

/** Модалка: на телефоне выезжает снизу, на десктопе — по центру */
export function Sheet({ title, onClose, children, footer }: {
    title: React.ReactNode
    onClose: () => void
    children: React.ReactNode
    footer?: React.ReactNode
}) {
    const bodyRef = useRef<HTMLDivElement>(null)
    // новая модалка всегда открывается с начала (автофокус поля/карты внутри не должен прокручивать её)
    useEffect(() => {
        bodyRef.current?.scrollTo(0, 0)
        const t = setTimeout(() => bodyRef.current?.scrollTo(0, 0), 150)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <div
                className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-shrink-0 items-center justify-between gap-3 px-5 pt-5 sm:px-6">
                    <div className="min-w-0">{title}</div>
                    <button onClick={onClose} aria-label="Закрыть" className={BTN_ICON}>
                        <X size={16} />
                    </button>
                </div>
                <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
                {footer && <div className="flex flex-shrink-0 justify-end gap-2 border-t border-border px-5 py-3 sm:px-6">{footer}</div>}
            </div>
        </div>,
        document.body,
    )
}
