import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { departmentsEnding, type MeetingStatus } from './data'

// ── Акцентная палитра и шрифты («канцелярская книга приёмной») ─────────────

export const ACCENT = {
    '--ledger-ink': '#2b2118',
    '--ledger-navy': '#232d42',
    '--ledger-navy-2': '#161e30',
    '--ledger-paper': '#efe6d3',
    '--ledger-rule': '#cab99a',
    '--ledger-brass': '#a9793a',
    '--ledger-red': '#9c3b30',
    '--ledger-green': '#3f6b4a',
} as React.CSSProperties

export const DISPLAY_FONT = { fontFamily: "'Fraunces', Georgia, serif" }
export const STAMP_FONT = { fontFamily: "'Special Elite', 'Courier New', monospace" }
export const MONO_FONT = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" }

export function useLedgerFonts() {
    useEffect(() => {
        if (document.getElementById('font-meeting-calendar')) return
        const link = document.createElement('link')
        link.id = 'font-meeting-calendar'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Special+Elite&family=IBM+Plex+Mono:wght@400;600&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Шапка страницы: обложка канцелярской книги ──────────────────────────────

export function LedgerHero({ eyebrow, title, subtitle, children }: {
    eyebrow: string; title: string; subtitle: string; children?: React.ReactNode
}) {
    return (
        <div
            className="relative overflow-hidden"
            style={{
                backgroundImage: `
                    linear-gradient(155deg, var(--ledger-navy) 0%, var(--ledger-navy-2) 60%, #0d1220 100%),
                    repeating-linear-gradient(180deg, rgba(169,121,58,0.08) 0px, rgba(169,121,58,0.08) 1px, transparent 1px, transparent 30px)
                `,
            }}
        >
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 sm:w-4" style={{ background: 'linear-gradient(180deg, var(--ledger-brass), #7a5726)' }}>
                <div className="flex flex-col items-center gap-8 pt-10">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }} />
                    ))}
                </div>
            </div>
            <div className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-8 pb-10 pl-8 sm:pl-12">
                <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                    ← Все примеры
                </Link>
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 font-medium text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--ledger-brass)', ...STAMP_FONT }}>
                        {eyebrow}
                    </span>
                    <h1 className="mt-3 text-4xl md:text-5xl leading-tight text-white/95" style={DISPLAY_FONT}>{title}</h1>
                    <p className="mt-4 text-sm leading-relaxed text-white/55 max-w-xl">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    )
}

export function LedgerStrip({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-6 inline-flex flex-wrap rounded-lg bg-black/25 border border-white/10 overflow-hidden backdrop-blur-sm">
            {children}
        </div>
    )
}

export function LedgerStat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="px-4 py-2 sm:px-5 flex flex-col gap-0.5 border-l first:border-l-0 border-white/10">
            <span className="text-[9px] uppercase tracking-[0.16em] text-white/40">{label}</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--ledger-brass)', ...MONO_FONT }}>{value}</span>
        </div>
    )
}

// ── Штамп статуса — сигнатурный элемент раздела ─────────────────────────────

const STAMP_CONFIG: Record<MeetingStatus, { label: string; color: string; rotate: string }> = {
    scheduled: { label: 'Назначено', color: 'var(--ledger-green)', rotate: '-3deg' },
    cancelled: { label: 'Отменено', color: 'var(--ledger-red)', rotate: '-6deg' },
    rescheduled: { label: 'Перенесено', color: 'var(--ledger-brass)', rotate: '4deg' },
}

export function StatusStamp({ status, size = 'md' }: { status: MeetingStatus; size?: 'sm' | 'md' }) {
    const cfg = STAMP_CONFIG[status]
    const dims = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]'
    return (
        <span
            className={`inline-flex items-center rounded-sm border-2 font-bold uppercase tracking-[0.12em] ${dims}`}
            style={{
                color: cfg.color,
                borderColor: cfg.color,
                transform: `rotate(${cfg.rotate})`,
                boxShadow: `0 0 0 1px ${cfg.color}22 inset`,
                ...STAMP_FONT,
            }}
        >
            {cfg.label}
        </span>
    )
}

// ── Карточка адресной книги приёмной ─────────────────────────────────────────

export function DirectoryCard({ name, detail, phone, onUse }: {
    name: string; detail: string; phone: string; onUse: () => void
}) {
    return (
        <div
            className="relative rounded-lg border px-3 py-2.5 bg-card transition-colors hover:border-[var(--ledger-brass)]"
            style={{ borderColor: 'var(--border)' }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{detail}</p>
                    <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--ledger-brass)', ...MONO_FONT }}>{phone}</p>
                </div>
                <button
                    onClick={onUse}
                    title="Забронировать на встречу"
                    className="flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-muted-foreground hover:text-white hover:border-transparent transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ledger-brass)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    )
}

// ── Бейдж уведомлённых подразделений ─────────────────────────────────────────

export function DepartmentsBadge({ count }: { count: number }) {
    if (count === 0) return null
    return (
        <span className="inline-flex items-center gap-1.5 text-white font-medium text-[11px] px-2.5 py-1 rounded-full" style={{ background: 'var(--ledger-navy)' }}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Рассылка: {count} подраздел{departmentsEnding(count)}
        </span>
    )
}
