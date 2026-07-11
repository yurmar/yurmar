import React, { useMemo, useState } from 'react'
import {
    BarChart3, CalendarDays, ChevronLeft, ChevronRight, X,
    Plus, Pencil, Trash2, XCircle, CalendarClock, Search, ArrowLeft,
} from 'lucide-react'
import {
    ORG_NAME, DEPARTMENTS, DIRECTORY, DIRECTORY_LABELS,
    INITIAL_MEETINGS, MONTH_NAMES, formatDate, formatWeekday, departmentsEnding, makeMeetingId,
    type Meeting, type MeetingStatus, type DirectoryCategory,
} from './data'
import {
    ACCENT, DISPLAY_FONT, MONO_FONT,
    useLedgerFonts, LedgerHero, LedgerStrip, LedgerStat,
    StatusStamp, DirectoryCard, DepartmentsBadge,
} from './ui'

// ============================================================================
// ФОРМА СОВЕЩАНИЯ
// ============================================================================

interface MeetingFormData {
    topic: string
    organizer: string
    date: string
    timeStart: string
    timeEnd: string
    place: string
    notify: boolean
    departments: string[]
}

const EMPTY_FORM: MeetingFormData = {
    topic: '', organizer: '', date: '', timeStart: '10:00', timeEnd: '11:00',
    place: '', notify: false, departments: [],
}

function MeetingModal({ isOpen, initial, isEditing, onClose, onSave }: {
    isOpen: boolean
    initial: MeetingFormData | null
    isEditing: boolean
    onClose: () => void
    onSave: (data: MeetingFormData) => void
}) {
    const [form, setForm] = useState<MeetingFormData>(initial ?? EMPTY_FORM)

    React.useEffect(() => {
        if (isOpen) setForm(initial ?? EMPTY_FORM)
    }, [isOpen, initial])

    if (!isOpen) return null

    const toggleDept = (id: string) => {
        setForm(f => ({
            ...f,
            departments: f.departments.includes(id) ? f.departments.filter(d => d !== id) : [...f.departments, id],
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.topic.trim() || !form.date) return
        onSave(form)
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-foreground" style={DISPLAY_FONT}>
                        {isEditing ? 'Изменить запись' : 'Новая запись в журнале'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Тема совещания *</label>
                        <input
                            type="text" required value={form.topic}
                            onChange={(e) => setForm({ ...form, topic: e.target.value })}
                            placeholder="Например: Оперативное совещание при главе округа"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[var(--ledger-brass)] focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Председательствующий</label>
                        <input
                            type="text" value={form.organizer}
                            onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                            placeholder="ФИО, должность"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[var(--ledger-brass)] focus:border-transparent"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Дата *</label>
                            <input
                                type="date" required value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Начало</label>
                            <input
                                type="time" value={form.timeStart}
                                onChange={(e) => setForm({ ...form, timeStart: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Окончание</label>
                            <input
                                type="time" value={form.timeEnd}
                                onChange={(e) => setForm({ ...form, timeEnd: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Место проведения</label>
                        <input
                            type="text" value={form.place}
                            onChange={(e) => setForm({ ...form, place: e.target.value })}
                            placeholder="Например: Малый зал, каб. 214"
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                            <input
                                type="checkbox" checked={form.notify}
                                onChange={(e) => setForm({ ...form, notify: e.target.checked })}
                                className="w-4 h-4"
                            />
                            Разослать уведомления подразделениям
                        </label>
                        {form.notify && (
                            <div className="mt-2 flex flex-wrap gap-1.5 p-3 rounded-lg bg-background border border-border">
                                {DEPARTMENTS.map(d => {
                                    const active = form.departments.includes(d.id)
                                    return (
                                        <button
                                            type="button" key={d.id}
                                            onClick={() => toggleDept(d.id)}
                                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                                                active
                                                    ? 'text-white border-transparent'
                                                    : 'text-muted-foreground border-border hover:border-[var(--ledger-brass)]'
                                            }`}
                                            style={active ? { background: 'var(--ledger-navy)' } : undefined}
                                        >
                                            {d.name}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-background transition-colors">
                            Отмена
                        </button>
                        <button type="submit" className="flex-1 px-4 py-2 text-white rounded-lg transition-colors" style={{ background: 'var(--ledger-navy)' }}>
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ============================================================================
// КАРТОЧКА СОВЕЩАНИЯ (используется в деталях дня и в результатах поиска)
// ============================================================================

function MeetingCard({ meeting, onEdit, onCancel, onReschedule, onDelete, showDate }: {
    meeting: Meeting
    onEdit: (m: Meeting) => void
    onCancel: (m: Meeting) => void
    onReschedule: (m: Meeting) => void
    onDelete: (id: number) => void
    showDate?: boolean
}) {
    return (
        <div
            className="p-4 rounded-xl border bg-card"
            style={{ borderColor: meeting.status === 'cancelled' ? 'var(--ledger-red)' : meeting.status === 'rescheduled' ? 'var(--ledger-brass)' : 'var(--border)' }}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        {showDate && (
                            <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: 'var(--ledger-navy)' }}>
                                {formatDate(meeting.date)}
                            </span>
                        )}
                        <span className="text-xs font-semibold tabular-nums px-2 py-1 rounded-full border border-border text-foreground" style={MONO_FONT}>
                            {meeting.timeStart}–{meeting.timeEnd}
                        </span>
                        <StatusStamp status={meeting.status} size="sm" />
                        <DepartmentsBadge count={meeting.departments.length} />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">{meeting.topic}</h4>
                    <p className="text-sm text-muted-foreground">{meeting.organizer}</p>
                    <p className="text-xs text-muted-foreground mt-1">{meeting.place}</p>
                    {meeting.status === 'cancelled' && meeting.cancelReason && (
                        <p className="text-xs mt-2" style={{ color: 'var(--ledger-red)' }}>Причина: {meeting.cancelReason}</p>
                    )}
                    {meeting.status === 'rescheduled' && meeting.originalDate && (
                        <p className="text-xs mt-2 text-muted-foreground">
                            Перенесено с {formatDate(meeting.originalDate)}, {meeting.originalTime}
                        </p>
                    )}
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => onEdit(meeting)} title="Изменить"
                        className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-white hover:border-transparent transition-colors flex items-center justify-center"
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ledger-navy)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {meeting.status !== 'cancelled' && (
                        <button onClick={() => onCancel(meeting)} title="Отменить"
                            className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-white hover:border-transparent transition-colors flex items-center justify-center"
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ledger-red)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {meeting.status !== 'cancelled' && (
                        <button onClick={() => onReschedule(meeting)} title="Перенести"
                            className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-white hover:border-transparent transition-colors flex items-center justify-center"
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--ledger-brass)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                            <CalendarClock className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button onClick={() => onDelete(meeting.id)} title="Удалить из журнала"
                        className="w-8 h-8 rounded-full border border-border text-muted-foreground hover:text-white hover:border-transparent transition-colors flex items-center justify-center"
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#7a2a22')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// КАЛЕНДАРЬ
// ============================================================================

function MonthCalendar({ meetings, viewDate, setViewDate, onSelectDay }: {
    meetings: Meeting[]
    viewDate: Date
    setViewDate: (d: Date) => void
    onSelectDay: (date: string) => void
}) {
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const firstDayOffset = firstDay === 0 ? 6 : firstDay - 1
    const todayStr = new Date().toISOString().split('T')[0]

    const formatKey = (day: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const meetingsFor = (dateStr: string) => meetings.filter(m => m.date === dateStr)

    const cells: (number | null)[] = []
    for (let i = 0; i < firstDayOffset; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    const changeMonth = (delta: number) => {
        const d = new Date(viewDate)
        d.setMonth(d.getMonth() + delta)
        setViewDate(d)
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ background: 'var(--ledger-paper)' }}>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                        <ChevronLeft className="w-5 h-5" style={{ color: 'var(--ledger-ink)' }} />
                    </button>
                    <h2 className="text-lg font-semibold w-44 text-center" style={{ color: 'var(--ledger-ink)', ...DISPLAY_FONT }}>
                        {MONTH_NAMES[month]} {year}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                        <ChevronRight className="w-5 h-5" style={{ color: 'var(--ledger-ink)' }} />
                    </button>
                </div>
                <button
                    onClick={() => setViewDate(new Date())}
                    className="px-3 py-1 text-sm rounded-lg border transition-colors"
                    style={{ color: 'var(--ledger-ink)', borderColor: 'var(--ledger-rule)' }}
                >
                    Сегодня
                </button>
            </div>

            <div className="grid grid-cols-7 border-b border-border">
                {daysOfWeek.map(d => (
                    <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                    if (day === null) {
                        return <div key={`e-${i}`} className="min-h-[104px] border-r border-b border-border/60" style={{ background: 'var(--ledger-paper)', opacity: 0.35 }} />
                    }
                    const dateStr = formatKey(day)
                    const dayMeetings = meetingsFor(dateStr)
                    const isToday = dateStr === todayStr
                    return (
                        <div
                            key={dateStr}
                            onClick={() => onSelectDay(dateStr)}
                            className="min-h-[104px] p-1.5 border-r border-b border-border/60 cursor-pointer transition-colors hover:bg-black/[0.03] group"
                        >
                            <div className="flex justify-between items-start">
                                <span
                                    className="inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums"
                                    style={isToday
                                        ? { background: 'var(--ledger-red)', color: 'white' }
                                        : { color: 'var(--foreground)' }}
                                >
                                    {day}
                                </span>
                                {dayMeetings.length > 0 && (
                                    <span className="text-[10px] font-semibold px-1.5 rounded-full text-white" style={{ background: 'var(--ledger-navy)' }}>
                                        {dayMeetings.length}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 space-y-1">
                                {dayMeetings.slice(0, 2).map(m => (
                                    <div
                                        key={m.id}
                                        className="text-[10px] px-1 py-0.5 rounded truncate"
                                        style={{
                                            background: m.status === 'cancelled' ? 'rgba(156,59,48,0.12)' : m.status === 'rescheduled' ? 'rgba(169,121,58,0.15)' : 'rgba(63,107,74,0.14)',
                                            color: m.status === 'cancelled' ? 'var(--ledger-red)' : m.status === 'rescheduled' ? 'var(--ledger-brass)' : 'var(--ledger-green)',
                                            textDecoration: m.status === 'cancelled' ? 'line-through' : 'none',
                                        }}
                                        title={m.topic}
                                    >
                                        <span style={MONO_FONT}>{m.timeStart}</span> {m.topic}
                                    </div>
                                ))}
                                {dayMeetings.length > 2 && (
                                    <div className="text-[9px] text-muted-foreground text-center">+{dayMeetings.length - 2} ещё</div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================================
// СТАТИСТИКА
// ============================================================================

function StatsModal({ isOpen, onClose, meetings }: { isOpen: boolean; onClose: () => void; meetings: Meeting[] }) {
    const [view, setView] = useState<'year' | 'quarters'>('year')
    const currentYear = new Date().getFullYear()

    const active = useMemo(() => meetings.filter(m => m.status !== 'cancelled'), [meetings])

    const monthsData = useMemo(() => {
        const data: Record<string, number> = {}
        MONTH_NAMES.forEach(m => (data[m] = 0))
        active.forEach(m => {
            const d = new Date(m.date + 'T00:00:00')
            if (d.getFullYear() === currentYear) data[MONTH_NAMES[d.getMonth()]]++
        })
        return data
    }, [active, currentYear])

    const yearQuarters = useMemo(() => {
        const map = new Map<number, { Q1: number; Q2: number; Q3: number; Q4: number; total: number }>()
        active.forEach(m => {
            const d = new Date(m.date + 'T00:00:00')
            const y = d.getFullYear()
            if (!map.has(y)) map.set(y, { Q1: 0, Q2: 0, Q3: 0, Q4: 0, total: 0 })
            const s = map.get(y)!
            const q = Math.ceil((d.getMonth() + 1) / 3)
            if (q === 1) s.Q1++; else if (q === 2) s.Q2++; else if (q === 3) s.Q3++; else s.Q4++
            s.total++
        })
        return Array.from(map.entries()).map(([year, s]) => ({ year, ...s })).sort((a, b) => b.year - a.year)
    }, [active])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
                <div className="px-5 py-3.5 flex justify-between items-center" style={{ background: 'var(--ledger-navy)' }}>
                    <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Статистика журнала совещаний
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 max-h-[75vh] overflow-y-auto">
                    <div className="flex gap-2 mb-5 border-b border-border pb-3">
                        <button
                            onClick={() => setView('year')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'year' ? 'text-white' : 'text-muted-foreground hover:bg-background'}`}
                            style={view === 'year' ? { background: 'var(--ledger-navy)' } : undefined}
                        >
                            <CalendarDays className="w-3.5 h-3.5" /> {currentYear} год по месяцам
                        </button>
                        <button
                            onClick={() => setView('quarters')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'quarters' ? 'text-white' : 'text-muted-foreground hover:bg-background'}`}
                            style={view === 'quarters' ? { background: 'var(--ledger-navy)' } : undefined}
                        >
                            <BarChart3 className="w-3.5 h-3.5" /> По годам и кварталам
                        </button>
                    </div>

                    {view === 'year' && (
                        <div>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-5">
                                {Object.entries(monthsData).map(([month, count]) => (
                                    <div key={month} className="rounded-lg p-3 text-center border border-border bg-background">
                                        <div className="text-lg font-bold" style={{ color: 'var(--ledger-navy)', ...MONO_FONT }}>{count}</div>
                                        <div className="text-xs text-muted-foreground">{month}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-3 border-t border-border text-center">
                                <span className="text-sm text-muted-foreground">Всего проведено за {currentYear} год: </span>
                                <span className="text-xl font-bold" style={{ color: 'var(--ledger-brass)' }}>{Object.values(monthsData).reduce((a, b) => a + b, 0)}</span>
                            </div>
                        </div>
                    )}

                    {view === 'quarters' && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm text-foreground">
                                <thead>
                                    <tr className="bg-background">
                                        <th className="border border-border px-3 py-2 text-left">Год</th>
                                        <th className="border border-border px-3 py-2 text-center">1 кв.</th>
                                        <th className="border border-border px-3 py-2 text-center">2 кв.</th>
                                        <th className="border border-border px-3 py-2 text-center">3 кв.</th>
                                        <th className="border border-border px-3 py-2 text-center">4 кв.</th>
                                        <th className="border border-border px-3 py-2 text-center">Всего</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {yearQuarters.map(item => (
                                        <tr key={item.year}>
                                            <td className="border border-border px-3 py-2 font-semibold">{item.year}</td>
                                            <td className="border border-border px-3 py-2 text-center">{item.Q1 || '—'}</td>
                                            <td className="border border-border px-3 py-2 text-center">{item.Q2 || '—'}</td>
                                            <td className="border border-border px-3 py-2 text-center">{item.Q3 || '—'}</td>
                                            <td className="border border-border px-3 py-2 text-center">{item.Q4 || '—'}</td>
                                            <td className="border border-border px-3 py-2 text-center font-semibold">{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 bg-background border-t border-border flex justify-end">
                    <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm text-foreground border border-border hover:bg-card transition-colors">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// ОСНОВНОЙ КОМПОНЕНТ
// ============================================================================

export default function MeetingCalendarPage() {
    useLedgerFonts()

    const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS)
    const [viewDate, setViewDate] = useState(new Date('2026-07-11T00:00:00'))
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formInitial, setFormInitial] = useState<MeetingFormData | null>(null)

    const [cancelTarget, setCancelTarget] = useState<Meeting | null>(null)
    const [cancelReason, setCancelReason] = useState('')
    const [rescheduleTarget, setRescheduleTarget] = useState<Meeting | null>(null)
    const [rescheduleData, setRescheduleData] = useState({ date: '', timeStart: '10:00', timeEnd: '11:00' })

    const [isStatsOpen, setIsStatsOpen] = useState(false)

    const stats = useMemo(() => {
        const total = meetings.length
        const notified = meetings.filter(m => m.notify).length
        const disrupted = meetings.filter(m => m.status !== 'scheduled').length
        return { total, notified, disrupted }
    }, [meetings])

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return []
        const term = searchTerm.toLowerCase()
        return meetings
            .filter(m => m.topic.toLowerCase().includes(term) || m.organizer.toLowerCase().includes(term))
            .sort((a, b) => a.date.localeCompare(b.date))
    }, [meetings, searchTerm])

    const dayMeetings = useMemo(() => {
        if (!selectedDate) return []
        return meetings.filter(m => m.date === selectedDate).sort((a, b) => a.timeStart.localeCompare(b.timeStart))
    }, [meetings, selectedDate])

    const directoryByCategory = (cat: DirectoryCategory) => DIRECTORY.filter(d => d.category === cat)

    const openCreate = (date?: string) => {
        setEditingId(null)
        setFormInitial({ ...EMPTY_FORM, date: date ?? selectedDate ?? new Date().toISOString().split('T')[0] })
        setIsModalOpen(true)
    }

    const openEdit = (m: Meeting) => {
        setEditingId(m.id)
        setFormInitial({
            topic: m.topic, organizer: m.organizer, date: m.date,
            timeStart: m.timeStart, timeEnd: m.timeEnd, place: m.place,
            notify: m.notify, departments: m.departments,
        })
        setIsModalOpen(true)
    }

    const handleSave = (data: MeetingFormData) => {
        if (editingId) {
            setMeetings(prev => prev.map(m => (m.id === editingId ? { ...m, ...data } : m)))
        } else {
            setMeetings(prev => [...prev, { id: makeMeetingId(), status: 'scheduled', ...data }])
        }
        setIsModalOpen(false)
        setEditingId(null)
    }

    const handleDelete = (id: number) => {
        if (confirm('Удалить запись из журнала совещаний?')) {
            setMeetings(prev => prev.filter(m => m.id !== id))
        }
    }

    const handleCancelClick = (m: Meeting) => {
        setCancelTarget(m)
        setCancelReason('')
    }

    const confirmCancel = () => {
        if (!cancelTarget) return
        setMeetings(prev => prev.map(m => (m.id === cancelTarget.id ? { ...m, status: 'cancelled' as MeetingStatus, cancelReason: cancelReason || undefined } : m)))
        setCancelTarget(null)
    }

    const handleRescheduleClick = (m: Meeting) => {
        setRescheduleTarget(m)
        setRescheduleData({ date: m.date, timeStart: m.timeStart, timeEnd: m.timeEnd })
    }

    const confirmReschedule = () => {
        if (!rescheduleTarget) return
        setMeetings(prev => prev.map(m => (m.id === rescheduleTarget.id ? {
            ...m,
            status: 'rescheduled' as MeetingStatus,
            originalDate: m.date,
            originalTime: m.timeStart,
            date: rescheduleData.date,
            timeStart: rescheduleData.timeStart,
            timeEnd: rescheduleData.timeEnd,
        } : m)))
        setRescheduleTarget(null)
    }

    const useDirectoryEntry = (name: string, date?: string) => {
        setEditingId(null)
        setFormInitial({ ...EMPTY_FORM, place: name, date: date ?? selectedDate ?? new Date().toISOString().split('T')[0] })
        setIsModalOpen(true)
    }

    return (
        <div className="min-h-screen pt-16 bg-background" style={ACCENT}>
            <LedgerHero
                eyebrow={ORG_NAME}
                title="Календарь совещаний"
                subtitle="Журнал регистрации совещаний, встреч и приёмов при главе округа: расписание, рассылка уведомлений подразделениям, отмены и переносы."
            >
                <LedgerStrip>
                    <LedgerStat label="Записей в журнале" value={stats.total} />
                    <LedgerStat label="С рассылкой" value={stats.notified} />
                    <LedgerStat label="Отменено / перенесено" value={stats.disrupted} />
                </LedgerStrip>
            </LedgerHero>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 w-full lg:max-w-sm">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Поиск по теме или председателю..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-9 py-2 border border-border rounded-xl text-sm bg-card text-foreground focus:ring-2 focus:ring-[var(--ledger-brass)] focus:border-transparent"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsStatsOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm shadow-sm transition-opacity hover:opacity-90"
                            style={{ background: 'var(--ledger-navy)' }}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Статистика</span>
                        </button>
                        <button
                            onClick={() => openCreate()}
                            className="flex items-center gap-1.5 px-3 py-2 text-white rounded-lg text-sm shadow-sm transition-opacity hover:opacity-90"
                            style={{ background: 'var(--ledger-brass)' }}
                        >
                            <Plus className="w-4 h-4" />
                            <span>Новая запись</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                    <div className="lg:w-72 flex-shrink-0 space-y-4">
                        {(['room', 'office', 'agency'] as DirectoryCategory[]).map(cat => (
                            <div key={cat} className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="px-3 py-2 border-b border-border" style={{ background: 'var(--ledger-paper)' }}>
                                    <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ledger-ink)' }}>
                                        {DIRECTORY_LABELS[cat]}
                                    </h3>
                                </div>
                                <div className="p-2 space-y-1.5">
                                    {directoryByCategory(cat).map(entry => (
                                        <DirectoryCard
                                            key={entry.id}
                                            name={entry.name}
                                            detail={entry.detail}
                                            phone={entry.phone}
                                            onUse={() => useDirectoryEntry(entry.name)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0">
                        {searchTerm.trim() ? (
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="px-5 py-3" style={{ background: 'var(--ledger-navy)' }}>
                                    <h3 className="text-white font-semibold text-sm">Результаты поиска: «{searchTerm}»</h3>
                                    <p className="text-white/60 text-xs">Найдено записей: {searchResults.length}</p>
                                </div>
                                <div className="p-4 space-y-3 max-h-[640px] overflow-y-auto">
                                    {searchResults.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-12">Ничего не найдено в журнале</p>
                                    ) : (
                                        searchResults.map(m => (
                                            <MeetingCard
                                                key={m.id} meeting={m} showDate
                                                onEdit={openEdit} onCancel={handleCancelClick}
                                                onReschedule={handleRescheduleClick} onDelete={handleDelete}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : selectedDate ? (
                            <div className="rounded-xl border border-border bg-card overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-3.5" style={{ background: 'var(--ledger-navy)' }}>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setSelectedDate(null)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <h3 className="text-white font-semibold" style={DISPLAY_FONT}>{formatDate(selectedDate)}</h3>
                                            <p className="text-white/50 text-xs capitalize">{formatWeekday(selectedDate)}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openCreate(selectedDate)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                                        style={{ background: 'var(--ledger-brass)' }}
                                    >
                                        <Plus className="w-4 h-4" /> Добавить
                                    </button>
                                </div>
                                <div className="p-4">
                                    {dayMeetings.length === 0 ? (
                                        <div className="text-center py-12">
                                            <p className="text-muted-foreground">На эту дату записей нет</p>
                                            <button onClick={() => openCreate(selectedDate)} className="mt-4 px-4 py-2 text-white rounded-lg" style={{ background: 'var(--ledger-navy)' }}>
                                                Внести запись
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {dayMeetings.map(m => (
                                                <MeetingCard
                                                    key={m.id} meeting={m}
                                                    onEdit={openEdit} onCancel={handleCancelClick}
                                                    onReschedule={handleRescheduleClick} onDelete={handleDelete}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <MonthCalendar
                                meetings={meetings}
                                viewDate={viewDate}
                                setViewDate={setViewDate}
                                onSelectDay={setSelectedDate}
                            />
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground pt-8 pb-2">
                    * Организация, сотрудники и совещания вымышлены — интерактивный пример вёрстки для портфолио.
                    Изменения хранятся только в этой вкладке и сбрасываются при обновлении страницы.
                </p>
            </div>

            <MeetingModal isOpen={isModalOpen} initial={formInitial} isEditing={editingId !== null} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
            <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} meetings={meetings} />

            {cancelTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold" style={{ color: 'var(--ledger-red)', ...DISPLAY_FONT }}>Отмена совещания</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
                                <strong className="text-foreground">{cancelTarget.topic}</strong><br />
                                {formatDate(cancelTarget.date)}, {cancelTarget.timeStart}
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Причина отмены (необязательно)</label>
                                <input
                                    type="text" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Например: перенос сроков подрядчиком"
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setCancelTarget(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-background">
                                    Назад
                                </button>
                                <button onClick={confirmCancel} className="flex-1 px-4 py-2 text-white rounded-lg" style={{ background: 'var(--ledger-red)' }}>
                                    Подтвердить отмену
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rescheduleTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-semibold" style={{ color: 'var(--ledger-brass)', ...DISPLAY_FONT }}>Перенос совещания</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
                                <strong className="text-foreground">{rescheduleTarget.topic}</strong>
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Новая дата</label>
                                <input
                                    type="date" value={rescheduleData.date}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Начало</label>
                                    <input
                                        type="time" value={rescheduleData.timeStart}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, timeStart: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">Окончание</label>
                                    <input
                                        type="time" value={rescheduleData.timeEnd}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, timeEnd: e.target.value })}
                                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setRescheduleTarget(null)} className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-background">
                                    Назад
                                </button>
                                <button onClick={confirmReschedule} className="flex-1 px-4 py-2 text-white rounded-lg" style={{ background: 'var(--ledger-brass)' }}>
                                    Подтвердить перенос
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
