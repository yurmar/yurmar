// ── Вымышленная организация ──────────────────────────────────────────────
// Администрация Заречного муниципального округа. Все вопросы и ответы
// вымышлены — интерактивный пример вёрстки раздела «Опросы».

export type PollStatus = 'upcoming' | 'active' | 'finished'

export interface PollOption {
    id: number
    text: string
    votes: number
}

export interface Poll {
    id: number
    question: string
    description: string
    startDate: string // YYYY-MM-DD
    endDate: string // YYYY-MM-DD, включительно
    allowOther: boolean
    options: PollOption[]
    otherVotes: number
    otherAnswers: string[]
    hasVoted: boolean
    myOptionId: number | null // null + hasVoted — выбрано «Другое»
}

export interface PollDraft {
    id?: number
    question: string
    description: string
    startDate: string
    endDate: string
    allowOther: boolean
    options: { id?: number; text: string }[]
}

// ── Даты ───────────────────────────────────────────────────────────────────

export const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const shiftDays = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return toIso(d)
}

export const formatDate = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function pollStatus(p: Pick<Poll, 'startDate' | 'endDate'>): PollStatus {
    const today = toIso(new Date())
    if (today < p.startDate) return 'upcoming'
    if (today > p.endDate) return 'finished'
    return 'active'
}

// ── Подсчёт ────────────────────────────────────────────────────────────────

export const totalVotes = (p: Poll) => p.options.reduce((s, o) => s + o.votes, 0) + p.otherVotes

export const percent = (votes: number, total: number) => (total > 0 ? Math.round((votes / total) * 100) : 0)

export const makeId = (() => {
    let n = 1000
    return () => ++n
})()

// ── Начальные данные (даты считаются от сегодняшнего дня) ─────────────────

export function initialPolls(): Poll[] {
    const opt = (id: number, text: string, votes: number): PollOption => ({ id, text, votes })
    return [
        {
            id: 1,
            question: 'Какой формат еженедельных совещаний вам удобнее?',
            description: 'Сейчас совещания проходят очно по понедельникам в 10:00. Хотим понять, нужно ли что-то менять.',
            startDate: shiftDays(-3),
            endDate: shiftDays(4),
            allowOther: true,
            options: [opt(11, 'Очно, как сейчас', 14), opt(12, 'По видеосвязи', 9), opt(13, 'Смешанный: очно и онлайн', 21), opt(14, 'Раз в две недели вместо еженедельных', 6)],
            otherVotes: 2,
            otherAnswers: ['Короткий стендап по пятницам вместо понедельничного совещания', 'Только письменный отчёт, без встречи'],
            hasVoted: true,
            myOptionId: 13,
        },
        {
            id: 2,
            question: 'В какое время удобнее проводить планёрки отделов?',
            description: '',
            startDate: shiftDays(-1),
            endDate: shiftDays(6),
            allowOther: true,
            options: [opt(21, 'В начале рабочего дня, 9:00–9:30', 0), opt(22, 'Перед обедом, 11:30–12:00', 0), opt(23, 'После обеда, 14:00–14:30', 0), opt(24, 'В конце дня, 17:00–17:30', 0)],
            otherVotes: 0,
            otherAnswers: [],
            hasVoted: false,
            myOptionId: null,
        },
        {
            id: 3,
            question: 'Какую дату выбрать для общего корпоративного мероприятия?',
            description: 'Мероприятие приурочено ко Дню муниципального служащего. Участие добровольное.',
            startDate: shiftDays(-5),
            endDate: shiftDays(2),
            allowOther: false,
            options: [opt(31, 'Пятница, 22 числа', 18), opt(32, 'Суббота, 23 числа', 27), opt(33, 'Пятница, 29 числа', 11)],
            otherVotes: 0,
            otherAnswers: [],
            hasVoted: false,
            myOptionId: null,
        },
        {
            id: 4,
            question: 'Что добавить в меню служебной столовой?',
            description: 'Опрос начнётся на следующей неделе — вопрос уже опубликован, чтобы вы успели подумать.',
            startDate: shiftDays(3),
            endDate: shiftDays(10),
            allowOther: true,
            options: [opt(41, 'Больше вегетарианских блюд', 0), opt(42, 'Свежие салаты каждый день', 0), opt(43, 'Выпечку к чаю', 0)],
            otherVotes: 0,
            otherAnswers: [],
            hasVoted: false,
            myOptionId: null,
        },
        {
            id: 5,
            question: 'Насколько удобна новая электронная пропускная система?',
            description: 'Система работает с начала прошлого месяца. Спасибо всем, кто ответил!',
            startDate: shiftDays(-24),
            endDate: shiftDays(-10),
            allowOther: true,
            options: [opt(51, 'Очень удобна', 23), opt(52, 'Скорее удобна', 31), opt(53, 'Скорее неудобна', 12), opt(54, 'Неудобна', 5)],
            otherVotes: 3,
            otherAnswers: ['Не работает на турникете у запасного входа', 'Хотелось бы пропуск в телефоне', 'Гостям долго оформлять заявку'],
            hasVoted: true,
            myOptionId: 52,
        },
        {
            id: 6,
            question: 'Нужен ли сокращённый рабочий день в предпраздничные дни?',
            description: '',
            startDate: shiftDays(-30),
            endDate: shiftDays(-18),
            allowOther: false,
            options: [opt(61, 'Да, на 1 час', 44), opt(62, 'Да, но с отработкой', 13), opt(63, 'Нет, оставить как есть', 8)],
            otherVotes: 0,
            otherAnswers: [],
            hasVoted: false,
            myOptionId: null,
        },
    ]
}
