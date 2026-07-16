import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useSelector } from 'react-redux'
import { Archive, ArrowLeft, Loader2 } from 'lucide-react'
import { RootState } from '@/store'
import { apiGetTodoDays, TodoDay } from '@/api/todo'
import { DayCard, DayListItem, ViewMode, ViewToggle, getSavedViewMode, isArchivable, todayStr } from './shared'

export default function TodoArchivePage() {
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)
    const authLoading = useSelector((s: RootState) => s.auth.loading)

    const [days, setDays] = useState<TodoDay[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewModeState] = useState<ViewMode>(getSavedViewMode)

    useEffect(() => {
        if (!isAuth) return
        apiGetTodoDays()
            .then(r => setDays(r.data))
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [isAuth])

    if (authLoading) return null
    if (!isAuth) return <Navigate to="/login" replace />

    const setViewMode = (mode: ViewMode) => {
        setViewModeState(mode)
        localStorage.setItem('todoViewMode', mode)
    }

    const today = todayStr()
    const archived = (Array.isArray(days) ? days : [])
        .filter(d => !!d?.date && isArchivable(d, today))
        .sort((a, b) => b.date.localeCompare(a.date))

    return (
        <div className="min-h-screen pt-24 pb-16 max-w-4xl mx-auto px-4">
            <Link to="/todo" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6">
                <ArrowLeft size={13} /> Все дни
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-500/15 border border-slate-500/25 flex items-center justify-center flex-shrink-0">
                            <Archive className="text-slate-500 dark:text-slate-400" size={18} />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Архив</h1>
                    </div>
                    <p className="text-muted-foreground text-sm">Прошедшие дни с выполненными задачами. Хранятся 30 дней, затем удаляются автоматически.</p>
                </div>
                {archived.length > 0 && <ViewToggle mode={viewMode} onChange={setViewMode} />}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : archived.length === 0 ? (
                <p className="text-muted-foreground text-sm py-8 text-center">В архиве пока пусто</p>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence mode="popLayout">
                        {archived.map((day, i) => (
                            <DayCard key={day.id} day={day} index={i} />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {archived.map(day => (
                            <DayListItem key={day.id} day={day} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
