import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Car, Flame, ShieldAlert, PhoneCall, Zap, Droplets, AlertTriangle, Thermometer,
    MapPin, Clock, Users, CheckCircle2, Wind, Gauge, Info,
} from 'lucide-react'
import {
    getReport, getPrevReport, formatDate, formatWeekday, hasActiveIncidents, fireCalloutRows,
    UTILITY_LABELS, DailyReport, ViolationItem,
} from './data'
import { TrendBadge, ProgressBar, WeatherIcon, PulseDot } from './ui'

const SECTIONS = [
    { id: 'sec-summary', label: 'Сводка дня', color: '#f59e0b' },
    { id: 'sec-traffic', label: 'ДТП', color: '#fb923c' },
    { id: 'sec-fires', label: 'Пожары', color: '#f87171' },
    { id: 'sec-crimes', label: 'Правопорядок', color: '#a5b4fc' },
    { id: 'sec-utilities', label: 'ЖКХ', color: '#22d3ee' },
    { id: 'sec-weather', label: 'Погода', color: '#38bdf8' },
] as const

const UTILITY_META: Record<keyof DailyReport['utilities'], { icon: React.ReactNode; color: string }> = {
    electricity: { icon: <Zap size={13} />, color: '#f59e0b' },
    water: { icon: <Droplets size={13} />, color: '#22d3ee' },
    gas: { icon: <AlertTriangle size={13} />, color: '#fb923c' },
    heat: { icon: <Thermometer size={13} />, color: '#a78bfa' },
}

function Spine() {
    return (
        <nav className="hidden lg:flex flex-col gap-4 fixed top-1/2 -translate-y-1/2 left-6 z-40">
            {SECTIONS.map(s => (
                <a key={s.id} href={`#${s.id}`} className="group flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 transition-transform group-hover:scale-125" style={{ background: s.color }} />
                    <span className="text-[11px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {s.label}
                    </span>
                </a>
            ))}
        </nav>
    )
}

function Section({ id, eyebrow, title, color, children }: { id: string; eyebrow: string; title: string; color: string; children: React.ReactNode }) {
    return (
        <motion.section
            id={id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4 }}
            className="scroll-mt-24 mb-12 pl-5 border-l-2"
            style={{ borderColor: `${color}55` }}
        >
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{eyebrow}</p>
            <h2 className="text-xl font-semibold text-foreground mb-5">{title}</h2>
            {children}
        </motion.section>
    )
}

function KpiCard({ icon, label, value, curr, prev, invert }: {
    icon: React.ReactNode; label: string; value: number; curr: number; prev: number | null; invert?: boolean
}) {
    return (
        <div className="card-block rounded-2xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3">{icon}{label}</div>
            <div className="font-mono text-3xl font-bold text-foreground tabular-nums leading-none">{value}</div>
            <div className="mt-2.5">
                {prev !== null
                    ? <TrendBadge curr={curr} prev={prev} invert={invert} />
                    : <span className="text-[10px] text-muted-foreground font-mono">нет данных за пред. сутки</span>}
            </div>
        </div>
    )
}

function StatRow({ label, curr, prev, invert }: { label: string; curr: number; prev: number | null; invert?: boolean }) {
    const ratio = prev ? Math.min(Math.round((curr / Math.max(prev, 1)) * 100), 100) : 100
    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground flex-1">{label}</span>
            <span className="font-mono font-bold text-foreground tabular-nums w-8 text-right">{curr}</span>
            {prev !== null ? <TrendBadge curr={curr} prev={prev} invert={invert} size="sm" /> : <span className="w-14" />}
        </div>
    )
}

function ViolationCard({ item, resolved, color }: { item: ViolationItem; resolved: boolean; color: string }) {
    return (
        <div className="card-block rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 flex items-center justify-between gap-2" style={{ background: `${color}18` }}>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <MapPin size={12} style={{ color }} className="flex-shrink-0" />
                    {item.locality}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    resolved ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-500 dark:text-amber-400'
                }`}>
                    {resolved ? 'Устранено' : 'В процессе'}
                </span>
            </div>
            <div className="p-4 space-y-2.5">
                <p className="text-xs text-foreground/80 leading-relaxed">{item.reason}</p>
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Clock size={11} className="flex-shrink-0 mt-0.5" />
                    <span>{resolved ? 'Устранено' : 'Ориентир'}: <strong className="text-foreground/70 font-medium">{item.date}</strong></span>
                </div>
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Users size={11} className="flex-shrink-0 mt-0.5" />
                    <span>{item.consumers}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-border flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" />
                    <span>{item.enterprise ?? item.responsible}</span>
                </div>
            </div>
        </div>
    )
}

export default function DailyReportDetail() {
    const { reportId } = useParams<{ reportId: string }>()
    const report = getReport(Number(reportId))

    if (!report) return <Navigate to="/examples/daily-report" replace />

    const prev = getPrevReport(report.id)
    const active = hasActiveIncidents(report)
    const solvedPct = Math.round((report.crimes.solved / Math.max(report.crimes.total, 1)) * 100)
    const utilityEntries = (Object.keys(report.utilities) as (keyof DailyReport['utilities'])[])
        .map(key => ({ key, block: report.utilities[key], meta: UTILITY_META[key], label: UTILITY_LABELS[key] }))
        .filter(u => u.block.current.length > 0 || u.block.eliminated.length > 0)

    return (
        <div className="min-h-screen pt-16 bg-background">
            <Spine />

            {/* ── Top bar ── */}
            <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
                    <Link to="/examples/daily-report" className="w-8 h-8 rounded-lg flex items-center justify-center bg-foreground/5 hover:bg-foreground/10 border border-border transition-colors flex-shrink-0">
                        <ArrowLeft size={15} />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-foreground leading-tight">{formatDate(report.date)}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{formatWeekday(report.date)}</p>
                    </div>
                    <span className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        active ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400' : 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400'
                    }`}>
                        <PulseDot color={active ? '#f59e0b' : '#10b981'} />
                        {active ? 'Активная авария' : 'Обстановка стабильна'}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-10">

                {report.note && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-10 flex items-start gap-3 rounded-2xl bg-sky-500/8 border border-sky-500/20 px-4 py-3.5"
                    >
                        <Info size={15} className="text-sky-500 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground/75 leading-relaxed">{report.note}</p>
                    </motion.div>
                )}

                {/* ── Сводка дня ── */}
                <Section id="sec-summary" eyebrow="Ключевые показатели" title="Сводка дня" color="#f59e0b">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <KpiCard icon={<Car size={13} className="text-orange-500" />} label="ДТП" value={report.traffic.total} curr={report.traffic.total} prev={prev?.traffic.total ?? null} />
                        <KpiCard icon={<Flame size={13} className="text-rose-500" />} label="Пожары" value={report.fires.total} curr={report.fires.total} prev={prev?.fires.total ?? null} />
                        <KpiCard icon={<ShieldAlert size={13} className="text-indigo-400" />} label="Преступления" value={report.crimes.total} curr={report.crimes.total} prev={prev?.crimes.total ?? null} />
                        <KpiCard icon={<PhoneCall size={13} className="text-cyan-500" />} label="Вызовы 112" value={report.calls112} curr={report.calls112} prev={prev?.calls112 ?? null} />
                    </div>
                </Section>

                {/* ── ДТП ── */}
                <Section id="sec-traffic" eyebrow="Дорожная обстановка" title="Дорожно-транспортные происшествия" color="#fb923c">
                    <div className="card-block rounded-2xl p-5">
                        <StatRow label="Всего ДТП" curr={report.traffic.total} prev={prev?.traffic.total ?? null} />
                        <StatRow label="Погибло" curr={report.traffic.killed} prev={prev?.traffic.killed ?? null} />
                        <StatRow label="Пострадало" curr={report.traffic.injured} prev={prev?.traffic.injured ?? null} />
                        {prev && (
                            <>
                                <ProgressBar percent={Math.min(Math.round((report.traffic.total / Math.max(prev.traffic.total, 1)) * 100), 100)} color="#fb923c" />
                                <p className="text-[11px] text-muted-foreground mt-1.5 text-right">относительно предыдущих суток</p>
                            </>
                        )}
                    </div>
                </Section>

                {/* ── Пожары ── */}
                <Section id="sec-fires" eyebrow="Пожарная обстановка" title="Пожары и выезды пожарной охраны" color="#f87171">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="card-block rounded-2xl p-5">
                            <StatRow label="Всего пожаров" curr={report.fires.total} prev={prev?.fires.total ?? null} />
                            <StatRow label="Погибло" curr={report.fires.killed} prev={prev?.fires.killed ?? null} />
                            <StatRow label="Пострадало" curr={report.fires.injured} prev={prev?.fires.injured ?? null} />
                        </div>
                        <div className="card-block rounded-2xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-foreground/5">
                                <span className="text-xs font-semibold text-foreground">Детализация выездов</span>
                            </div>
                            <div className="p-4">
                                {fireCalloutRows(report.fires, report.traffic).map((row, i) => (
                                    <div key={i} className={`flex items-center justify-between py-1.5 text-xs ${row.sub ? 'pl-4 text-muted-foreground' : 'text-foreground/80'} ${row.bold ? 'font-bold border-t border-border mt-1 pt-2' : ''}`}>
                                        <span>{row.label}</span>
                                        <span className="font-mono font-semibold tabular-nums">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── Правопорядок ── */}
                <Section id="sec-crimes" eyebrow="Оперативная обстановка" title="Правопорядок" color="#a5b4fc">
                    <div className="card-block rounded-2xl p-5">
                        <StatRow label="Зарегистрировано преступлений" curr={report.crimes.total} prev={prev?.crimes.total ?? null} />
                        <StatRow label="Раскрыто" curr={report.crimes.solved} prev={prev?.crimes.solved ?? null} invert />
                        <StatRow label="В общественных местах" curr={report.crimes.publicPlaces} prev={prev?.crimes.publicPlaces ?? null} />
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border">
                            <Gauge size={14} className="text-indigo-400 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground flex-1">Раскрываемость за сутки</span>
                            <span className="font-mono font-bold text-sm text-foreground">{solvedPct}%</span>
                        </div>
                        <ProgressBar percent={solvedPct} color="#818cf8" />
                    </div>
                </Section>

                {/* ── ЖКХ ── */}
                <Section id="sec-utilities" eyebrow="Коммунальная инфраструктура" title="Нарушения на объектах ЖКХ" color="#22d3ee">
                    {utilityEntries.length === 0 ? (
                        <div className="card-block rounded-2xl p-6 text-center">
                            <CheckCircle2 size={22} className="mx-auto mb-2 text-emerald-500" />
                            <p className="text-sm text-muted-foreground">Все системы жизнеобеспечения функционируют в штатном режиме</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {utilityEntries.map(({ key, block, meta, label }) => (
                                <div key={key}>
                                    <div className="flex items-center gap-2 mb-3" style={{ color: meta.color }}>
                                        {meta.icon}
                                        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {block.current.map((item, i) => (
                                            <ViolationCard key={`c-${i}`} item={item} resolved={false} color={meta.color} />
                                        ))}
                                        {block.eliminated.map((item, i) => (
                                            <ViolationCard key={`e-${i}`} item={item} resolved color={meta.color} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* ── Погода ── */}
                <Section id="sec-weather" eyebrow="Гидрометеообстановка" title="Погода" color="#38bdf8">
                    <div className="card-block rounded-2xl p-5 flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <WeatherIcon condition={report.weather.condition} size={28} className="text-sky-400 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-foreground text-sm">{report.weather.condition}</p>
                                <p className="font-mono text-2xl font-bold text-foreground tabular-nums">
                                    {report.weather.tempMin}° <span className="text-muted-foreground text-base font-normal">/</span> {report.weather.tempMax}°
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Wind size={13} className="flex-shrink-0" /> Ветер {report.weather.wind} м/с
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Droplets size={13} className="flex-shrink-0" /> Осадки {report.weather.precipitation}%
                        </div>
                    </div>
                </Section>
            </div>
        </div>
    )
}
