import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Car, Flame, ShieldAlert, ChevronRight, ClipboardList, LayoutGrid, List } from 'lucide-react'
import { REPORTS, formatDate, formatWeekday, hasActiveIncidents, getPrevReport } from './data'
import { TrendBadge, PulseDot, Readout, WeatherIcon } from './ui'

type ViewMode = 'cards' | 'list'
const VIEW_MODE_KEY = 'dailyReportViewMode'

function getSavedViewMode(): ViewMode {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'cards'
}

function MiniStat({ icon, value, curr, prev }: { icon: React.ReactNode; value: number; curr: number; prev: number | null }) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-mono font-bold text-sm text-foreground tabular-nums">{value}</span>
            {prev !== null && <TrendBadge curr={curr} prev={prev} size="sm" />}
        </div>
    )
}

function CardStatRow({ icon, label, value, curr, prev }: { icon: React.ReactNode; label: string; value: number; curr: number; prev: number | null }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</span>
            <span className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-foreground tabular-nums">{value}</span>
                {prev !== null && <TrendBadge curr={curr} prev={prev} size="sm" />}
            </span>
        </div>
    )
}

function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
    const btnCls = (active: boolean) =>
        `p-1.5 rounded-lg transition-colors ${active ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'}`
    return (
        <div className="flex items-center gap-0.5 bg-foreground/5 border border-border rounded-xl p-1 flex-shrink-0">
            <button type="button" onClick={() => onChange('cards')} aria-label="Карточки" className={btnCls(mode === 'cards')}>
                <LayoutGrid size={15} />
            </button>
            <button type="button" onClick={() => onChange('list')} aria-label="Списком" className={btnCls(mode === 'list')}>
                <List size={15} />
            </button>
        </div>
    )
}

export default function DailyReportList() {
    const sorted = [...REPORTS].reverse()
    const latest = REPORTS[REPORTS.length - 1]
    const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode)

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem(VIEW_MODE_KEY, mode)
    }

    return (
        <div className="min-h-screen pt-16 bg-background">

            {/* ── Hero: пульт дежурного ── */}
            <div
                className="relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0b0f1a 0%, #17110f 50%, #1a0f0a 100%)' }}
            >
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full blur-3xl opacity-30"
                    style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full blur-3xl opacity-20"
                    style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }}
                />

                <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">
                    <Link to="/examples" className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mb-8">
                        <ArrowLeft size={13} /> Все примеры
                    </Link>

                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <div className="inline-flex items-center gap-2 mb-4">
                            <PulseDot color="#f59e0b" />
                            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-amber-400/90">
                                Сводка за сутки · дежурная часть
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                            Ежедневная оперативная сводка
                        </h1>
                        <p className="text-white/50 mt-4 max-w-xl leading-relaxed text-sm">
                            Обстановка в регионе за прошедшие сутки: дорожно-транспортные происшествия, пожары,
                            преступления и аварии на объектах ЖКХ. Актуально на {formatDate(latest.date)}.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
                    >
                        <Readout value={latest.traffic.total} label="ДТП сегодня" accent="#fb923c" />
                        <Readout value={latest.fires.total} label="Пожары" accent="#f87171" />
                        <Readout value={latest.crimes.total} label="Преступления" accent="#a5b4fc" />
                        <Readout value={latest.calls112} label="Вызовы 112" accent="#22d3ee" />
                    </motion.div>
                </div>
            </div>

            {/* ── Лента рапортов ── */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex items-end justify-between mb-6 gap-4">
                    <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Архив</p>
                        <h2 className="text-xl font-semibold text-foreground">Рапорты за последние {REPORTS.length} суток</h2>
                    </div>
                    <ViewToggle mode={viewMode} onChange={setViewMode} />
                </div>

                {viewMode === 'cards' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {sorted.map((r, i) => {
                                const prev = getPrevReport(r.id)
                                const active = hasActiveIncidents(r)
                                return (
                                    <motion.div
                                        key={r.id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                    >
                                        <Link
                                            to={`/examples/daily-report/${r.id}`}
                                            className="group relative flex flex-col card-block rounded-2xl p-5 pt-6 hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full"
                                        >
                                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: active ? '#f59e0b' : '#10b981' }} />

                                            <div className="flex items-start justify-between gap-2 mb-4">
                                                <div>
                                                    <div className="font-mono text-xl font-bold tabular-nums text-foreground">
                                                        {formatDate(r.date)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground capitalize flex items-center gap-1.5 mt-0.5">
                                                        {formatWeekday(r.date)}
                                                        <WeatherIcon condition={r.weather.condition} size={12} className="text-muted-foreground/70" />
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${
                                                    active ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
                                                }`}>
                                                    {active ? 'Авария' : 'Стабильно'}
                                                </span>
                                            </div>

                                            <div className="flex-1">
                                                <CardStatRow icon={<Car size={13} className="text-orange-500 flex-shrink-0" />} label="ДТП" value={r.traffic.total} curr={r.traffic.total} prev={prev?.traffic.total ?? null} />
                                                <CardStatRow icon={<Flame size={13} className="text-rose-500 flex-shrink-0" />} label="Пожары" value={r.fires.total} curr={r.fires.total} prev={prev?.fires.total ?? null} />
                                                <CardStatRow icon={<ShieldAlert size={13} className="text-indigo-400 flex-shrink-0" />} label="Преступления" value={r.crimes.total} curr={r.crimes.total} prev={prev?.crimes.total ?? null} />
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-1 text-xs text-sky-500 dark:text-sky-400 font-medium">
                                                Открыть рапорт <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {sorted.map((r, i) => {
                                const prev = getPrevReport(r.id)
                                const active = hasActiveIncidents(r)
                                return (
                                    <motion.div
                                        key={r.id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ delay: i * 0.04, duration: 0.3 }}
                                    >
                                        <Link
                                            to={`/examples/daily-report/${r.id}`}
                                            className="group relative flex rounded-2xl overflow-hidden card-block hover:-translate-y-0.5 transition-all duration-200"
                                        >
                                            <div
                                                className="w-1.5 flex-shrink-0"
                                                style={{ background: active ? '#f59e0b' : '#10b981' }}
                                            />
                                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 p-5">
                                                <div className="sm:w-36 flex-shrink-0 flex sm:block items-baseline gap-2">
                                                    <div className="font-mono text-2xl font-bold tabular-nums text-foreground">
                                                        {formatDate(r.date)}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground capitalize flex items-center gap-1.5">
                                                        {formatWeekday(r.date)}
                                                        <WeatherIcon condition={r.weather.condition} size={12} className="text-muted-foreground/70" />
                                                    </div>
                                                </div>

                                                <div className="flex-1 grid grid-cols-3 gap-3 sm:gap-6">
                                                    <MiniStat icon={<Car size={13} className="text-orange-500 flex-shrink-0" />} value={r.traffic.total} curr={r.traffic.total} prev={prev?.traffic.total ?? null} />
                                                    <MiniStat icon={<Flame size={13} className="text-rose-500 flex-shrink-0" />} value={r.fires.total} curr={r.fires.total} prev={prev?.fires.total ?? null} />
                                                    <MiniStat icon={<ShieldAlert size={13} className="text-indigo-400 flex-shrink-0" />} value={r.crimes.total} curr={r.crimes.total} prev={prev?.crimes.total ?? null} />
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
                                                    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                                                        active ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
                                                    }`}>
                                                        {active ? 'Активная авария' : 'Обстановка стабильна'}
                                                    </span>
                                                    <ChevronRight size={16} className="text-muted-foreground/40 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── Заметка ── */}
                <div className="mt-12 border-l-2 border-amber-500/40 pl-6 py-1">
                    <p className="text-foreground/70 italic leading-snug flex items-start gap-3">
                        <ClipboardList className="h-5 w-5 flex-shrink-0 text-amber-500/70 not-italic mt-0.5" />
                        Регулярная сводка помогает дежурной части оперативно отслеживать обстановку в регионе
                        и вовремя реагировать на аварийные ситуации.
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-3 font-mono">
                        * Данные вымышленные — интерактивный пример вёрстки для портфолио
                    </p>
                </div>
            </div>
        </div>
    )
}
