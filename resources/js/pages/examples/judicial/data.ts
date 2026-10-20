// ── Вымышленная организация ──────────────────────────────────────────────
// Транспортно-логистический холдинг «Северный путь»: головная компания и три дочерних
// общества. Юридический департамент холдинга ведёт единую базу судебных споров, в которых
// участвуют компании группы. Все компании, люди, суды и суммы вымышлены; государственных
// структур среди участников нет. Даты считаются от текущего дня.

export type Section = 'group' | 'resonant' | 'subsidiaries'
export type Status = 'in_progress' | 'effective' | 'enforcement' | 'terminated'
export type Role = 'plaintiff' | 'defendant' | 'third_party'
export type PartyRole = 'plaintiff' | 'defendant' | 'third_party' | 'other'
export type Outcome = 'W' | 'PW' | 'L' | 'WD'
export type InstanceType = 'first' | 'appeal' | 'cassation' | 'supervisory'
export type TaskStatus = 'open' | 'review' | 'done'
export type ProjectStatus = 'in_progress' | 'completed'
export type DeadlineColor = 'red' | 'orange' | 'yellow' | 'green' | 'gray'
export type TransferTarget = 'none' | 'bank' | 'agency'

export const ORG_NAME = 'Холдинг «Северный путь»'

export interface Company { id: number; name: string }
export interface Executor { id: number; name: string }
export interface Sphere { id: number; name: string }

export const COMPANIES: Company[] = [
    { id: 1, name: 'ООО «СП Логистика»' },
    { id: 2, name: 'ООО «СП Склады»' },
    { id: 3, name: 'ООО «СП Транс»' },
    { id: 4, name: 'ООО «СП Девелопмент»' },
]

export const EXECUTORS: Executor[] = [
    { id: 1, name: 'Корнилова Анна Сергеевна' },
    { id: 2, name: 'Ветров Игорь Павлович' },
    { id: 3, name: 'Седова Мария Олеговна' },
    { id: 4, name: 'Громов Павел Андреевич' },
]

export const SPHERES: Sphere[] = [
    { id: 1, name: 'Поставки и договоры' },
    { id: 2, name: 'Аренда и недвижимость' },
    { id: 3, name: 'Трудовые споры' },
    { id: 4, name: 'Страхование' },
    { id: 5, name: 'Интеллектуальная собственность' },
    { id: 6, name: 'Деловая репутация' },
    { id: 7, name: 'Банкротство контрагентов' },
]

export const PROGRAMS = ['Новый склад в Северогорске', 'Цифровая отгрузка', 'Обновление автопарка']
export const PROCEEDINGS = ['ГПК', 'АПК', 'КАС', 'Иное']

export const STATUS_LABEL: Record<Status, string> = {
    in_progress: 'В работе',
    effective: 'Вступило в силу',
    enforcement: 'На исполнении',
    terminated: 'Производство прекращено',
}
export const STATUS_CLS: Record<Status, string> = {
    in_progress: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    effective: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
    enforcement: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    terminated: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
}
export const SECTION_LABEL: Record<Section, string> = {
    group: 'Дела холдинга',
    resonant: 'Резонансные дела',
    subsidiaries: 'Дела дочерних обществ',
}
export const ROLE_LABEL: Record<Role, string> = {
    plaintiff: 'Истец',
    defendant: 'Ответчик',
    third_party: 'Третье лицо',
}
export const PARTY_ROLE_LABEL: Record<PartyRole, string> = {
    plaintiff: 'Истец',
    defendant: 'Ответчик',
    third_party: 'Третье лицо',
    other: 'Иное лицо',
}
export const INSTANCE_LABEL: Record<InstanceType, string> = {
    first: 'Первая инстанция',
    appeal: 'Апелляционная инстанция',
    cassation: 'Кассационная инстанция',
    supervisory: 'Надзорная инстанция',
}
export const INSTANCE_ORDER: InstanceType[] = ['first', 'appeal', 'cassation', 'supervisory']
export const OUTCOME_LABEL: Record<Outcome, string> = {
    W: 'Полная победа',
    PW: 'Частичная победа',
    L: 'Поражение',
    WD: 'Иск отозван (добровольное исполнение)',
}
export const OUTCOME_CLS: Record<Outcome, string> = {
    W: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
    PW: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    L: 'bg-rose-500/15 text-rose-500 dark:text-rose-400',
    WD: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
}
export const TRANSFER_LABEL: Record<TransferTarget, string> = {
    none: 'Не передан',
    bank: 'В банк',
    agency: 'Коллекторскому агентству',
}
export const TASK_LABEL: Record<TaskStatus, string> = { open: 'Открыта', review: 'На проверке', done: 'Выполнена' }
export const TASK_CLS: Record<TaskStatus, string> = {
    open: 'bg-sky-500/15 text-sky-500 dark:text-sky-400',
    review: 'bg-amber-500/15 text-amber-500 dark:text-amber-400',
    done: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400',
}
export const DEADLINE_DOT: Record<DeadlineColor, string> = {
    red: 'bg-rose-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-emerald-500',
    gray: 'bg-slate-400/60',
}

export interface Hearing { id: number; date: string; plan: string; result: string }
export interface Instance {
    type: InstanceType
    court: string
    judge: string
    number: string
    decisionDate: string | null
    appealDeadline: string | null
    nextHearing: string | null
    nextTask: string
    hearings: Hearing[]
}
export interface Party { id: number; role: PartyRole; name: string; inn: string; ours: boolean }
export interface Financials { claim: number; costs: number; awarded: number | null; awardedCosts: number | null }
export interface Enforcement { writIssued: boolean; transferredTo: TransferTarget; deadline: string | null; note: string }
export interface Note { id: number; date: string; text: string }
export interface HistoryItem { id: number; at: string; user: string; text: string }

export interface Case {
    id: number
    section: Section
    projectId: number | null
    sphereId: number
    subject: string
    proceeding: string
    receiptDate: string
    role: Role
    companyId: number
    executorId: number
    status: Status
    outcome: Outcome | null
    outcomeComment: string
    currentTask: string
    currentTaskDate: string | null
    directorControl: boolean
    instances: Instance[]
    parties: Party[]
    fin: Financials
    programs: string[]
    extraNumbers: string[]
    enforcement: Enforcement
    notes: Note[]
    history: HistoryItem[]
    linkedIds: number[]
}

export interface Project {
    id: number
    name: string
    goal: string
    description: string
    risks: string
    status: ProjectStatus
    sphereId: number
    responsibleId: number
    currentTask: string
}

export interface Task {
    id: number
    entity: 'case' | 'project'
    entityId: number
    title: string
    description: string
    executorId: number
    deadline: string | null
    status: TaskStatus
    result: string
    createdAt: string
}

export interface Db { cases: Case[]; projects: Project[]; tasks: Task[]; seq: number }

// ── Даты и форматы ───────────────────────────────────────────────────────

export const todayIso = () => new Date().toISOString().slice(0, 10)
export const shift = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}
export const fmtDate = (iso: string | null | undefined) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : '—')
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000)
export const fmtRub = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `${Math.round(n).toLocaleString('ru-RU')} ₽`)

export function deadlineColor(iso: string | null, done = false): DeadlineColor {
    if (!iso || done) return 'gray'
    const left = daysBetween(todayIso(), iso)
    return left < 0 ? 'red' : left <= 3 ? 'orange' : left <= 7 ? 'yellow' : 'green'
}

export const execName = (id: number | null) => EXECUTORS.find(e => e.id === id)?.name ?? '—'
export const shortName = (full: string) => {
    const [last, first, mid] = full.split(' ')
    return first ? `${last} ${first[0]}.${mid ? ` ${mid[0]}.` : ''}` : full
}
export const companyName = (id: number) => COMPANIES.find(c => c.id === id)?.name ?? '—'
export const sphereName = (id: number) => SPHERES.find(s => s.id === id)?.name ?? '—'

export const mainNumber = (c: Case) => c.instances[0]?.number || 'номер не присвоен'
export const mainCourt = (c: Case) => c.instances[c.instances.length - 1]?.court || '—'

/** Финансовый расчёт со стороны компании группы: прогноз, результат и эффект */
export function calcFin(c: Case): { forecast: number; result: number | null; effect: number | null } {
    const forecast = c.fin.claim + c.fin.costs
    if (c.fin.awarded === null) return { forecast, result: null, effect: null }
    const awarded = c.fin.awarded + (c.fin.awardedCosts ?? 0)
    // истец: результат — присуждено в пользу компании; ответчик: результат — сколько придётся заплатить
    return c.role === 'plaintiff'
        ? { forecast, result: awarded, effect: awarded - forecast }
        : { forecast, result: awarded, effect: forecast - awarded }
}

export const isOverdue = (c: Case) => c.status !== 'terminated' && !!c.currentTaskDate && c.currentTaskDate < todayIso()

// ── Операции над базой ───────────────────────────────────────────────────

export const withHistory = (c: Case, seq: number, text: string): Case => ({
    ...c,
    history: [{ id: seq, at: new Date().toISOString(), user: 'Вы (демо)', text }, ...c.history],
})

export const emptyInstance = (type: InstanceType, court = '', number = ''): Instance => ({
    type, court, judge: '', number, decisionDate: null, appealDeadline: null, nextHearing: null, nextTask: '', hearings: [],
})

// ── Начальные данные ─────────────────────────────────────────────────────

export function makeSeed(): Db {
    let seq = 1000
    const id = () => ++seq
    const hearing = (date: string, plan: string, result = ''): Hearing => ({ id: id(), date, plan, result })
    const party = (role: PartyRole, name: string, inn: string, ours = false): Party => ({ id: id(), role, name, inn, ours })
    const inst = (type: InstanceType, court: string, judge: string, number: string, extra: Partial<Instance> = {}): Instance => ({
        type, court, judge, number, decisionDate: null, appealDeadline: null, nextHearing: null, nextTask: '', hearings: [], ...extra,
    })
    const hist = (daysAgo: number, user: string, text: string): HistoryItem => ({ id: id(), at: `${shift(-daysAgo)}T10:00:00`, user, text })
    const enf0: Enforcement = { writIssued: false, transferredTo: 'none', deadline: null, note: '' }

    const ARB = 'Арбитражный суд Северного округа'
    const ARB2 = 'Второй арбитражный апелляционный суд'
    const ARB3 = 'Арбитражный суд Центрального кассационного округа'
    const RAYON = 'Центральный районный суд г. Северогорска'
    const OBL = 'Северогорский областной суд'

    const cases: Case[] = [
        {
            id: 1, section: 'group', projectId: 1, sphereId: 1, proceeding: 'АПК', receiptDate: shift(-210), role: 'plaintiff', companyId: 1, executorId: 1,
            subject: 'Взыскание задолженности по договору поставки цемента и неустойки',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Подготовить возражения на отзыв ответчика', currentTaskDate: shift(4), directorControl: true,
            instances: [
                inst('first', ARB, 'Лаврентьева Т. Н.', 'А71-4120/2026', { nextHearing: shift(9), nextTask: 'Рассмотрение ходатайства о назначении экспертизы', hearings: [
                    hearing(shift(-120), 'Предварительное заседание', 'Дело назначено к разбирательству, ответчику предложено представить отзыв'),
                    hearing(shift(-52), 'Рассмотрение по существу', 'Заседание отложено в связи с запросом документов у третьего лица'),
                ] }),
            ],
            parties: [party('plaintiff', 'ООО «СП Логистика»', '7701234567', true), party('defendant', 'АО «Метробетон»', '7702345678'), party('third_party', 'ООО «Кедр-Снаб»', '7703456789')],
            fin: { claim: 18_400_000, costs: 142_000, awarded: null, awardedCosts: null },
            programs: ['Новый склад в Северогорске'], extraNumbers: ['Претензия № 118/П от прошлого года'], enforcement: enf0,
            notes: [{ id: id(), date: shift(9), text: 'Взять оригиналы накладных и акт сверки' }],
            history: [hist(30, 'Корнилова А. С.', 'Изменена актуальная задача'), hist(120, 'Корнилова А. С.', 'Добавлено заседание: предварительное'), hist(210, 'Корнилова А. С.', 'Дело создано')],
            linkedIds: [2],
        },
        {
            id: 2, section: 'group', projectId: 1, sphereId: 1, proceeding: 'АПК', receiptDate: shift(-95), role: 'defendant', companyId: 1, executorId: 2,
            subject: 'Встречный иск о снижении цены поставленной партии цемента',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Ходатайство об объединении дел', currentTaskDate: shift(-2), directorControl: false,
            instances: [inst('first', ARB, 'Лаврентьева Т. Н.', 'А71-5533/2026', { nextHearing: shift(9), nextTask: 'Совместное рассмотрение с делом А71-4120/2026' })],
            parties: [party('plaintiff', 'АО «Метробетон»', '7702345678'), party('defendant', 'ООО «СП Логистика»', '7701234567', true)],
            fin: { claim: 3_200_000, costs: 48_000, awarded: null, awardedCosts: null },
            programs: ['Новый склад в Северогорске'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(95, 'Ветров И. П.', 'Дело создано')], linkedIds: [1],
        },
        {
            id: 3, section: 'group', projectId: null, sphereId: 2, proceeding: 'АПК', receiptDate: shift(-330), role: 'plaintiff', companyId: 2, executorId: 3,
            subject: 'Выселение арендатора и взыскание арендной платы за складской комплекс',
            status: 'enforcement', outcome: 'PW', outcomeComment: 'Арендная плата взыскана частично, во взыскании пени судом отказано в части',
            currentTask: 'Проконтролировать перечисление средств банком', currentTaskDate: shift(12), directorControl: false,
            instances: [
                inst('first', ARB, 'Орлов В. С.', 'А71-0987/2025', { decisionDate: shift(-210), appealDeadline: shift(-180) }),
                inst('appeal', ARB2, 'Беляева К. Д.', '17АП-2201/2026', { decisionDate: shift(-120), appealDeadline: shift(-95) }),
            ],
            parties: [party('plaintiff', 'ООО «СП Склады»', '7704567890', true), party('defendant', 'ООО «ТехноСервис»', '7705678901')],
            fin: { claim: 6_750_000, costs: 96_000, awarded: 5_900_000, awardedCosts: 88_000 },
            programs: [], extraNumbers: [],
            enforcement: { writIssued: true, transferredTo: 'bank', deadline: shift(12), note: 'Исполнительный лист предъявлен в банк должника, частичное списание уже произведено' },
            notes: [], history: [hist(5, 'Седова М. О.', 'Обновлены сведения об исполнении'), hist(95, 'Седова М. О.', 'Добавлена апелляционная инстанция'), hist(330, 'Седова М. О.', 'Дело создано')],
            linkedIds: [],
        },
        {
            id: 4, section: 'subsidiaries', projectId: 2, sphereId: 4, proceeding: 'АПК', receiptDate: shift(-140), role: 'plaintiff', companyId: 3, executorId: 4,
            subject: 'Страховое возмещение за повреждённый груз при перевозке',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Представить оценку ущерба независимого эксперта', currentTaskDate: shift(2), directorControl: false,
            instances: [inst('first', ARB, 'Громова Е. А.', 'А71-2210/2026', { nextHearing: shift(3), nextTask: 'Допрос эксперта', hearings: [hearing(shift(-60), 'Предварительное заседание', 'Назначена судебная экспертиза')] })],
            parties: [party('plaintiff', 'ООО «СП Транс»', '7706789012', true), party('defendant', 'ООО «СК «Гарант Плюс»»', '7707890123')],
            fin: { claim: 2_850_000, costs: 61_000, awarded: null, awardedCosts: null },
            programs: ['Обновление автопарка'], extraNumbers: ['Страховое дело № ГП-4471'], enforcement: enf0,
            notes: [{ id: id(), date: shift(3), text: 'Эксперт приедет в суд к 10:00' }],
            history: [hist(14, 'Громов П. А.', 'Изменена актуальная задача'), hist(140, 'Громов П. А.', 'Дело создано')], linkedIds: [5],
        },
        {
            id: 5, section: 'subsidiaries', projectId: 2, sphereId: 4, proceeding: 'АПК', receiptDate: shift(-60), role: 'plaintiff', companyId: 3, executorId: 4,
            subject: 'Взыскание страхового возмещения за утрату груза (вторая партия)',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Собрать подтверждающие документы по утрате', currentTaskDate: shift(15), directorControl: false,
            instances: [inst('first', ARB, 'Громова Е. А.', 'А71-3099/2026')],
            parties: [party('plaintiff', 'ООО «СП Транс»', '7706789012', true), party('defendant', 'ООО «СК «Гарант Плюс»»', '7707890123')],
            fin: { claim: 1_240_000, costs: 28_000, awarded: null, awardedCosts: null },
            programs: ['Обновление автопарка'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(60, 'Громов П. А.', 'Дело создано')], linkedIds: [4],
        },
        {
            id: 6, section: 'resonant', projectId: 3, sphereId: 2, proceeding: 'АПК', receiptDate: shift(-400), role: 'defendant', companyId: 4, executorId: 1,
            subject: 'Спор о праве на земельный участок под строительство распределительного центра',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Подготовить кассационную жалобу', currentTaskDate: shift(6), directorControl: true,
            instances: [
                inst('first', ARB, 'Орлов В. С.', 'А71-7781/2025', { decisionDate: shift(-250), appealDeadline: shift(-220) }),
                inst('appeal', ARB2, 'Беляева К. Д.', '17АП-9014/2025', { decisionDate: shift(-110), appealDeadline: shift(-80) }),
                inst('cassation', ARB3, 'Власов Н. И.', 'Ф09-3120/26', { nextHearing: shift(21), nextTask: 'Рассмотрение кассационной жалобы' }),
            ],
            parties: [party('plaintiff', 'ООО «Берег-Девелопмент»', '7708901234'), party('defendant', 'ООО «СП Девелопмент»', '7709012345', true), party('third_party', 'АО «Северный Терминал»', '7710123456')],
            fin: { claim: 54_000_000, costs: 310_000, awarded: null, awardedCosts: null },
            programs: ['Новый склад в Северогорске'], extraNumbers: [], enforcement: enf0,
            notes: [{ id: id(), date: shift(21), text: 'Командировка представителя в кассационный суд' }],
            history: [hist(3, 'Корнилова А. С.', 'Добавлена кассационная инстанция'), hist(110, 'Корнилова А. С.', 'Решение апелляции: оставлено без изменения'), hist(400, 'Корнилова А. С.', 'Дело создано')],
            linkedIds: [],
        },
        {
            id: 7, section: 'resonant', projectId: 3, sphereId: 6, proceeding: 'ГПК', receiptDate: shift(-75), role: 'plaintiff', companyId: 1, executorId: 2,
            subject: 'Защита деловой репутации: опровержение публикации о срыве поставок',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Подготовить заключение лингвистической экспертизы', currentTaskDate: shift(8), directorControl: true,
            instances: [inst('first', RAYON, 'Прохорова Л. В.', '2-1844/2026', { nextHearing: shift(14), nextTask: 'Допрос свидетелей', hearings: [hearing(shift(-28), 'Беседа', 'Назначено судебное заседание')] })],
            parties: [party('plaintiff', 'ООО «СП Логистика»', '7701234567', true), party('defendant', 'ООО «Деловой вестник»', '7711234567')],
            fin: { claim: 500_000, costs: 35_000, awarded: null, awardedCosts: null },
            programs: [], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(28, 'Ветров И. П.', 'Добавлено заседание: беседа'), hist(75, 'Ветров И. П.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 8, section: 'group', projectId: null, sphereId: 3, proceeding: 'ГПК', receiptDate: shift(-180), role: 'defendant', companyId: 1, executorId: 3,
            subject: 'Иск бывшего сотрудника о выплате премии и компенсации морального вреда',
            status: 'effective', outcome: 'PW', outcomeComment: 'Взыскана часть премии, во взыскании морального вреда отказано',
            currentTask: 'Перечислить присуждённую сумму', currentTaskDate: shift(1), directorControl: false,
            instances: [inst('first', RAYON, 'Прохорова Л. В.', '2-0912/2026', { decisionDate: shift(-40), appealDeadline: shift(-10) })],
            parties: [party('plaintiff', 'Лебедева Мария Николаевна', '', false), party('defendant', 'ООО «СП Логистика»', '7701234567', true)],
            fin: { claim: 420_000, costs: 15_000, awarded: 138_000, awardedCosts: 9_000 },
            programs: [], extraNumbers: [], enforcement: { writIssued: false, transferredTo: 'none', deadline: shift(1), note: 'Платёжное поручение на согласовании в бухгалтерии' },
            notes: [], history: [hist(40, 'Седова М. О.', 'Вынесено решение суда'), hist(180, 'Седова М. О.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 9, section: 'subsidiaries', projectId: null, sphereId: 1, proceeding: 'АПК', receiptDate: shift(-260), role: 'plaintiff', companyId: 2, executorId: 2,
            subject: 'Взыскание неустойки за просрочку поставки стеллажного оборудования',
            status: 'terminated', outcome: 'WD', outcomeComment: 'Ответчик погасил задолженность добровольно, иск отозван',
            currentTask: '', currentTaskDate: null, directorControl: false,
            instances: [inst('first', ARB, 'Орлов В. С.', 'А71-8843/2025', { decisionDate: shift(-150) })],
            parties: [party('plaintiff', 'ООО «СП Склады»', '7704567890', true), party('defendant', 'ООО «Ладья-Опт»', '7712345678')],
            fin: { claim: 970_000, costs: 24_000, awarded: 994_000, awardedCosts: 0 },
            programs: ['Новый склад в Северогорске'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(150, 'Ветров И. П.', 'Производство прекращено'), hist(260, 'Ветров И. П.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 10, section: 'group', projectId: null, sphereId: 5, proceeding: 'АПК', receiptDate: shift(-45), role: 'defendant', companyId: 1, executorId: 1,
            subject: 'Иск о нарушении исключительных прав на программное обеспечение для учёта грузов',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Подготовить правовую позицию и заключение по лицензии', currentTaskDate: shift(-5), directorControl: false,
            instances: [inst('first', ARB, 'Громова Е. А.', 'А71-3871/2026', { nextHearing: shift(1), nextTask: 'Предварительное заседание' })],
            parties: [party('plaintiff', 'ООО «Алгоритм-Софт»', '7713456789'), party('defendant', 'ООО «СП Логистика»', '7701234567', true)],
            fin: { claim: 4_000_000, costs: 60_000, awarded: null, awardedCosts: null },
            programs: ['Цифровая отгрузка'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(45, 'Корнилова А. С.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 11, section: 'subsidiaries', projectId: null, sphereId: 7, proceeding: 'АПК', receiptDate: shift(-300), role: 'third_party', companyId: 4, executorId: 3,
            subject: 'Требование кредитора в деле о банкротстве подрядчика «Строймастер»',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Подать возражения на реестр требований', currentTaskDate: shift(11), directorControl: false,
            instances: [inst('first', ARB, 'Власов Н. И.', 'А71-0044/2025', { nextHearing: shift(27), nextTask: 'Собрание кредиторов', hearings: [
                hearing(shift(-200), 'Введение наблюдения', 'Введена процедура наблюдения'),
                hearing(shift(-90), 'Рассмотрение требований кредиторов', 'Требование включено в реестр в части'),
            ] })],
            parties: [party('other', 'ООО «Строймастер»', '7714567890'), party('third_party', 'ООО «СП Девелопмент»', '7709012345', true)],
            fin: { claim: 8_900_000, costs: 0, awarded: null, awardedCosts: null },
            programs: ['Новый склад в Северогорске'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(90, 'Седова М. О.', 'Обновлены сведения о заседании'), hist(300, 'Седова М. О.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 12, section: 'resonant', projectId: null, sphereId: 6, proceeding: 'АПК', receiptDate: shift(-500), role: 'plaintiff', companyId: 1, executorId: 1,
            subject: 'Взыскание убытков с перевозчика за срыв сроков доставки ключевого клиента',
            status: 'effective', outcome: 'W', outcomeComment: 'Иск удовлетворён полностью, решение вступило в силу',
            currentTask: 'Подать исполнительный лист', currentTaskDate: shift(7), directorControl: true,
            instances: [
                inst('first', ARB, 'Орлов В. С.', 'А71-1120/2025', { decisionDate: shift(-300), appealDeadline: shift(-270) }),
                inst('appeal', ARB2, 'Беляева К. Д.', '17АП-4402/2025', { decisionDate: shift(-190), appealDeadline: shift(-160) }),
            ],
            parties: [party('plaintiff', 'ООО «СП Логистика»', '7701234567', true), party('defendant', 'ООО «Быстрый Рейс»', '7715678901')],
            fin: { claim: 12_300_000, costs: 188_000, awarded: 12_300_000, awardedCosts: 188_000 },
            programs: [], extraNumbers: [], enforcement: { writIssued: true, transferredTo: 'none', deadline: shift(7), note: 'Исполнительный лист получен, готовим пакет документов' },
            notes: [], history: [hist(160, 'Корнилова А. С.', 'Решение вступило в силу'), hist(500, 'Корнилова А. С.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 13, section: 'group', projectId: null, sphereId: 2, proceeding: 'АПК', receiptDate: shift(-30), role: 'plaintiff', companyId: 2, executorId: 4,
            subject: 'Расторжение договора аренды погрузочной техники и возврат оборудования',
            status: 'in_progress', outcome: null, outcomeComment: '',
            currentTask: 'Назначить осмотр техники совместно с ответчиком', currentTaskDate: shift(20), directorControl: false,
            instances: [inst('first', ARB, '', '')],
            parties: [party('plaintiff', 'ООО «СП Склады»', '7704567890', true), party('defendant', 'ООО «Вектор-Техника»', '7716789012')],
            fin: { claim: 1_560_000, costs: 32_000, awarded: null, awardedCosts: null },
            programs: [], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(30, 'Громов П. А.', 'Дело создано')], linkedIds: [],
        },
        {
            id: 14, section: 'subsidiaries', projectId: null, sphereId: 1, proceeding: 'АПК', receiptDate: shift(-220), role: 'defendant', companyId: 3, executorId: 2,
            subject: 'Иск поставщика запчастей об оплате партии с браком',
            status: 'terminated', outcome: 'L', outcomeComment: 'Иск удовлетворён полностью, апелляционная жалоба оставлена без удовлетворения',
            currentTask: '', currentTaskDate: null, directorControl: false,
            instances: [
                inst('first', ARB, 'Громова Е. А.', 'А71-6501/2025', { decisionDate: shift(-130), appealDeadline: shift(-100) }),
                inst('appeal', ARB2, 'Беляева К. Д.', '17АП-7733/2025', { decisionDate: shift(-60) }),
            ],
            parties: [party('plaintiff', 'ООО «Автокомпонент»', '7717890123'), party('defendant', 'ООО «СП Транс»', '7706789012', true)],
            fin: { claim: 2_100_000, costs: 40_000, awarded: 2_100_000, awardedCosts: 40_000 },
            programs: ['Обновление автопарка'], extraNumbers: [], enforcement: enf0, notes: [],
            history: [hist(60, 'Ветров И. П.', 'Апелляционная жалоба отклонена'), hist(220, 'Ветров И. П.', 'Дело создано')], linkedIds: [],
        },
    ]

    const projects: Project[] = [
        {
            id: 1, name: 'Спор с «Метробетоном» по поставкам цемента', status: 'in_progress', sphereId: 1, responsibleId: 1,
            goal: 'Взыскать долг по поставке и отбить встречные требования по качеству партии',
            description: 'Два связанных дела: основной иск о задолженности и встречный иск о снижении цены. Планируем объединить их в одно производство.',
            risks: 'Если суд примет довод ответчика о браке, часть долга может быть списана',
            currentTask: 'Ходатайство об объединении дел № А71-4120/2026 и А71-5533/2026',
        },
        {
            id: 2, name: 'Страховые выплаты по грузовым авариям', status: 'in_progress', sphereId: 4, responsibleId: 4,
            goal: 'Получить возмещение по двум страховым случаям и выработать единую позицию по отказам страховой',
            description: 'Две партии груза пострадали при перевозке, страховая компания отказала в выплате в обоих случаях.',
            risks: 'Страховая оспаривает размер ущерба и применимость франшизы',
            currentTask: 'Независимая оценка ущерба по первой партии',
        },
        {
            id: 3, name: 'Репутация и земля: резонансные споры 2026', status: 'in_progress', sphereId: 6, responsibleId: 1,
            goal: 'Защитить деловую репутацию холдинга и сохранить право на участок под распределительный центр',
            description: 'Два дела, внимание к которым приковано со стороны партнёров и прессы. Требуется единая коммуникационная позиция.',
            risks: 'Проигрыш по земельному спору остановит строительство центра',
            currentTask: 'Согласовать позицию по кассационной жалобе и пресс-релиз',
        },
        {
            id: 4, name: 'Претензионная работа 2025', status: 'completed', sphereId: 1, responsibleId: 2,
            goal: 'Закрыть все просроченные требования к контрагентам до конца года',
            description: 'Проект завершён: большинство требований погашены в досудебном порядке.',
            risks: '', currentTask: '',
        },
    ]

    const tasks: Task[] = [
        { id: id(), entity: 'case', entityId: 1, title: 'Собрать оригиналы накладных за прошлый год', description: 'Необходимы для приобщения к материалам дела', executorId: 4, deadline: shift(3), status: 'open', result: '', createdAt: shift(-10) },
        { id: id(), entity: 'case', entityId: 2, title: 'Подготовить ходатайство об объединении дел', description: '', executorId: 2, deadline: shift(-2), status: 'open', result: '', createdAt: shift(-14) },
        { id: id(), entity: 'case', entityId: 6, title: 'Проект кассационной жалобы', description: 'Согласовать с руководителем департамента', executorId: 1, deadline: shift(5), status: 'review', result: 'Черновик готов, нужна проверка аргументов по границам участка', createdAt: shift(-20) },
        { id: id(), entity: 'case', entityId: 10, title: 'Запросить лицензионное соглашение у ИТ-отдела', description: '', executorId: 1, deadline: shift(-6), status: 'open', result: '', createdAt: shift(-30) },
        { id: id(), entity: 'case', entityId: 12, title: 'Получить исполнительный лист в суде', description: '', executorId: 3, deadline: shift(-8), status: 'done', result: 'Лист получен', createdAt: shift(-25) },
        { id: id(), entity: 'project', entityId: 3, title: 'Согласовать пресс-релиз по земельному спору', description: 'Совместно с отделом коммуникаций', executorId: 1, deadline: shift(10), status: 'open', result: '', createdAt: shift(-4) },
        { id: id(), entity: 'project', entityId: 2, title: 'Заказать независимую оценку груза', description: '', executorId: 4, deadline: shift(2), status: 'review', result: 'Заключение эксперта получено, проверить расчёт франшизы', createdAt: shift(-18) },
        { id: id(), entity: 'case', entityId: 11, title: 'Подготовить возражения на реестр требований', description: '', executorId: 3, deadline: shift(11), status: 'open', result: '', createdAt: shift(-3) },
    ]

    return { cases, projects, tasks, seq }
}
