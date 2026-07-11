// ── Справочники ────────────────────────────────────────────────────────────

export interface RefItem { id: number; title: string }

export const NOMINATIONS: RefItem[] = [
    { id: 1, title: 'Лучший сотрудник года' },
    { id: 2, title: 'За верность профессии' },
    { id: 3, title: 'Наставник года' },
    { id: 4, title: 'Инновация года' },
    { id: 5, title: 'Клиентский сервис года' },
    { id: 6, title: 'Лучшая команда' },
    { id: 7, title: 'За вклад в развитие компании' },
    { id: 8, title: 'Молодой специалист года' },
]

export const FIELDS: RefItem[] = [
    { id: 1, title: 'Разработка ПО' },
    { id: 2, title: 'Продажи' },
    { id: 3, title: 'Клиентская поддержка' },
    { id: 4, title: 'Маркетинг' },
    { id: 5, title: 'Управление персоналом' },
    { id: 6, title: 'Производство' },
    { id: 7, title: 'Логистика' },
    { id: 8, title: 'Финансы' },
]

export const BRANCHES: RefItem[] = [
    { id: 1, title: 'Москва (головной офис)' },
    { id: 2, title: 'Санкт-Петербург' },
    { id: 3, title: 'Новосибирск' },
    { id: 4, title: 'Екатеринбург' },
    { id: 5, title: 'Казань' },
    { id: 6, title: 'Удалённые сотрудники' },
]

export const APPROVING_DEPTS: RefItem[] = [
    { id: 1, title: 'Дирекция по персоналу' },
    { id: 2, title: 'Финансовый департамент' },
    { id: 3, title: 'Юридический отдел' },
    { id: 4, title: 'Служба безопасности' },
]

export const APPROVAL_DECISIONS: RefItem[] = [
    { id: 1, title: 'Согласовано' },
    { id: 2, title: 'Не согласовано' },
]

export function titleById(id: number | string | null | undefined, list: RefItem[]): string {
    if (id === null || id === undefined || id === '') return ''
    const item = list.find(i => i.id === Number(id))
    return item ? item.title : ''
}

// ── Этапы пайплайна (структурная подпись раздела) ───────────────────────────

export const STAGES = [
    { key: 'nominated', label: 'Подана' },
    { key: 'reviewed', label: 'Согласована' },
    { key: 'council', label: 'Комиссия' },
    { key: 'ordered', label: 'Приказ' },
    { key: 'paid', label: 'Премия' },
    { key: 'transferred', label: 'Вручена' },
] as const

export type StageKey = typeof STAGES[number]['key']

// ── Основной тип записи ──────────────────────────────────────────────────

export interface Honoree {
    id: number
    year: number
    surname: string
    name: string
    patronymic: string
    regNum: string
    dateBirth: string
    staffNum: string
    position: string
    department: string
    fieldId: number | null
    awardId: number | null
    branchId: number | null
    dateSendingMgmt: string
    dateResolutionMgmt: string
    authorityId: number | null
    dateNumDoc: string
    decisionAuthorityId: number | null
    dateResolutionDecision: string
    note: string
    dateMeetingCouncil: string
    decisionCouncilAwardId: number | null
    noteCouncil: string
    dateOrder: string
    numOrder: string
    sumBonus: string
    dateDocBonus: string
    numDocBonus: string
    awardTransferred: string
}

export function currentStage(h: Honoree): StageKey {
    if (h.awardTransferred) return 'transferred'
    if (h.sumBonus) return 'paid'
    if (h.numOrder) return 'ordered'
    if (h.decisionCouncilAwardId) return 'council'
    if (h.decisionAuthorityId === 1) return 'reviewed'
    return 'nominated'
}

export function stageIndex(h: Honoree): number {
    return STAGES.findIndex(s => s.key === currentStage(h))
}

export function formatDate(iso: string): string {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return iso
    return `${d}.${m}.${y}`
}

export function formatMoney(v: string): string {
    if (!v) return ''
    const n = Number(v)
    if (Number.isNaN(n)) return v
    return `${n.toLocaleString('ru-RU')} ₽`
}

// ── Генератор выдуманных данных ──────────────────────────────────────────

function mulberry32(seed: number) {
    return function () {
        seed |= 0
        seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function pick<T>(rng: () => number, arr: T[]): T {
    return arr[Math.floor(rng() * arr.length)]
}

const MALE_SURNAMES = ['Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Алексеев', 'Егоров', 'Павлов', 'Семёнов', 'Голубев']
const FEMALE_SURNAMES = MALE_SURNAMES.map(s => s + 'а')
const MALE_NAMES = ['Дмитрий', 'Алексей', 'Сергей', 'Андрей', 'Максим', 'Игорь', 'Роман', 'Павел', 'Николай', 'Виктор']
const FEMALE_NAMES = ['Елена', 'Анна', 'Мария', 'Ольга', 'Ирина', 'Наталья', 'Светлана', 'Юлия', 'Татьяна', 'Ксения']
const MALE_PATR = ['Сергеевич', 'Алексеевич', 'Дмитриевич', 'Игоревич', 'Андреевич', 'Николаевич', 'Викторович', 'Павлович', 'Романович', 'Максимович']
const FEMALE_PATR = ['Сергеевна', 'Алексеевна', 'Дмитриевна', 'Игоревна', 'Андреевна', 'Николаевна', 'Викторовна', 'Павловна', 'Романовна', 'Максимовна']

const FIELD_POSITIONS: Record<number, string[]> = {
    1: ['Ведущий разработчик', 'Backend-разработчик', 'Frontend-разработчик', 'Тимлид разработки'],
    2: ['Менеджер по продажам', 'Руководитель отдела продаж', 'Специалист по работе с клиентами'],
    3: ['Специалист поддержки', 'Руководитель службы поддержки', 'Старший специалист поддержки'],
    4: ['Маркетолог', 'SMM-менеджер', 'Бренд-менеджер'],
    5: ['HR-менеджер', 'Специалист по подбору персонала', 'Руководитель направления HR'],
    6: ['Инженер-технолог', 'Начальник цеха', 'Мастер участка'],
    7: ['Логист', 'Руководитель склада', 'Специалист по логистике'],
    8: ['Бухгалтер', 'Финансовый аналитик', 'Главный экономист'],
}

const YEAR_WEIGHTS: [number, number][] = [[2023, 6], [2024, 9], [2025, 13], [2026, 14]]

function weightedYear(rng: () => number): number {
    const total = YEAR_WEIGHTS.reduce((s, [, w]) => s + w, 0)
    let r = rng() * total
    for (const [year, w] of YEAR_WEIGHTS) {
        if (r < w) return year
        r -= w
    }
    return 2026
}

function addDays(iso: string, days: number): string {
    const d = new Date(iso + 'T00:00:00')
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
}

function generateHonorees(count: number): Honoree[] {
    const rng = mulberry32(20260702)
    const list: Honoree[] = []

    for (let i = 1; i <= count; i++) {
        const isMale = rng() > 0.48
        const surname = pick(rng, isMale ? MALE_SURNAMES : FEMALE_SURNAMES)
        const name = pick(rng, isMale ? MALE_NAMES : FEMALE_NAMES)
        const patronymic = pick(rng, isMale ? MALE_PATR : FEMALE_PATR)
        const fieldId = 1 + Math.floor(rng() * FIELDS.length)
        const position = pick(rng, FIELD_POSITIONS[fieldId])
        const branchId = 1 + Math.floor(rng() * BRANCHES.length)
        const awardId = 1 + Math.floor(rng() * NOMINATIONS.length)
        const year = weightedYear(rng)

        const birthYear = 1970 + Math.floor(rng() * 34)
        const dateBirth = `${birthYear}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 27)).padStart(2, '0')}`

        const dateSendingMgmt = `${year}-${String(1 + Math.floor(rng() * 10)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 27)).padStart(2, '0')}`

        // Прогресс по этапам: чем раньше год, тем дальше по пайплайну; текущий год — широкий разброс
        const isCurrentYear = year === 2026
        const progressRoll = rng()
        let maxStage: number
        if (!isCurrentYear) {
            maxStage = progressRoll < 0.12 ? 2 + Math.floor(rng() * 3) : 5
        } else {
            maxStage = Math.floor(progressRoll * 6)
        }

        const rejected = rng() < 0.08
        const h: Honoree = {
            id: i,
            year,
            surname, name, patronymic,
            regNum: `НМ-${String(year).slice(2)}-${String(i).padStart(3, '0')}`,
            dateBirth,
            staffNum: `ТН-${1000 + i}`,
            position,
            department: FIELDS.find(f => f.id === fieldId)?.title ?? '',
            fieldId,
            awardId,
            branchId,
            dateSendingMgmt,
            dateResolutionMgmt: '',
            authorityId: null,
            dateNumDoc: '',
            decisionAuthorityId: null,
            dateResolutionDecision: '',
            note: '',
            dateMeetingCouncil: '',
            decisionCouncilAwardId: null,
            noteCouncil: '',
            dateOrder: '',
            numOrder: '',
            sumBonus: '',
            dateDocBonus: '',
            numDocBonus: '',
            awardTransferred: '',
        }

        let cursor = dateSendingMgmt

        if (maxStage >= 1) {
            cursor = addDays(cursor, 5 + Math.floor(rng() * 10))
            h.authorityId = 1 + Math.floor(rng() * APPROVING_DEPTS.length)
            h.dateNumDoc = `${formatDate(cursor)}, № СЗ-${300 + i}`
            h.decisionAuthorityId = rejected ? 2 : 1
            h.dateResolutionDecision = `${formatDate(addDays(cursor, 3))}, № РШ-${300 + i}`
            h.dateResolutionMgmt = addDays(cursor, 3)
            if (rng() < 0.35) h.note = 'Материалы направлены с учётом показателей эффективности за отчётный период.'
        }

        if (!rejected && maxStage >= 2) {
            cursor = addDays(cursor, 10 + Math.floor(rng() * 20))
            h.dateMeetingCouncil = cursor
            h.decisionCouncilAwardId = rng() < 0.85 ? awardId : (1 + Math.floor(rng() * NOMINATIONS.length))
            if (rng() < 0.3) h.noteCouncil = 'Решение принято единогласно.'
        }

        if (!rejected && maxStage >= 3) {
            cursor = addDays(cursor, 7 + Math.floor(rng() * 14))
            h.dateOrder = cursor
            h.numOrder = `№ ${100 + i}-НГ`
        }

        if (!rejected && maxStage >= 4) {
            cursor = addDays(cursor, 5 + Math.floor(rng() * 10))
            h.sumBonus = String(10000 + Math.floor(rng() * 8) * 5000)
            h.dateDocBonus = cursor
            h.numDocBonus = `ВП-${300 + i}`
        }

        if (!rejected && maxStage >= 5) {
            cursor = addDays(cursor, 3 + Math.floor(rng() * 14))
            h.awardTransferred = `${formatDate(cursor)}, вручил(а) директор филиала`
        }

        list.push(h)
    }

    return list
}

export const INITIAL_HONOREES: Honoree[] = generateHonorees(46)
