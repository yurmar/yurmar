import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'

// ── Акцентная палитра и шрифты ──────────────────────────────────────────────

export const ACCENT = {
    '--stat-ink': '#0e1a22',
    '--stat-ink-2': '#16303a',
    '--stat-lime': '#baff5c',
    '--stat-lime-dim': '#8fcf49',
    '--stat-amber': '#ffb020',
    '--stat-violet': '#8b5cf6',
} as React.CSSProperties

export const MONO_DISPLAY = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }

export function useStatFonts() {
    useEffect(() => {
        if (document.getElementById('font-statistics')) return
        const link = document.createElement('link')
        link.id = 'font-statistics'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Навигация по разделам ───────────────────────────────────────────────────

const PAGES = [
    { path: '/examples/statistics', label: 'Обзор' },
    { path: '/examples/statistics/monitoring', label: 'Мониторинг' },
]

export function StatisticsNav() {
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
                            ? { background: 'var(--stat-lime)', color: '#0e1a22', borderColor: 'var(--stat-lime)' }
                            : { borderColor: 'transparent' }}
                    >
                        <span className={active ? '' : 'text-muted-foreground hover:text-foreground'}>{p.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}

// ── Осциллограф — декоративный сигнал в шапке ───────────────────────────────

export function ScopeTrace({ className = '' }: { className?: string }) {
    const pts = '0,60 30,58 60,44 90,50 120,20 150,34 180,12 210,26 240,8 270,22 300,4'
    return (
        <svg viewBox="0 0 300 70" className={className} aria-hidden preserveAspectRatio="none">
            <line x1="0" y1="17.5" x2="300" y2="17.5" stroke="var(--stat-lime)" strokeOpacity="0.12" strokeWidth="1" />
            <line x1="0" y1="35" x2="300" y2="35" stroke="var(--stat-lime)" strokeOpacity="0.12" strokeWidth="1" />
            <line x1="0" y1="52.5" x2="300" y2="52.5" stroke="var(--stat-lime)" strokeOpacity="0.12" strokeWidth="1" />
            <polyline
                points={pts}
                fill="none"
                stroke="var(--stat-lime)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
            />
            <circle cx="300" cy="4" r="4" fill="var(--stat-lime)">
                <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite" />
            </circle>
        </svg>
    )
}

// ── Планка-«ридаут» реквизитов ──────────────────────────────────────────────

export function ReadoutField({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-4 py-2 sm:px-5 flex flex-col gap-0.5 border-l first:border-l-0 border-white/10">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</span>
            <span className="text-sm font-semibold text-[var(--stat-lime)]" style={MONO_DISPLAY}>{value}</span>
        </div>
    )
}

export function ReadoutStrip({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-6 inline-flex flex-wrap rounded-xl bg-black/25 border border-white/10 overflow-hidden backdrop-blur-sm">
            {children}
        </div>
    )
}

// ── Шапка страницы ───────────────────────────────────────────────────────────

export function StatisticsHero({ eyebrow, title, subtitle, children }: {
    eyebrow: string; title: string; subtitle: string; children?: React.ReactNode
}) {
    return (
        <div
            className="relative overflow-hidden"
            style={{
                background: 'linear-gradient(150deg, var(--stat-ink) 0%, var(--stat-ink-2) 55%, #0a1319 100%)',
                backgroundImage: `
                    linear-gradient(150deg, var(--stat-ink) 0%, var(--stat-ink-2) 55%, #0a1319 100%),
                    repeating-linear-gradient(0deg, rgba(186,255,92,0.05) 0px, rgba(186,255,92,0.05) 1px, transparent 1px, transparent 28px),
                    repeating-linear-gradient(90deg, rgba(186,255,92,0.05) 0px, rgba(186,255,92,0.05) 1px, transparent 1px, transparent 28px)
                `,
            }}
        >
            <ScopeTrace className="pointer-events-none absolute right-6 top-8 w-64 h-16 opacity-80 hidden sm:block" />
            <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                    ← Все примеры
                </Link>
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 font-medium text-[11px] uppercase tracking-[0.25em] text-[var(--stat-lime)]" style={MONO_DISPLAY}>
                        {eyebrow}
                    </span>
                    <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight text-white" style={MONO_DISPLAY}>{title}</h1>
                    <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    )
}

// ── Значок отклонения от среднего ───────────────────────────────────────────

export function DevBadge({ value }: { value: number }) {
    const up = value >= 0
    return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full text-[11px] px-2 py-0.5 ${
            up ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
        }`} style={MONO_DISPLAY}>
            {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {value > 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
    )
}

// ── Подсказки для графиков recharts ─────────────────────────────────────────

export function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-xs">
            {label && <p className="font-semibold mb-1.5 text-foreground leading-tight">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color || p.fill || p.stroke }} />
                    <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                    <span className="font-medium" style={MONO_DISPLAY}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Обёртка карточки-графика ─────────────────────────────────────────────────

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="card-block rounded-2xl p-5">
            <h3 className="font-semibold text-foreground" style={MONO_DISPLAY}>{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 mb-2">{subtitle}</p>}
            {!subtitle && <div className="mb-2" />}
            {children}
        </div>
    )
}
