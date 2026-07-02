import { TrendingUp, TrendingDown, Minus, Sun, CloudSun, Cloud, CloudRain, CloudLightning } from 'lucide-react'

// ── Тренд ──────────────────────────────────────────────────────────────────

export function trendOf(curr: number, prev: number) {
    if (prev === 0 && curr === 0) return { dir: 'flat' as const, pct: 0 }
    if (prev === 0) return { dir: 'up' as const, pct: 100 }
    const pct = Math.round(((curr - prev) / prev) * 100)
    return { dir: pct > 0 ? 'up' as const : pct < 0 ? 'down' as const : 'flat' as const, pct }
}

/** invert=true — рост значения считается хорошим (напр. раскрываемость) */
export function TrendBadge({ curr, prev, invert = false, size = 'md' }: {
    curr: number
    prev: number
    invert?: boolean
    size?: 'sm' | 'md'
}) {
    const t = trendOf(curr, prev)
    const cls = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5'
    const iconSize = size === 'sm' ? 9 : 10

    if (t.dir === 'flat') {
        return (
            <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full bg-foreground/8 text-foreground/40 ${cls}`}>
                <Minus size={iconSize} /> 0%
            </span>
        )
    }
    const good = invert ? t.dir === 'up' : t.dir === 'down'
    return (
        <span className={`inline-flex items-center gap-1 font-mono font-semibold rounded-full ${cls} ${
            good ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500 dark:text-rose-400'
        }`}>
            {t.dir === 'up' ? <TrendingUp size={iconSize} /> : <TrendingDown size={iconSize} />}
            {t.pct > 0 ? '+' : ''}{t.pct}%
        </span>
    )
}

// ── LED-readout (для hero-тикера и KPI) ──────────────────────────────────

export function Readout({ value, label, accent }: { value: string | number; label: string; accent: string }) {
    return (
        <div
            className="rounded-xl px-4 py-3 border"
            style={{ background: 'rgba(0,0,0,0.28)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
            <div
                className="font-mono text-2xl font-bold tabular-nums leading-none"
                style={{ color: accent, textShadow: `0 0 14px ${accent}66` }}
            >
                {value}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 mt-1.5">{label}</div>
        </div>
    )
}

// ── Прогресс-полоса ──────────────────────────────────────────────────────

export function ProgressBar({ percent, color }: { percent: number; color: string }) {
    const w = Math.max(0, Math.min(percent, 100))
    return (
        <div className="mt-2 h-1.5 rounded-full bg-foreground/8 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, background: color }} />
        </div>
    )
}

// ── Иконка погоды ─────────────────────────────────────────────────────────

export function WeatherIcon({ condition, size = 14, className = '' }: { condition: string; size?: number; className?: string }) {
    const c = condition.toLowerCase()
    if (c.includes('гроза')) return <CloudLightning size={size} className={className} />
    if (c.includes('пасмур')) return <CloudRain size={size} className={className} />
    if (c.includes('переменная') || c.includes('малооблачно')) return <CloudSun size={size} className={className} />
    if (c.includes('облачно')) return <Cloud size={size} className={className} />
    return <Sun size={size} className={className} />
}

// ── Статус-точка (пульс) ─────────────────────────────────────────────────

export function PulseDot({ color = '#f59e0b' }: { color?: string }) {
    return (
        <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
        </span>
    )
}
