import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

// ── Акцентная палитра и шрифты ──────────────────────────────────────────────

export const ACCENT = {
    '--rank-ink': '#1a1a1a',
    '--rank-ink-2': '#2a2a2a',
    '--rank-amber': '#ff9d2e',
    '--rank-amber-dim': '#c97a1f',
} as React.CSSProperties

export const DISPLAY_FONT = { fontFamily: "'Bebas Neue', system-ui, sans-serif" }
export const MONO_FONT = { fontFamily: "'Space Mono', ui-monospace, monospace" }

export function useRatingFonts() {
    useEffect(() => {
        if (document.getElementById('font-branch-rating')) return
        const link = document.createElement('link')
        link.id = 'font-branch-rating'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Навигация по разделам ───────────────────────────────────────────────────

const PAGES = [
    { path: '/examples/branch-rating', label: 'Рейтинг филиалов' },
    { path: '/examples/branch-rating/indicators', label: 'Исполнение показателей' },
    { path: '/examples/branch-rating/comparison', label: 'Сравнительный анализ' },
    { path: '/examples/branch-rating/branches', label: 'Филиалы' },
]

export function RatingNav() {
    const { pathname } = useLocation()
    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {PAGES.map(p => {
                const active = pathname === p.path
                return (
                    <Link
                        key={p.path}
                        to={p.path}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border"
                        style={active
                            ? { background: 'var(--rank-amber)', color: '#1a1a1a', borderColor: 'var(--rank-amber)' }
                            : { borderColor: 'transparent' }}
                    >
                        <span className={active ? '' : 'text-muted-foreground hover:text-foreground'}>{p.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}

// ── «Флип-панель» — сигнатурный элемент табло ───────────────────────────────

export function FlipBadge({ value, size = 'md', tone = 'amber' }: {
    value: string | number
    size?: 'sm' | 'md' | 'lg'
    tone?: 'amber' | 'emerald' | 'rose'
}) {
    const dims = size === 'lg' ? 'w-20 h-20 text-3xl' : size === 'sm' ? 'w-10 h-10 text-sm' : 'w-14 h-14 text-xl'
    const bg = tone === 'emerald' ? '#1a2e22' : tone === 'rose' ? '#2e1a1a' : 'var(--rank-ink-2)'
    const color = tone === 'emerald' ? '#4ade80' : tone === 'rose' ? '#f87171' : 'var(--rank-amber)'
    return (
        <div
            className={`relative flex-shrink-0 rounded-md flex items-center justify-center font-bold overflow-hidden ${dims}`}
            style={{ background: bg, color, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.4)', ...MONO_FONT }}
        >
            <span className="relative z-10">{value}</span>
            <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-black/50" />
            <span className="absolute inset-x-0 top-0 h-1/2 bg-white/[0.03]" />
        </div>
    )
}

// ── Табло-лента в шапке ──────────────────────────────────────────────────────

export function BoardStrip({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-6 inline-flex flex-wrap rounded-xl bg-black/30 border border-white/10 overflow-hidden backdrop-blur-sm">
            {children}
        </div>
    )
}

export function BoardField({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-4 py-2 sm:px-5 flex flex-col gap-0.5 border-l first:border-l-0 border-white/10">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</span>
            <span className="text-sm font-semibold text-[var(--rank-amber)]" style={MONO_FONT}>{value}</span>
        </div>
    )
}

// ── Шапка страницы ───────────────────────────────────────────────────────────

export function RatingHero({ eyebrow, title, subtitle, children }: {
    eyebrow: string; title: string; subtitle: string; children?: React.ReactNode
}) {
    return (
        <div
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(150deg, var(--rank-ink) 0%, var(--rank-ink-2) 55%, #101010 100%)',
                backgroundImage: `
                    linear-gradient(150deg, var(--rank-ink) 0%, var(--rank-ink-2) 55%, #101010 100%),
                    repeating-linear-gradient(0deg, rgba(255,157,46,0.05) 0px, rgba(255,157,46,0.05) 1px, transparent 1px, transparent 24px)
                `,
            }}
        >
            <div className="pointer-events-none absolute right-4 top-6 hidden sm:flex gap-1.5 opacity-90">
                {['Т','О','П'].map((ch, i) => <FlipBadge key={i} value={ch} size="sm" />)}
            </div>
            <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                    ← Все примеры
                </Link>
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 font-medium text-[11px] uppercase tracking-[0.25em] text-[var(--rank-amber)]" style={MONO_FONT}>
                        {eyebrow}
                    </span>
                    <h1 className="mt-3 text-5xl md:text-6xl leading-tight text-white tracking-wide" style={DISPLAY_FONT}>{title}</h1>
                    <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    )
}

// ── Подсказка для графиков recharts ─────────────────────────────────────────

export function RatingTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-[240px]">
            {label && <p className="font-semibold mb-1.5 text-foreground leading-tight text-xs">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{p.name}</span>
                    <span className="font-bold" style={MONO_FONT}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Общий тик оси X (наклонные подписи филиалов) ────────────────────────────

export function XTickAngled({ x, y, payload }: any) {
    const MAX = 18
    const t: string = payload.value ?? ''
    const label = t.length > MAX ? t.slice(0, MAX) + '…' : t
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={10} textAnchor="end" fontSize={10} fill="currentColor" transform="rotate(-40)">{label}</text>
        </g>
    )
}

// ── Карточка снапшота отчёта ─────────────────────────────────────────────────

export function ReportMeta({ date, file }: { date: string; file: string }) {
    return (
        <div className="card-block rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-6">
            <div>
                <p className="text-xs text-muted-foreground mb-1">Дата отчёта</p>
                <p className="text-2xl font-bold text-foreground" style={DISPLAY_FONT}>{date}</p>
            </div>
            <div className="border-l border-border pl-6 text-xs text-muted-foreground space-y-0.5">
                <p>{file}</p>
                <p>Филиалов в отчёте: 8</p>
            </div>
        </div>
    )
}
