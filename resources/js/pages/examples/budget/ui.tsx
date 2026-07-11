import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ── Акцентная палитра и шрифты ──────────────────────────────────────────────

export const ACCENT = {
    '--budget-ink': '#12342a',
    '--budget-ink-light': '#8fd6b4',
    '--budget-gold': '#c9a24b',
    '--budget-gold-light': '#e8d9ad',
} as React.CSSProperties

export const PLAYFAIR = { fontFamily: "'Playfair Display', Georgia, serif" }
export const PLEX_MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace" }

export function useBudgetFonts() {
    useEffect(() => {
        if (document.getElementById('font-budget')) return
        const link = document.createElement('link')
        link.id = 'font-budget'
        link.rel = 'stylesheet'
        link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=IBM+Plex+Mono:wght@500;600&display=swap'
        document.head.appendChild(link)
    }, [])
}

// ── Навигация по разделам ───────────────────────────────────────────────────

const PAGES = [
    { path: '/examples/budget', label: 'Обзор' },
    { path: '/examples/budget/regions', label: 'Регионы округа' },
    { path: '/examples/budget/structure', label: 'Структура доходов' },
]

export function BudgetNav() {
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
                            ? { background: 'var(--budget-ink)', color: '#fff', borderColor: 'var(--budget-ink)' }
                            : { borderColor: 'transparent' }}
                    >
                        <span className={active ? '' : 'text-muted-foreground hover:text-foreground'}>{p.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}

// ── Гербовая печать (декоративный водяной знак в шапке) ─────────────────────

export function SealMark({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 200" className={className} aria-hidden>
            <circle cx="100" cy="100" r="92" fill="none" stroke="var(--budget-gold)" strokeWidth="1" opacity="0.5" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="var(--budget-gold)" strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
            <circle cx="100" cy="100" r="58" fill="none" stroke="var(--budget-gold)" strokeWidth="1" opacity="0.4" />
            <path id="seal-arc" d="M 32,100 A 68,68 0 1,1 168,100" fill="none" />
            <text fontSize="11" letterSpacing="3" fill="var(--budget-gold)" opacity="0.75">
                <textPath href="#seal-arc" startOffset="50%" textAnchor="middle">
                    ИСПОЛНЕНИЕ БЮДЖЕТА · {new Date().getFullYear()}
                </textPath>
            </text>
            <text x="100" y="93" textAnchor="middle" fontSize="34" fontWeight="700" fill="var(--budget-gold)" opacity="0.8" style={PLAYFAIR}>₽</text>
            <text x="100" y="118" textAnchor="middle" fontSize="9" letterSpacing="2" fill="var(--budget-gold)" opacity="0.6">УТВЕРЖДЕНО</text>
        </svg>
    )
}

// ── Тикер-лента реквизитов отчёта ───────────────────────────────────────────

export function TickerField({ label, value }: { label: string; value: string }) {
    return (
        <div className="px-4 py-2 sm:px-5 flex flex-col gap-0.5 border-l first:border-l-0 border-white/10">
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</span>
            <span className="text-sm font-semibold text-[var(--budget-gold-light)]" style={PLEX_MONO}>{value}</span>
        </div>
    )
}

export function TickerStrip({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-6 inline-flex flex-wrap rounded-xl bg-black/25 border border-white/10 overflow-hidden backdrop-blur-sm">
            {children}
        </div>
    )
}

// ── Тренд-бейдж ──────────────────────────────────────────────────────────────

export function TrendBadge({ curr, prev, invert = false }: { curr: number; prev: number; invert?: boolean }) {
    const pct = ((curr - prev) / prev) * 100
    const dir = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'flat'
    if (dir === 'flat') {
        return (
            <span className="inline-flex items-center gap-1 font-medium rounded-full bg-foreground/8 text-foreground/40 text-[11px] px-2 py-0.5" style={PLEX_MONO}>
                <Minus size={10} /> 0%
            </span>
        )
    }
    const good = invert ? dir === 'up' : dir === 'down'
    return (
        <span className={`inline-flex items-center gap-1 font-medium rounded-full text-[11px] px-2 py-0.5 ${
            good ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
        }`} style={PLEX_MONO}>
            {dir === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
    )
}

// ── КПИ-«штамп» ──────────────────────────────────────────────────────────────

export function KpiStamp({ label, value, sub, accent, badge }: {
    label: string; value: string; sub: string; accent: string; badge?: React.ReactNode
}) {
    return (
        <div className="relative card-block rounded-2xl p-5 pt-6 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
            <p className="text-[28px] font-bold mt-1.5 leading-none tabular-nums" style={{ ...PLEX_MONO, color: accent }}>{value}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground leading-snug pr-2">{sub}</p>
                {badge}
            </div>
        </div>
    )
}

// ── Подсказка для графиков recharts ─────────────────────────────────────────

export function ReportTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-card rounded-lg p-3 shadow-xl border border-border text-sm max-w-xs">
            {label && <p className="font-semibold mb-1.5 text-foreground leading-tight">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-xs text-muted-foreground flex-1">{p.name}</span>
                    <span className="font-medium" style={PLEX_MONO}>{typeof p.value === 'number' ? p.value.toLocaleString('ru-RU') : p.value}</span>
                </div>
            ))}
        </div>
    )
}

// ── Обёртка карточки-графика ─────────────────────────────────────────────────

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
    return (
        <div className="card-block rounded-2xl p-5">
            <h3 className="font-semibold text-foreground" style={PLAYFAIR}>{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1 mb-2">{subtitle}</p>}
            {!subtitle && <div className="mb-2" />}
            {children}
        </div>
    )
}

// ── Мини-шапка для внутренних страниц раздела ───────────────────────────────

export function BudgetHero({ eyebrow, title, subtitle, children }: {
    eyebrow: string; title: string; subtitle: string; children?: React.ReactNode
}) {
    return (
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #0a2118 0%, #12342a 55%, #0a1c15 100%)' }}>
            <SealMark className="pointer-events-none absolute -right-10 -top-10 w-64 h-64 opacity-70 hidden sm:block" />
            <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-10">
                <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                    ← Все примеры
                </Link>
                <div className="max-w-2xl">
                    <span className="inline-flex items-center gap-2 font-medium text-[11px] uppercase tracking-[0.25em] text-[var(--budget-gold-light)]" style={PLEX_MONO}>
                        {eyebrow}
                    </span>
                    <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight text-white" style={PLAYFAIR}>{title}</h1>
                    <p className="mt-4 text-sm leading-relaxed text-white/60 max-w-xl">{subtitle}</p>
                </div>
                {children}
            </div>
        </div>
    )
}
