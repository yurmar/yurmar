// ── Вымышленная организация ──────────────────────────────────────────────
// Администрация Заречного муниципального округа. Все заявки, сотрудники и
// переписка вымышлены — интерактивный пример вёрстки раздела «Техподдержка».

export const STATUS_NEW = 69
export const STATUS_IN_WORK = 70
export const STATUS_REJECTED = 71
export const STATUS_DONE = 72

export const ACTIVE_STATUSES = [STATUS_NEW, STATUS_IN_WORK]
export const ARCHIVE_STATUSES = [STATUS_REJECTED, STATUS_DONE]

export interface TicketMessage {
    id: number
    isSupport: boolean
    sender: string
    text: string
    createdAt: string // ISO
}

export interface Ticket {
    id: number
    name: string
    description: string
    section: string
    statusId: number
    link: string
    deadline: string | null
    applicant: string
    applicantOrg: string
    applicantPhone: string
    executor: string
    rating: number
    createdAt: string
    takenAt: string | null
    finishedAt: string | null
    unread: number
    messages: TicketMessage[]
}

export const SECTIONS = [
    'Главная', 'Телефонный справочник', 'Ежедневный рапорт', 'Информационные материалы',
    'Реестр наград', 'Бюджет', 'Статистика', 'Опросы', 'Календарь совещаний',
    'Архив документов', 'Рейтинг филиалов', 'Другое',
]

export const ME_APPLICANT = 'Гусева Ольга Петровна'
export const ME_ORG = 'Отдел организационной работы'
export const SUPPORT_USER = 'Лебедев Артём'

// ── Время ──────────────────────────────────────────────────────────────────

/** ISO-строка «N минут назад» (отрицательное — в будущее) */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString()

export const parseDate = (iso: string | null) => {
    if (!iso) return null
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : d
}

const pad = (n: number) => String(n).padStart(2, '0')

export const formatDisplayDate = (iso: string | null, withTime = true) => {
    const d = parseDate(iso)
    if (!d) return ''
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
    return withTime ? `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}` : date
}

export const formatDuration = (minutes: number) => {
    if (!minutes || isNaN(minutes)) return 'Нет данных'
    if (minutes < 60) return `${Math.round(minutes)} мин`
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m === 0 ? `${h} ч` : `${h} ч ${m} мин`
}

const diffMinutes = (from: string | null, to: string | null) => {
    const a = parseDate(from)
    const b = parseDate(to)
    return a && b ? Math.abs(b.getTime() - a.getTime()) / 60000 : null
}

export const takeMinutes = (t: Ticket) => diffMinutes(t.createdAt, t.takenAt)
export const completeMinutes = (t: Ticket) => (t.statusId === STATUS_DONE ? diffMinutes(t.takenAt, t.finishedAt) : null)

export const nextId = (() => {
    let n = 1000
    return () => ++n
})()

// ── Демо-заявки ────────────────────────────────────────────────────────────

const U = {
    ivanova: { applicant: 'Иванова Марина Сергеевна', applicantOrg: 'Финансовое управление', applicantPhone: '+7 (3952) 25-10-41' },
    petrov: { applicant: 'Петров Андрей Николаевич', applicantOrg: 'Управление образования', applicantPhone: '+7 (3952) 25-10-52' },
    sokolova: { applicant: 'Соколова Елена Викторовна', applicantOrg: 'Отдел кадров', applicantPhone: '+7 (3952) 25-10-63' },
    kuznetsov: { applicant: 'Кузнецов Дмитрий Олегович', applicantOrg: 'Управление ЖКХ', applicantPhone: '+7 (3952) 25-10-74' },
    gus: { applicant: ME_APPLICANT, applicantOrg: ME_ORG, applicantPhone: '+7 (3952) 25-10-85' },
}

const EX = ['Лебедев Артём Игоревич', 'Новикова Дарья Андреевна', 'Фомин Кирилл Павлович']

const msg = (id: number, isSupport: boolean, sender: string, text: string, minutesAgo: number): TicketMessage => ({
    id, isSupport, sender, text, createdAt: ago(minutesAgo),
})

export const initialTickets: Ticket[] = [
    {
        id: 101, name: 'Не открывается отчёт по бюджету', section: 'Бюджет', statusId: STATUS_NEW,
        description: 'При переходе на вкладку «Структура» страница остаётся белой. Пробовала обновить и зайти из другого браузера — то же самое.',
        link: 'https://portal.example.ru/budget/structure', deadline: ago(-60 * 24), ...U.ivanova,
        executor: '', rating: 0, createdAt: ago(35), takenAt: null, finishedAt: null, unread: 0, messages: [],
    },
    {
        id: 102, name: 'Нет доступа к разделу «Реестр наград»', section: 'Реестр наград', statusId: STATUS_NEW,
        description: 'После перевода в другой отдел раздел перестал открываться — перебрасывает на главную. Прошу проверить права.',
        link: 'https://portal.example.ru/awards', deadline: null, ...U.sokolova,
        executor: '', rating: 0, createdAt: ago(130), takenAt: null, finishedAt: null, unread: 1,
        messages: [msg(1, false, U.sokolova.applicant, 'Добавлю: приказ о переводе от 14-го числа, могу прислать.', 95)],
    },
    {
        id: 103, name: 'Ошибка при загрузке фото в телефонный справочник', section: 'Телефонный справочник', statusId: STATUS_IN_WORK,
        description: 'Фото сотрудника весом около 8 МБ не загружается, пишет «Ошибка сервера».',
        link: 'https://portal.example.ru/phone-book', deadline: ago(-60 * 6), ...U.petrov,
        executor: EX[0], rating: 0, createdAt: ago(60 * 5), takenAt: ago(60 * 4 + 30), finishedAt: null, unread: 2,
        messages: [
            msg(1, true, EX[0], 'Добрый день! Взял в работу. Подскажите, в каком формате файл?', 60 * 4 + 25),
            msg(2, false, U.petrov.applicant, 'JPG, снимали на телефон.', 60 * 4),
            msg(3, true, EX[0], 'Понял, проблема в лимите размера. Пока сожмите фото до 2 МБ, лимит поднимем на этой неделе.', 60 * 3),
            msg(4, false, U.petrov.applicant, 'Сжал — загрузилось, спасибо. Но лимит всё же стоит поднять.', 25),
        ],
    },
    {
        id: 104, name: 'Неверная сумма в итоговой таблице статистики', section: 'Статистика', statusId: STATUS_IN_WORK,
        description: 'В итоговой строке за III квартал сумма не совпадает с суммой по муниципальным образованиям (расхождение 120).',
        link: 'https://portal.example.ru/statistics', deadline: ago(-60 * 30), ...U.ivanova,
        executor: EX[1], rating: 0, createdAt: ago(60 * 26), takenAt: ago(60 * 25), finishedAt: null, unread: 0,
        messages: [
            msg(1, true, EX[1], 'Здравствуйте! Проверяю формулу итога, вернусь с ответом сегодня.', 60 * 24),
        ],
    },
    {
        id: 105, name: 'Не приходят уведомления о новых опросах', section: 'Опросы', statusId: STATUS_IN_WORK,
        description: 'Колокольчик в шапке всегда пустой, хотя коллеги видят новые опросы.',
        link: '', deadline: null, ...U.kuznetsov,
        executor: EX[2], rating: 0, createdAt: ago(60 * 52), takenAt: ago(60 * 50), finishedAt: null, unread: 0,
        messages: [
            msg(1, true, EX[2], 'Принял. Похоже на кэш уведомлений, сбросим на стороне сервера.', 60 * 49),
        ],
    },
    {
        id: 106, name: 'Опечатка в названии управления на главной', section: 'Главная', statusId: STATUS_DONE,
        description: 'В блоке «Структура» написано «Управление образовния».',
        link: 'https://portal.example.ru/', deadline: null, ...U.petrov,
        executor: EX[1], rating: 5, createdAt: ago(60 * 24 * 3), takenAt: ago(60 * 24 * 3 - 20), finishedAt: ago(60 * 24 * 3 - 55), unread: 0,
        messages: [
            msg(1, true, EX[1], 'Исправила, обновите страницу.', 60 * 24 * 3 - 50),
            msg(2, false, U.petrov.applicant, 'Всё верно, спасибо!', 60 * 24 * 3 - 60),
        ],
    },
    {
        id: 107, name: 'Календарь совещаний показывает чужие встречи', section: 'Календарь совещаний', statusId: STATUS_DONE,
        description: 'В моём календаре отображаются совещания другого отдела.',
        link: 'https://portal.example.ru/meeting-calendar', deadline: null, ...U.sokolova,
        executor: EX[0], rating: 4, createdAt: ago(60 * 24 * 5), takenAt: ago(60 * 24 * 5 - 45), finishedAt: ago(60 * 24 * 5 - 60 * 5), unread: 0,
        messages: [
            msg(1, true, EX[0], 'Нашёл причину: был включён фильтр «Все отделы». Сбросил настройки, теперь всё корректно.', 60 * 24 * 5 - 60 * 5),
        ],
    },
    {
        id: 108, name: 'Выгрузка в Excel обрезает русские буквы', section: 'Ежедневный рапорт', statusId: STATUS_DONE,
        description: 'В файле вместо кириллицы «крякозябры».',
        link: '', deadline: null, ...U.kuznetsov,
        executor: EX[2], rating: 5, createdAt: ago(60 * 24 * 8), takenAt: ago(60 * 24 * 8 - 15), finishedAt: ago(60 * 24 * 8 - 60 * 2), unread: 0,
        messages: [
            msg(1, true, EX[2], 'Кодировка выгрузки исправлена на UTF-8 с BOM, проверьте, пожалуйста.', 60 * 24 * 8 - 60 * 2),
        ],
    },
    {
        id: 109, name: 'Просьба добавить тёмную тему для мобильной версии', section: 'Другое', statusId: STATUS_REJECTED,
        description: 'Было бы удобнее читать вечером с телефона.',
        link: '', deadline: null, ...U.ivanova,
        executor: EX[0], rating: 0, createdAt: ago(60 * 24 * 6), takenAt: null, finishedAt: null, unread: 0,
        messages: [
            msg(1, true, EX[0], 'Отказ: это пожелание, а не неисправность. Передали в «Предложения сотрудников».', 60 * 24 * 6 - 30),
        ],
    },
    {
        id: 110, name: 'Сломалась ссылка на инструкцию в «Информационных материалах»', section: 'Информационные материалы', statusId: STATUS_DONE,
        description: 'Инструкция по заполнению рапорта отдаёт 404.',
        link: 'https://portal.example.ru/materials', deadline: null, ...U.gus,
        executor: EX[1], rating: 0, createdAt: ago(60 * 24 * 2), takenAt: ago(60 * 24 * 2 - 30), finishedAt: ago(60 * 24 * 2 - 90), unread: 0,
        messages: [
            msg(1, true, EX[1], 'Файл был перенесён, ссылку обновили. Заявка выполнена — оцените, пожалуйста, работу поддержки.', 60 * 24 * 2 - 90),
        ],
    },
    {
        id: 111, name: 'Не сохраняются настройки фильтра в рейтинге филиалов', section: 'Рейтинг филиалов', statusId: STATUS_IN_WORK,
        description: 'Каждый раз приходится заново выбирать период и показатели.',
        link: 'https://portal.example.ru/branch-rating', deadline: null, ...U.gus,
        executor: EX[2], rating: 0, createdAt: ago(60 * 7), takenAt: ago(60 * 6), finishedAt: null, unread: 1,
        messages: [
            msg(1, true, EX[2], 'Воспроизвёл, ищу причину. Напишу, как будет готово.', 60 * 5),
            msg(2, true, EX[2], 'Нужна ещё минута — проверяю на разных браузерах.', 40),
        ],
    },
]
