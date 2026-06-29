import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft, Search, Plus, Pencil, Trash2,
    Phone, Mail, X, Users, Building2, LayoutGrid, List, ChevronDown,
    Star, Plane, Briefcase,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Employee {
    id: number
    name: string
    position: string
    department: string
    phone: string
    email: string
    extension?: string
    favorite?: boolean
    absence?: { from: string; to: string }
}

interface Vacancy {
    id: number
    position: string
    department: string
    description?: string
}

interface Department {
    id: string
    name: string
    gradient: string
    text: string
    avatarGradient: string
    badge: string
}

type ViewMode = 'cards' | 'table'
type ActiveFilter = string

// ── Departments ────────────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = [
    {
        id: 'management',
        name: 'Руководство',
        gradient: 'from-sky-600 to-sky-700',
        text: 'text-sky-300',
        avatarGradient: 'from-sky-500 to-sky-700',
        badge: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
    },
    {
        id: 'dev',
        name: 'Отдел разработки',
        gradient: 'from-violet-600 to-violet-700',
        text: 'text-violet-300',
        avatarGradient: 'from-violet-500 to-violet-700',
        badge: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
    },
    {
        id: 'design',
        name: 'Отдел дизайна',
        gradient: 'from-emerald-600 to-emerald-700',
        text: 'text-emerald-300',
        avatarGradient: 'from-emerald-500 to-emerald-700',
        badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    },
    {
        id: 'support',
        name: 'Служба поддержки',
        gradient: 'from-amber-600 to-amber-700',
        text: 'text-amber-300',
        avatarGradient: 'from-amber-500 to-amber-700',
        badge: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    },
]

const ALL_DEPT: Department = {
    id: 'all',
    name: 'Все сотрудники',
    gradient: 'from-slate-600 to-slate-700',
    text: 'text-slate-300',
    avatarGradient: 'from-slate-500 to-slate-700',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
}

const FAVORITES_DEPT: Department = {
    id: 'favorites',
    name: 'Избранное',
    gradient: 'from-yellow-500 to-amber-600',
    text: 'text-yellow-300',
    avatarGradient: 'from-yellow-500 to-amber-600',
    badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
}

const ABSENT_DEPT: Department = {
    id: 'absent',
    name: 'Отсутствующие',
    gradient: 'from-rose-600 to-rose-700',
    text: 'text-rose-300',
    avatarGradient: 'from-rose-500 to-rose-700',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
}

const VACANCIES_DEPT: Department = {
    id: 'vacancies',
    name: 'Вакансии',
    gradient: 'from-teal-600 to-teal-700',
    text: 'text-teal-300',
    avatarGradient: 'from-teal-500 to-teal-700',
    badge: 'bg-teal-500/15 text-teal-300 border-teal-500/20',
}

function filterToDept(f: ActiveFilter): Department {
    if (f === 'favorites') return FAVORITES_DEPT
    if (f === 'absent')    return ABSENT_DEPT
    if (f === 'vacancies') return VACANCIES_DEPT
    if (f === 'all')       return ALL_DEPT
    return DEPARTMENTS.find(d => d.id === f) ?? ALL_DEPT
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const INITIAL_EMPLOYEES: Employee[] = [
    // Руководство
    { id: 1,  department: 'management', name: 'Иванов Дмитрий Сергеевич',   position: 'Генеральный директор',     phone: '+7 (495) 100-01-01', email: 'd.ivanov@digit-solutions.ru',     extension: '101', favorite: true },
    { id: 2,  department: 'management', name: 'Смирнова Елена Викторовна',   position: 'Финансовый директор',      phone: '+7 (495) 100-01-02', email: 'e.smirnova@digit-solutions.ru',   extension: '102' },
    { id: 3,  department: 'management', name: 'Козлов Антон Петрович',       position: 'Технический директор',     phone: '+7 (495) 100-01-03', email: 'a.kozlov@digit-solutions.ru',     extension: '103' },
    // Отдел разработки
    { id: 4,  department: 'dev',        name: 'Новиков Алексей Иванович',    position: 'Руководитель отдела',      phone: '+7 (495) 100-02-01', email: 'a.novikov@digit-solutions.ru',    extension: '201', favorite: true },
    { id: 5,  department: 'dev',        name: 'Морозова Анна Дмитриевна',    position: 'Senior Backend Developer', phone: '+7 (495) 100-02-02', email: 'a.morozova@digit-solutions.ru',   extension: '202', favorite: true },
    { id: 6,  department: 'dev',        name: 'Волков Игорь Андреевич',      position: 'Senior Frontend Developer',phone: '+7 (495) 100-02-03', email: 'i.volkov@digit-solutions.ru',    extension: '203', absence: { from: '2026-06-25', to: '2026-07-09' } },
    { id: 7,  department: 'dev',        name: 'Соколова Мария Геннадьевна',  position: 'Middle Developer',         phone: '+7 (495) 100-02-04', email: 'm.sokolova@digit-solutions.ru',   extension: '204' },
    { id: 8,  department: 'dev',        name: 'Лебедев Роман Павлович',      position: 'Junior Developer',         phone: '+7 (495) 100-02-05', email: 'r.lebedev@digit-solutions.ru',    extension: '205', absence: { from: '2026-07-01', to: '2026-07-15' } },
    // Отдел дизайна
    { id: 9,  department: 'design',     name: 'Попова Ирина Юрьевна',        position: 'Руководитель отдела',      phone: '+7 (495) 100-03-01', email: 'i.popova@digit-solutions.ru',     extension: '301', favorite: true },
    { id: 10, department: 'design',     name: 'Зайцев Кирилл Михайлович',    position: 'UX/UI Designer',           phone: '+7 (495) 100-03-02', email: 'k.zaytsev@digit-solutions.ru',    extension: '302' },
    { id: 11, department: 'design',     name: 'Белова Наталья Сергеевна',    position: 'Graphic Designer',         phone: '+7 (495) 100-03-03', email: 'n.belova@digit-solutions.ru',     extension: '303' },
    // Служба поддержки
    { id: 12, department: 'support',    name: 'Егоров Максим Владимирович',  position: 'Руководитель службы',      phone: '+7 (495) 100-04-01', email: 'm.egorov@digit-solutions.ru',     extension: '401' },
    { id: 13, department: 'support',    name: 'Фёдорова Ольга Николаевна',   position: 'Специалист поддержки',     phone: '+7 (495) 100-04-02', email: 'o.fedorova@digit-solutions.ru',   extension: '402' },
    { id: 14, department: 'support',    name: 'Никитин Сергей Алексеевич',   position: 'Системный администратор',  phone: '+7 (495) 100-04-03', email: 's.nikitin@digit-solutions.ru',    extension: '403' },
    { id: 15, department: 'support',    name: 'Захарова Юлия Игоревна',      position: 'Специалист поддержки',     phone: '+7 (495) 100-04-04', email: 'yu.zakharova@digit-solutions.ru', extension: '404', absence: { from: '2026-06-28', to: '2026-07-12' } },
]

const INITIAL_VACANCIES: Vacancy[] = [
    { id: 1, position: 'Senior Frontend Developer', department: 'dev',        description: 'React, TypeScript, опыт от 4 лет. Работа над новым продуктом.' },
    { id: 2, position: 'DevOps Engineer',           department: 'dev',        description: 'Docker, Kubernetes, CI/CD. Удалённый формат.' },
    { id: 3, position: 'Project Manager',           department: 'management', description: 'Agile/Scrum, опыт управления командой от 3 лет.' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

function getDept(id: string): Department {
    return DEPARTMENTS.find(d => d.id === id) ?? DEPARTMENTS[0]
}

function pluralEmployees(n: number) {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} сотрудник`
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return `${n} сотрудника`
    return `${n} сотрудников`
}

function formatAbsenceDate(iso: string) {
    const parts = iso.split('-')
    return `${parts[2]}.${parts[1]}`
}

// ── Employee Form ─────────────────────────────────────────────────────────────

function EmployeeForm({ values, onChange }: { values: Record<string, string>; onChange: (k: string, v: string) => void }) {
    const inputCls = 'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition-colors'

    return (
        <div className="space-y-3">
            {([
                { key: 'name',      label: 'ФИО',       placeholder: 'Иванов Иван Иванович' },
                { key: 'position',  label: 'Должность',  placeholder: 'Разработчик' },
                { key: 'phone',     label: 'Телефон',    placeholder: '+7 (495) 000-00-00' },
                { key: 'extension', label: 'Внутренний', placeholder: '101' },
                { key: 'email',     label: 'Email',      placeholder: 'ivanov@digit-solutions.ru' },
            ] as const).map(f => (
                <div key={f.key}>
                    <label className="block text-xs text-white/50 mb-1">{f.label}</label>
                    <input type="text" value={values[f.key] ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder} className={inputCls} />
                </div>
            ))}
            <div>
                <label className="block text-xs text-white/50 mb-1">Отдел</label>
                <select value={values.department ?? ''} onChange={e => onChange('department', e.target.value)}
                    className={inputCls + ' appearance-none cursor-pointer'}>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="pt-1 border-t border-white/8">
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold mb-2 flex items-center gap-1.5">
                    <Plane size={10} /> Отпуск
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-white/50 mb-1">С</label>
                        <input type="date" value={values.absenceFrom ?? ''} onChange={e => onChange('absenceFrom', e.target.value)}
                            className={inputCls + ' [color-scheme:dark]'} />
                    </div>
                    <div>
                        <label className="block text-xs text-white/50 mb-1">По</label>
                        <input type="date" value={values.absenceTo ?? ''} onChange={e => onChange('absenceTo', e.target.value)}
                            className={inputCls + ' [color-scheme:dark]'} />
                    </div>
                </div>
                {values.absenceFrom && values.absenceTo && (
                    <button type="button" onClick={() => { onChange('absenceFrom', ''); onChange('absenceTo', '') }}
                        className="mt-1.5 text-[11px] text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1">
                        <X size={10} /> Убрать отпуск
                    </button>
                )}
            </div>
        </div>
    )
}

// ── Vacancy Form ───────────────────────────────────────────────────────────────

function VacancyForm({ values, onChange }: { values: Record<string, string>; onChange: (k: string, v: string) => void }) {
    const inputCls = 'w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-teal-500/50 transition-colors'

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs text-white/50 mb-1">Должность</label>
                <input type="text" value={values.position ?? ''} onChange={e => onChange('position', e.target.value)}
                    placeholder="Senior Developer" className={inputCls} />
            </div>
            <div>
                <label className="block text-xs text-white/50 mb-1">Отдел</label>
                <select value={values.department ?? ''} onChange={e => onChange('department', e.target.value)}
                    className={inputCls + ' appearance-none cursor-pointer'}>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-xs text-white/50 mb-1">Описание</label>
                <textarea value={values.description ?? ''} onChange={e => onChange('description', e.target.value)}
                    placeholder="Требования и условия..." rows={3}
                    className={inputCls + ' resize-none'} />
            </div>
        </div>
    )
}

// ── Modal wrapper ──────────────────────────────────────────────────────────────

function Dialog({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null
    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[300] flex items-center justify-center p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <motion.div
                    className="relative z-10 w-full max-w-md bg-[#0d1a30] border border-white/10 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
                    initial={{ scale: 0.92, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-base text-white">{title}</h3>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    {children}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// ── Employee Card ──────────────────────────────────────────────────────────────

function EmployeeCard({
    emp, onEdit, onDelete, onToggleFavorite,
}: {
    emp: Employee
    onEdit: () => void
    onDelete: () => void
    onToggleFavorite: () => void
}) {
    const dept = getDept(emp.department)
    const isAbsent = !!emp.absence

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative group card-block rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 ${isAbsent ? 'opacity-70' : ''}`}
        >
            {/* Absence ribbon */}
            {isAbsent && (
                <div className="absolute top-0 left-0 right-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 border-b border-rose-500/20 rounded-t-2xl">
                    <Plane size={10} className="text-rose-400 flex-shrink-0" />
                    <span className="text-[10px] text-rose-300 font-medium">
                        Отпуск {formatAbsenceDate(emp.absence!.from)} — {formatAbsenceDate(emp.absence!.to)}
                    </span>
                </div>
            )}

            {/* Avatar + name */}
            <div className={`flex items-start gap-3 mb-4 ${isAbsent ? 'mt-6' : ''}`}>
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${dept.avatarGradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}>
                    {initials(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight line-clamp-2 pr-12">{emp.name}</p>
                    <p className={`text-xs mt-0.5 ${dept.text}`}>{emp.position}</p>
                </div>
            </div>

            {/* Contacts */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Phone size={11} className="text-white/30 flex-shrink-0" />
                    <a href={`tel:${emp.phone}`} className="text-xs text-white/60 hover:text-white transition-colors truncate">
                        {emp.phone}
                    </a>
                    {emp.extension && (
                        <span className="ml-auto text-[10px] text-white/30 flex-shrink-0">доб. {emp.extension}</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Mail size={11} className="text-white/30 flex-shrink-0" />
                    <a href={`mailto:${emp.email}`} className="text-xs text-white/60 hover:text-white transition-colors truncate">
                        {emp.email}
                    </a>
                </div>
            </div>

            {/* Department badge + favorite */}
            <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${dept.badge}`}>
                    {DEPARTMENTS.find(d => d.id === emp.department)?.name}
                </span>
                <button
                    onClick={onToggleFavorite}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        emp.favorite
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                            : 'bg-white/5 hover:bg-white/10 text-white/25 hover:text-white/60'
                    }`}
                    title={emp.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                    <Star size={10} className={emp.favorite ? 'fill-amber-400' : ''} />
                </button>
            </div>

            {/* Controls */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-sky-500/80 hover:bg-sky-500 flex items-center justify-center text-white transition-colors">
                    <Pencil size={10} />
                </button>
                <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                    <Trash2 size={10} />
                </button>
            </div>
        </motion.div>
    )
}

// ── Table row ──────────────────────────────────────────────────────────────────

function TableRow({
    emp, onEdit, onDelete, onToggleFavorite,
}: {
    emp: Employee
    onEdit: () => void
    onDelete: () => void
    onToggleFavorite: () => void
}) {
    const dept = getDept(emp.department)
    const isAbsent = !!emp.absence

    return (
        <tr className={`group border-b border-white/5 hover:bg-white/3 transition-colors ${isAbsent ? 'opacity-65' : ''}`}>
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${dept.avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials(emp.name)}
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-white leading-tight">{emp.name}</p>
                            {emp.favorite && <Star size={9} className="text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <p className={`text-xs ${dept.text}`}>{emp.position}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${dept.badge}`}>
                    {DEPARTMENTS.find(d => d.id === emp.department)?.name}
                </span>
            </td>
            <td className="px-4 py-3">
                {isAbsent ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                        <Plane size={10} />
                        до {formatAbsenceDate(emp.absence!.to)}
                    </span>
                ) : (
                    <>
                        <a href={`tel:${emp.phone}`} className="text-xs text-white/60 hover:text-white transition-colors">
                            {emp.phone}
                        </a>
                        {emp.extension && <span className="text-xs text-white/30 ml-2">доб. {emp.extension}</span>}
                    </>
                )}
            </td>
            <td className="px-4 py-3">
                <a href={`mailto:${emp.email}`} className="text-xs text-white/60 hover:text-white transition-colors">
                    {emp.email}
                </a>
            </td>
            <td className="px-4 py-3">
                <div className="flex gap-1">
                    <button onClick={onToggleFavorite}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                            emp.favorite
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-white/10 text-white/40'
                        }`}>
                        <Star size={10} className={emp.favorite ? 'fill-amber-400' : ''} />
                    </button>
                    <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-sky-500/80 hover:bg-sky-500 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100">
                        <Pencil size={10} />
                    </button>
                    <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={10} />
                    </button>
                </div>
            </td>
        </tr>
    )
}

// ── Vacancy Card ───────────────────────────────────────────────────────────────

function VacancyCard({
    vacancy, onEdit, onDelete,
}: {
    vacancy: Vacancy
    onEdit: () => void
    onDelete: () => void
}) {
    const dept = getDept(vacancy.department)

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group card-block rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200"
        >
            <div className="flex items-start gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dept.avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Briefcase size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight pr-10">{vacancy.position}</p>
                    <span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${dept.badge}`}>
                        {DEPARTMENTS.find(d => d.id === vacancy.department)?.name}
                    </span>
                </div>
            </div>
            {vacancy.description && (
                <p className="text-xs text-white/45 leading-relaxed line-clamp-2">{vacancy.description}</p>
            )}
            <div className="mt-3 pt-3 border-t border-white/8">
                <span className="text-[10px] text-teal-400 font-medium uppercase tracking-wide">Открытая вакансия</span>
            </div>

            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="w-6 h-6 rounded-lg bg-sky-500/80 hover:bg-sky-500 flex items-center justify-center text-white transition-colors">
                    <Pencil size={10} />
                </button>
                <button onClick={onDelete} className="w-6 h-6 rounded-lg bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors">
                    <Trash2 size={10} />
                </button>
            </div>
        </motion.div>
    )
}

// ── Sidebar button ─────────────────────────────────────────────────────────────

function SidebarBtn({
    dept, count, active, onClick,
}: {
    dept: Department
    count: number
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                    ? `bg-gradient-to-r ${dept.gradient} text-white shadow-lg`
                    : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
            <span className="truncate">{dept.name}</span>
            <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums flex-shrink-0 ${
                active ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
            }`}>
                {count}
            </span>
        </button>
    )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PhoneBook() {
    const [employees, setEmployees]   = useState<Employee[]>(INITIAL_EMPLOYEES)
    const [vacancies, setVacancies]   = useState<Vacancy[]>(INITIAL_VACANCIES)
    const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all')
    const [search, setSearch]         = useState('')
    const [viewMode, setViewMode]     = useState<ViewMode>('cards')
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const [addModal, setAddModal]         = useState(false)
    const [editModal, setEditModal]       = useState(false)
    const [deleteModal, setDeleteModal]   = useState(false)
    const [target, setTarget]             = useState<Employee | null>(null)
    const [form, setForm]                 = useState<Record<string, string>>({})

    const [addVacancyModal, setAddVacancyModal]     = useState(false)
    const [editVacancyModal, setEditVacancyModal]   = useState(false)
    const [deleteVacancyModal, setDeleteVacancyModal] = useState(false)
    const [vacancyTarget, setVacancyTarget]         = useState<Vacancy | null>(null)
    const [vacancyForm, setVacancyForm]             = useState<Record<string, string>>({})

    const nextId = useMemo(() => Math.max(0, ...employees.map(e => e.id)) + 1, [employees])
    const nextVacancyId = useMemo(() => Math.max(0, ...vacancies.map(v => v.id)) + 1, [vacancies])

    const isVacancyView = activeFilter === 'vacancies'

    const filtered = useMemo(() => {
        let list = employees
        if (activeFilter === 'favorites') list = list.filter(e => e.favorite)
        else if (activeFilter === 'absent') list = list.filter(e => !!e.absence)
        else if (activeFilter !== 'all' && activeFilter !== 'vacancies') list = list.filter(e => e.department === activeFilter)
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(e =>
                e.name.toLowerCase().includes(q) ||
                e.position.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                e.phone.includes(q)
            )
        }
        return list
    }, [employees, activeFilter, search])

    const filteredVacancies = useMemo(() => {
        if (!search.trim()) return vacancies
        const q = search.toLowerCase()
        return vacancies.filter(v =>
            v.position.toLowerCase().includes(q) ||
            (v.description ?? '').toLowerCase().includes(q)
        )
    }, [vacancies, search])

    const counts = useMemo(() => {
        const c: Record<string, number> = {
            all:       employees.length,
            favorites: employees.filter(e => e.favorite).length,
            absent:    employees.filter(e => !!e.absence).length,
            vacancies: vacancies.length,
        }
        DEPARTMENTS.forEach(d => { c[d.id] = employees.filter(e => e.department === d.id).length })
        return c
    }, [employees, vacancies])

    const activeFilterData = filterToDept(activeFilter)

    // ── Employee actions ──

    const openAdd = () => {
        const dept = activeFilter === 'all' || activeFilter === 'favorites' || activeFilter === 'absent' || activeFilter === 'vacancies'
            ? 'management'
            : activeFilter
        setForm({ name: '', position: '', phone: '', extension: '', email: '', department: dept, absenceFrom: '', absenceTo: '' })
        setAddModal(true)
    }

    const openEdit = (emp: Employee) => {
        setTarget(emp)
        setForm({
            name: emp.name, position: emp.position, phone: emp.phone,
            extension: emp.extension ?? '', email: emp.email, department: emp.department,
            absenceFrom: emp.absence?.from ?? '', absenceTo: emp.absence?.to ?? '',
        })
        setEditModal(true)
    }

    const openDelete = (emp: Employee) => { setTarget(emp); setDeleteModal(true) }

    const buildEmployee = (id: number, f: Record<string, string>): Employee => {
        const { absenceFrom, absenceTo, ...rest } = f
        const absence = absenceFrom && absenceTo ? { from: absenceFrom, to: absenceTo } : undefined
        return { id, ...rest, absence } as Employee
    }

    const handleAdd = () => {
        if (!form.name?.trim()) return
        setEmployees(prev => [...prev, buildEmployee(nextId, form)])
        setAddModal(false)
    }

    const handleEdit = () => {
        if (!target || !form.name?.trim()) return
        setEmployees(prev => prev.map(e => e.id === target.id ? { ...buildEmployee(e.id, form), favorite: e.favorite } : e))
        setEditModal(false)
    }

    const handleDelete = () => {
        if (!target) return
        setEmployees(prev => prev.filter(e => e.id !== target.id))
        setDeleteModal(false)
        setTarget(null)
    }

    const toggleFavorite = (id: number) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e))
    }

    // ── Vacancy actions ──

    const openAddVacancy = () => {
        setVacancyForm({ position: '', department: 'management', description: '' })
        setAddVacancyModal(true)
    }

    const openEditVacancy = (v: Vacancy) => {
        setVacancyTarget(v)
        setVacancyForm({ position: v.position, department: v.department, description: v.description ?? '' })
        setEditVacancyModal(true)
    }

    const openDeleteVacancy = (v: Vacancy) => { setVacancyTarget(v); setDeleteVacancyModal(true) }

    const handleAddVacancy = () => {
        if (!vacancyForm.position?.trim()) return
        setVacancies(prev => [...prev, { id: nextVacancyId, ...vacancyForm } as Vacancy])
        setAddVacancyModal(false)
    }

    const handleEditVacancy = () => {
        if (!vacancyTarget || !vacancyForm.position?.trim()) return
        setVacancies(prev => prev.map(v => v.id === vacancyTarget.id ? { ...v, ...vacancyForm } as Vacancy : v))
        setEditVacancyModal(false)
    }

    const handleDeleteVacancy = () => {
        if (!vacancyTarget) return
        setVacancies(prev => prev.filter(v => v.id !== vacancyTarget.id))
        setDeleteVacancyModal(false)
        setVacancyTarget(null)
    }

    // ── All filter items for mobile dropdown ──

    const allFilters = [ALL_DEPT, FAVORITES_DEPT, ABSENT_DEPT, ...DEPARTMENTS, VACANCIES_DEPT]

    return (
        <div className="min-h-screen pt-16 bg-[var(--background,#050d1f)]">

            {/* ── Top bar ── */}
            <div className="sticky top-16 z-50 border-b border-white/8 bg-[#060e22]/95 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">

                    <Link to="/examples" className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex-shrink-0">
                        <ArrowLeft size={15} />
                    </Link>

                    <div className="hidden sm:flex items-center gap-2.5 flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
                            <Users size={15} className="text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white leading-tight">Телефонный справочник</p>
                            <p className="text-[10px] text-white/40">ООО «Цифровые решения»</p>
                        </div>
                    </div>

                    <div className="hidden sm:block w-px h-5 bg-white/10 mx-1" />

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            placeholder={isVacancyView ? 'Поиск по вакансиям...' : 'Поиск по имени, должности, телефону...'}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-8 pr-8 py-1.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-sky-500/40 transition-colors"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-white/30 hover:text-white transition-colors">
                                <X size={11} />
                            </button>
                        )}
                    </div>

                    {/* View toggle — hidden in vacancy view */}
                    {!isVacancyView && (
                        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5">
                            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'cards' ? 'bg-sky-500/30 text-sky-300' : 'text-white/40 hover:text-white'}`}>
                                <LayoutGrid size={14} />
                            </button>
                            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-sky-500/30 text-sky-300' : 'text-white/40 hover:text-white'}`}>
                                <List size={14} />
                            </button>
                        </div>
                    )}

                    {/* Add */}
                    <button
                        onClick={isVacancyView ? openAddVacancy : openAdd}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors flex-shrink-0 ${
                            isVacancyView
                                ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border-teal-500/30'
                                : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border-sky-500/30'
                        }`}
                    >
                        <Plus size={13} />
                        <span className="hidden sm:inline">{isVacancyView ? 'Вакансия' : 'Добавить'}</span>
                    </button>
                </div>
            </div>

            {/* ── Layout ── */}
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

                {/* Sidebar — desktop */}
                <aside className="hidden lg:block w-52 flex-shrink-0">
                    <div className="sticky top-32 space-y-0.5">

                        {/* Special filters */}
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-3 mb-2 mt-1">
                            Фильтры
                        </p>
                        <SidebarBtn dept={ALL_DEPT}       count={counts.all}       active={activeFilter === 'all'}       onClick={() => setActiveFilter('all')} />
                        <SidebarBtn dept={FAVORITES_DEPT} count={counts.favorites} active={activeFilter === 'favorites'} onClick={() => setActiveFilter('favorites')} />
                        <SidebarBtn dept={ABSENT_DEPT}    count={counts.absent}    active={activeFilter === 'absent'}    onClick={() => setActiveFilter('absent')} />

                        {/* Departments */}
                        <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold px-3 pt-4 pb-2 flex items-center gap-1.5">
                            <Building2 size={10} /> Отделы
                        </p>
                        {DEPARTMENTS.map(dept => (
                            <SidebarBtn key={dept.id} dept={dept} count={counts[dept.id] ?? 0} active={activeFilter === dept.id} onClick={() => setActiveFilter(dept.id)} />
                        ))}

                        {/* Vacancies */}
                        <div className="pt-3 mt-3 border-t border-white/8">
                            <SidebarBtn dept={VACANCIES_DEPT} count={counts.vacancies} active={activeFilter === 'vacancies'} onClick={() => setActiveFilter('vacancies')} />
                        </div>
                    </div>
                </aside>

                {/* ── Content ── */}
                <div className="flex-1 min-w-0">

                    {/* Mobile filter selector */}
                    <div className="lg:hidden mb-4">
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gradient-to-r ${activeFilterData.gradient} text-white text-sm font-medium`}
                        >
                            <span>{activeFilterData.name}</span>
                            <ChevronDown size={14} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mt-1 bg-white/5 border border-white/10 rounded-xl p-1"
                                >
                                    {allFilters.map(dept => (
                                        <button
                                            key={dept.id}
                                            onClick={() => { setActiveFilter(dept.id); setSidebarOpen(false) }}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors"
                                        >
                                            <span className="text-white/70">{dept.name}</span>
                                            <span className="text-xs text-white/30">{counts[dept.id] ?? 0}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Status bar */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="font-semibold text-base text-white">{activeFilterData.name}</h2>
                            <p className="text-xs text-white/40 mt-0.5">
                                {isVacancyView
                                    ? (search ? `Найдено: ${filteredVacancies.length} вакансий` : `${vacancies.length} открытых вакансий`)
                                    : (search ? `Найдено: ${pluralEmployees(filtered.length)}` : pluralEmployees(filtered.length))
                                }
                            </p>
                        </div>
                        {search && (
                            <button onClick={() => setSearch('')} className="text-xs text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1">
                                <X size={11} /> Сбросить
                            </button>
                        )}
                    </div>

                    {/* ── Vacancy view ── */}
                    {isVacancyView ? (
                        filteredVacancies.length === 0 ? (
                            <div className="text-center py-24">
                                <Briefcase size={36} className="mx-auto mb-3 text-white/15" />
                                <p className="text-white/30 text-sm">{search ? 'Ничего не найдено' : 'Нет открытых вакансий'}</p>
                                {!search && (
                                    <button onClick={openAddVacancy} className="mt-4 text-xs text-teal-400 hover:text-teal-300 transition-colors">
                                        + Добавить первую вакансию
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {filteredVacancies.map(v => (
                                        <VacancyCard key={v.id} vacancy={v} onEdit={() => openEditVacancy(v)} onDelete={() => openDeleteVacancy(v)} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )
                    ) : filtered.length === 0 ? (

                        /* Empty state */
                        <div className="text-center py-24">
                            <Users size={36} className="mx-auto mb-3 text-white/15" />
                            <p className="text-white/30 text-sm">
                                {search
                                    ? 'Ничего не найдено'
                                    : activeFilter === 'favorites'
                                    ? 'Нет избранных сотрудников'
                                    : activeFilter === 'absent'
                                    ? 'Нет отсутствующих сотрудников'
                                    : 'Нет сотрудников в этом отделе'
                                }
                            </p>
                            {!search && activeFilter === 'all' && (
                                <button onClick={openAdd} className="mt-4 text-xs text-sky-400 hover:text-sky-300 transition-colors">
                                    + Добавить первого сотрудника
                                </button>
                            )}
                        </div>

                    ) : viewMode === 'cards' ? (

                        /* Cards grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {filtered.map(emp => (
                                    <EmployeeCard key={emp.id} emp={emp}
                                        onEdit={() => openEdit(emp)}
                                        onDelete={() => openDelete(emp)}
                                        onToggleFavorite={() => toggleFavorite(emp.id)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                    ) : (

                        /* Table */
                        <div className="rounded-2xl overflow-hidden border border-white/8">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/8 bg-white/3">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Сотрудник</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Отдел</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Телефон</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Email</th>
                                        <th className="px-4 py-3 w-24" />
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filtered.map(emp => (
                                            <TableRow key={emp.id} emp={emp}
                                                onEdit={() => openEdit(emp)}
                                                onDelete={() => openDelete(emp)}
                                                onToggleFavorite={() => toggleFavorite(emp.id)}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Employee Modals ── */}
            <Dialog open={addModal} title="Добавить сотрудника" onClose={() => setAddModal(false)}>
                <EmployeeForm values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} />
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setAddModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleAdd} className="flex-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                        Добавить
                    </button>
                </div>
            </Dialog>

            <Dialog open={editModal} title="Редактировать сотрудника" onClose={() => setEditModal(false)}>
                <EmployeeForm values={form} onChange={(k, v) => setForm(p => ({ ...p, [k]: v }))} />
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setEditModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleEdit} className="flex-1 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition-colors">
                        Сохранить
                    </button>
                </div>
            </Dialog>

            <Dialog open={deleteModal} title="Удалить сотрудника?" onClose={() => setDeleteModal(false)}>
                <p className="text-white/50 text-sm mb-1">Это действие нельзя отменить. Удалить сотрудника:</p>
                <p className="font-semibold text-white text-sm mb-6">{target?.name}</p>
                <div className="flex gap-2">
                    <button onClick={() => setDeleteModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-colors">
                        Удалить
                    </button>
                </div>
            </Dialog>

            {/* ── Vacancy Modals ── */}
            <Dialog open={addVacancyModal} title="Добавить вакансию" onClose={() => setAddVacancyModal(false)}>
                <VacancyForm values={vacancyForm} onChange={(k, v) => setVacancyForm(p => ({ ...p, [k]: v }))} />
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setAddVacancyModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleAddVacancy} className="flex-1 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium transition-colors">
                        Добавить
                    </button>
                </div>
            </Dialog>

            <Dialog open={editVacancyModal} title="Редактировать вакансию" onClose={() => setEditVacancyModal(false)}>
                <VacancyForm values={vacancyForm} onChange={(k, v) => setVacancyForm(p => ({ ...p, [k]: v }))} />
                <div className="flex gap-2 mt-5">
                    <button onClick={() => setEditVacancyModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleEditVacancy} className="flex-1 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium transition-colors">
                        Сохранить
                    </button>
                </div>
            </Dialog>

            <Dialog open={deleteVacancyModal} title="Удалить вакансию?" onClose={() => setDeleteVacancyModal(false)}>
                <p className="text-white/50 text-sm mb-1">Это действие нельзя отменить. Удалить вакансию:</p>
                <p className="font-semibold text-white text-sm mb-6">{vacancyTarget?.position}</p>
                <div className="flex gap-2">
                    <button onClick={() => setDeleteVacancyModal(false)} className="flex-1 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                        Отмена
                    </button>
                    <button onClick={handleDeleteVacancy} className="flex-1 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-medium transition-colors">
                        Удалить
                    </button>
                </div>
            </Dialog>
        </div>
    )
}
