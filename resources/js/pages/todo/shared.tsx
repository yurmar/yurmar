import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, LayoutGrid, List } from 'lucide-react'
import { TodoDay } from '@/api/todo'
import ProgressBar from '@/components/ui/ProgressBar'

export type ViewMode = 'cards' | 'list'
export const VIEW_MODE_KEY = 'todoViewMode'

export function getSavedViewMode(): ViewMode {
    return localStorage.getItem(VIEW_MODE_KEY) === 'list' ? 'list' : 'cards'
}

export function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatDate(str: string | null | undefined) {
    if (!str) return '—'
    const date = new Date(str)
    if (Number.isNaN(date.getTime())) return '—'
    const formatted = date
        .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'short' })
        .replace(/\s*г\.$/i, '')
    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export function statusOf(day: TodoDay): 'done' | 'partial' | 'none' | 'empty' {
    if (day.tasks_count === 0) return 'empty'
    if (day.done_tasks_count === day.tasks_count) return 'done'
    if (day.done_tasks_count === 0) return 'none'
    return 'partial'
}

export function percentOf(day: TodoDay): number {
    if (day.tasks_count === 0) return 0
    return Math.round((day.done_tasks_count / day.tasks_count) * 100)
}

export function isArchivable(day: TodoDay, today: string): boolean {
    return day.date < today && statusOf(day) === 'done'
}

export const STATUS_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
    done: { bar: '#10b981', badge: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400', label: 'Всё выполнено' },
    partial: { bar: '#f59e0b', badge: 'bg-amber-500/15 text-amber-500 dark:text-amber-400', label: 'Есть невыполненное' },
    none: { bar: '#ef4444', badge: 'bg-red-500/15 text-red-500 dark:text-red-400', label: 'Ничего не сделано' },
    empty: { bar: '#94a3b8', badge: 'bg-slate-500/15 text-slate-500 dark:text-slate-400', label: 'Пусто' },
}

export function ViewToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
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

export function DayCard({ day, index, isToday }: { day: TodoDay; index: number; isToday?: boolean }) {
    const status = statusOf(day)
    const s = STATUS_STYLES[status]
    return (
        <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03, duration: 0.25 }}>
            <Link
                to={`/todo/${day.id}`}
                className={`group relative flex flex-col card-block rounded-2xl p-5 pt-6 hover:-translate-y-1 transition-all duration-200 overflow-hidden h-full ${isToday ? 'ring-2 ring-sky-500/60' : ''}`}
            >
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: s.bar }} />
                {isToday && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500 text-white">Сегодня</span>
                )}
                <div className={`font-semibold text-foreground mb-2 break-words ${isToday ? 'pr-16' : ''}`}>{formatDate(day.date)}</div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1.5">
                    <span>Выполнено {day.done_tasks_count} из {day.tasks_count}</span>
                    <span className="font-mono text-xs tabular-nums flex-shrink-0 ml-2">{percentOf(day)}%</span>
                </div>
                <div className="mb-3">
                    <ProgressBar percent={percentOf(day)} color={s.bar} />
                </div>
                <span className={`self-start text-[10px] font-semibold px-2 py-1 rounded-full ${s.badge}`}>{s.label}</span>
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end gap-1 text-xs text-sky-500 dark:text-sky-400 font-medium">
                    Открыть <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
            </Link>
        </motion.div>
    )
}

export function DayListItem({ day, isToday }: { day: TodoDay; isToday?: boolean }) {
    const status = statusOf(day)
    const s = STATUS_STYLES[status]
    return (
        <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25 }}>
            <Link
                to={`/todo/${day.id}`}
                className={`group flex rounded-2xl overflow-hidden card-block hover:-translate-y-0.5 transition-all duration-200 ${isToday ? 'ring-2 ring-sky-500/60' : ''}`}
            >
                <div className="w-1.5 self-stretch flex-shrink-0" style={{ background: s.bar }} />
                <div className="flex-1 min-w-0 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="font-semibold text-foreground truncate">{formatDate(day.date)}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isToday && (
                                <span className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap bg-sky-500 text-white">Сегодня</span>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${s.badge}`}>{s.label}</span>
                            <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <ProgressBar percent={percentOf(day)} color={s.bar} />
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums font-mono">
                            {day.done_tasks_count}/{day.tasks_count} · {percentOf(day)}%
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
