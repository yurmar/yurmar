// ── Вымышленная организация ──────────────────────────────────────────────
// Правительство Заречной области. Все ИОГВ (исполнительные органы
// государственной власти), мероприятия и сотрудники вымышлены — интерактивный
// пример вёрстки раздела «Сводный план».

export type AuthorityType = 1 | 2 | 3 | 4 | 10

export interface Authority {
    id: number
    name: string
    type: AuthorityType
}

export interface Responsible {
    id: number
    authorityId: number
    name: string
    position: string
    phone: string
    email: string
}

export interface PlanEvent {
    id: number
    authorityId: number
    title: string
    description: string
    dateFrom: string // YYYY-MM-DD
    dateTo: string
    address: string
    place: string
    timeFrom: string
    timeTo: string
    responsible: string
    createdAt: string // ISO
    updatedAt: string // ISO
}

/** Отметка «Нет мероприятий» за месяц */
export interface NoEventMark {
    authorityId: number
    month: number
    year: number
    createdAt: string
}

export interface MonthRef {
    month: number
    year: number
}

export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export const TYPE_TABS: { id: AuthorityType; name: string }[] = [
    { id: 1, name: 'Отделы' },
    { id: 2, name: 'Службы' },
    { id: 3, name: 'Агентства' },
    { id: 4, name: 'Аппарат' },
    { id: 10, name: 'Северный округ' },
]

export const ORG_NAME = 'Правительство Заречной области'

/** Роль текущего пользователя (переключатель в примере) */
export type Role = 'admin' | 'input' | 'viewer'

/** ИОГВ ответственного за ввод в режиме `input` */
export const MY_AUTHORITY_ID = 1

export const AUTHORITIES: Authority[] = [
    { id: 1, name: 'Отдел здравоохранения', type: 1 },
    { id: 2, name: 'Отдел образования', type: 1 },
    { id: 3, name: 'Отдел культуры', type: 1 },
    { id: 4, name: 'Отдел спорта и молодёжной политики', type: 1 },
    { id: 5, name: 'Финансовый отдел', type: 1 },
    { id: 6, name: 'Отдел сельского хозяйства', type: 1 },
    { id: 7, name: 'Отдел строительства и дорожного хозяйства', type: 1 },
    { id: 8, name: 'Отдел труда и социальной защиты', type: 1 },
    { id: 9, name: 'Служба по охране объектов культурного наследия', type: 2 },
    { id: 10, name: 'Служба ветеринарии', type: 2 },
    { id: 11, name: 'Служба государственного строительного надзора', type: 2 },
    { id: 12, name: 'Служба потребительского рынка', type: 2 },
    { id: 13, name: 'Агентство по туризму', type: 3 },
    { id: 14, name: 'Агентство по информатизации и связи', type: 3 },
    { id: 15, name: 'Агентство лесного хозяйства', type: 3 },
    { id: 16, name: 'Агентство по делам мировых судей', type: 3 },
    { id: 17, name: 'Управление по внутренней политике', type: 4 },
    { id: 18, name: 'Управление региональной безопасности', type: 4 },
    { id: 19, name: 'Правовое управление', type: 4 },
    { id: 20, name: 'Управление пресс-службы', type: 4 },
    { id: 21, name: 'Администрация Северного района', type: 10 },
    { id: 22, name: 'Управление образования Северного района', type: 10 },
    { id: 23, name: 'Управление культуры Северного района', type: 10 },
]

export const authorityName = (id: number) => AUTHORITIES.find(a => a.id === id)?.name ?? '—'

// ── Ответственные за ввод ─────────────────────────────────────────────────

const SURNAMES: [string, string][] = [
    ['Воронцов', 'Воронцова'], ['Белов', 'Белова'], ['Лебедев', 'Лебедева'], ['Крылов', 'Крылова'],
    ['Серов', 'Серова'], ['Морозов', 'Морозова'], ['Фролов', 'Фролова'], ['Ершов', 'Ершова'],
    ['Зуев', 'Зуева'], ['Носков', 'Носкова'],
]
const FIRST_NAMES_M = ['Андрей Викторович', 'Сергей Павлович', 'Игорь Николаевич', 'Максим Олегович']
const FIRST_NAMES_F = ['Елена Сергеевна', 'Ольга Андреевна', 'Наталья Игоревна', 'Мария Павловна']
const POSITIONS = ['Начальник отдела организационной работы', 'Консультант', 'Главный специалист', 'Заместитель руководителя']

/** Ответственные генерируются детерминированно: у ИОГВ №19 их нет, у кратных трём — один */
export const RESPONSIBLES: Responsible[] = AUTHORITIES.flatMap(a => {
    if (a.id === 19) return []
    const count = a.id % 3 === 0 ? 1 : 2
    return Array.from({ length: count }, (_, n) => {
        const female = (a.id + n) % 2 === 0
        const [m, f] = SURNAMES[(a.id * 3 + n * 4) % SURNAMES.length]
        const names = female ? FIRST_NAMES_F : FIRST_NAMES_M
        return {
            id: a.id * 10 + n,
            authorityId: a.id,
            name: `${female ? f : m} ${names[(a.id + n) % names.length]}`,
            position: POSITIONS[(a.id + n * 2) % POSITIONS.length],
            phone: `+7 (3952) 25-${String(a.id).padStart(2, '0')}-${n + 1}0`,
            email: `plan${a.id}-${n + 1}@zarechnaya.example`,
        }
    })
})

// ── Даты ───────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

/** Месяц, на который сейчас собирается план — всегда следующий */
export function planMonth(): MonthRef {
    const now = new Date()
    const m = now.getMonth() + 2
    return m > 12 ? { month: 1, year: now.getFullYear() + 1 } : { month: m, year: now.getFullYear() }
}

export function shiftMonth(base: MonthRef, delta: number): MonthRef {
    const idx = base.year * 12 + (base.month - 1) + delta
    return { year: Math.floor(idx / 12), month: (idx % 12) + 1 }
}

export const sameMonth = (a: MonthRef, b: MonthRef) => a.month === b.month && a.year === b.year

export const toYmd = (ref: MonthRef, day: number) => `${ref.year}-${pad(ref.month)}-${pad(day)}`

export const daysInMonth = (ref: MonthRef) => new Date(ref.year, ref.month, 0).getDate()

export const eventMonth = (e: PlanEvent): MonthRef => {
    const [y, m] = e.dateFrom.split('-').map(Number)
    return { year: y, month: m }
}

/** YYYY-MM-DD → ДД.ММ.ГГГГ */
export const formatYmd = (ymd: string) => {
    const p = ymd.split('-')
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}` : ymd
}

export const formatDay = (iso: string) => {
    const d = new Date(iso)
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export const formatTime = (iso: string) => {
    const d = new Date(iso)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const formatDateTime = (iso: string) => `${formatDay(iso)} ${formatTime(iso)}`

export const monthLabel = (ref: MonthRef) => `${MONTH_NAMES[ref.month - 1]} ${ref.year}`

export const daysWord = (n: number) => {
    const a = Math.abs(n)
    if (a % 10 === 1 && a % 100 !== 11) return 'день'
    if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) return 'дня'
    return 'дней'
}

export const eventsWord = (n: number) => {
    const a = Math.abs(n)
    if (a % 10 === 1 && a % 100 !== 11) return 'мероприятие'
    if (a % 10 >= 2 && a % 10 <= 4 && (a % 100 < 10 || a % 100 >= 20)) return 'мероприятия'
    return 'мероприятий'
}

/** Приём данных закрывается 25 числа текущего месяца */
export function deadlineInfo(): { text: string; type: 'normal' | 'warning' | 'urgent' | 'closed' } {
    const now = new Date()
    const day = now.getDate()
    const left = 25 - day
    if (day > 25) return { text: 'Заполнение данных недоступно (после 25 числа)', type: 'closed' }
    if (day === 25) return { text: 'Сегодня последний день заполнения данных!', type: 'urgent' }
    if (left === 1) return { text: 'Остался 1 день до закрытия приёма данных (25 число)', type: 'urgent' }
    return {
        text: `Осталось ${left} ${daysWord(left)} до закрытия приёма данных (25 число)`,
        type: left <= 3 ? 'warning' : 'normal',
    }
}

// ── Начальные данные ───────────────────────────────────────────────────────

interface Seed {
    a: number // ИОГВ
    m: 0 | -1 | -2 | -3 // месяц относительно планового
    d: number // день начала
    dTo?: number
    tf?: string
    tt?: string
    title: string
    place: string
    address?: string
    resp: string
    desc?: string
}

const SEEDS: Seed[] = [
    // ── плановый месяц ──
    { a: 1, m: 0, d: 3, tf: '10:00', tt: '12:00', title: 'Форум «Здоровая область»', place: 'Дворец спорта «Заречье»', address: 'г. Заречный, ул. Победы, 12', resp: 'Воронцова Елена Сергеевна', desc: 'Ежегодный форум для жителей: профилактические осмотры, лекции врачей, бесплатная диспансеризация.' },
    { a: 1, m: 0, d: 14, tf: '09:00', tt: '13:00', title: 'День открытых дверей областной больницы', place: 'Областная клиническая больница', address: 'г. Заречный, ул. Больничная, 1', resp: 'Белов Сергей Павлович', desc: 'Экскурсии по отделениям и консультации специалистов.' },
    { a: 1, m: 0, d: 24, dTo: 26, title: 'Выездная диспансеризация в сельских территориях', place: 'Сельские поселения Северного района', resp: 'Воронцова Елена Сергеевна' },
    { a: 2, m: 0, d: 5, tf: '11:00', tt: '15:00', title: 'Августовская педагогическая конференция', place: 'Концертный зал филармонии', address: 'г. Заречный, пр. Мира, 7', resp: 'Лебедев Игорь Николаевич', desc: 'Итоги учебного года, обсуждение задач на новый период, награждение лучших учителей.' },
    { a: 2, m: 0, d: 17, title: 'Областной слёт школьных лесничеств', place: 'Эколого-биологический центр', address: 'г. Заречный, ул. Лесная, 21', resp: 'Крылова Мария Павловна', tf: '10:00', tt: '16:00' },
    { a: 2, m: 0, d: 28, tf: '12:00', title: 'Родительское собрание «Профориентация 9-классников»', place: 'Школа №14', address: 'г. Заречный, ул. Школьная, 3', resp: 'Серов Максим Олегович' },
    { a: 3, m: 0, d: 8, dTo: 10, title: 'Фестиваль народного творчества «Заречные перекрёстки»', place: 'Городской парк культуры', address: 'г. Заречный, ул. Парковая, 1', resp: 'Морозова Наталья Игоревна', desc: 'Три дня концертов, ярмарок и мастер-классов; участвуют коллективы из всех районов области.' },
    { a: 3, m: 0, d: 20, tf: '18:30', tt: '20:30', title: 'Открытие театрального сезона', place: 'Драматический театр', address: 'г. Заречный, пл. Театральная, 2', resp: 'Фролов Андрей Викторович' },
    { a: 4, m: 0, d: 6, tf: '10:00', tt: '14:00', title: 'Областная спартакиада трудовых коллективов', place: 'Стадион «Динамо»', address: 'г. Заречный, ул. Спортивная, 5', resp: 'Ершова Ольга Андреевна', desc: 'Команды ИОГВ и подведомственных учреждений в пяти дисциплинах.' },
    { a: 4, m: 0, d: 21, tf: '16:00', tt: '19:00', title: 'Молодёжный форум «Старт»', place: 'Молодёжный центр', address: 'г. Заречный, ул. Юности, 18', resp: 'Зуев Игорь Николаевич' },
    { a: 5, m: 0, d: 11, tf: '15:00', tt: '16:30', title: 'Совещание по исполнению областного бюджета', place: 'Малый зал заседаний Правительства', address: 'г. Заречный, пл. Ленина, 1', resp: 'Носкова Елена Сергеевна' },
    { a: 7, m: 0, d: 12, tf: '11:00', title: 'Торжественное открытие моста через реку Заречную', place: 'Левобережная набережная', resp: 'Белов Сергей Павлович', desc: 'Приглашены руководители области, подрядчики и жители прилегающих микрорайонов.' },
    { a: 7, m: 0, d: 25, tf: '10:00', tt: '12:00', title: 'Выездное совещание по ремонту региональных дорог', place: 'Участок трассы Заречный — Северный', resp: 'Лебедев Игорь Николаевич' },
    { a: 8, m: 0, d: 2, tf: '10:00', tt: '12:00', title: 'Ярмарка вакансий для молодёжи', place: 'Центр занятости населения', address: 'г. Заречный, ул. Труда, 9', resp: 'Крылова Мария Павловна' },
    { a: 8, m: 0, d: 18, dTo: 19, title: 'Выездная школа для социальных работников', place: 'Дом социальных услуг', resp: 'Серова Наталья Игоревна' },
    { a: 9, m: 0, d: 15, tf: '12:00', tt: '14:00', title: 'Экскурсия по объектам деревянного зодчества', place: 'Историческая часть города', resp: 'Морозов Максим Олегович', desc: 'Экскурсия для школьников и студентов в рамках Дня культурного наследия.' },
    { a: 12, m: 0, d: 9, tf: '14:00', tt: '16:00', title: 'Круглый стол «Честная торговля»', place: 'Торгово-промышленная палата', address: 'г. Заречный, ул. Купеческая, 4', resp: 'Фролова Ольга Андреевна' },
    { a: 13, m: 0, d: 4, dTo: 6, title: 'Туристическая выставка «Заречье зовёт»', place: 'Выставочный центр', address: 'г. Заречный, ул. Экспо, 3', resp: 'Ершов Андрей Викторович', desc: 'Стенды районов области, презентации маршрутов, встречи с туроператорами.' },
    { a: 13, m: 0, d: 22, tf: '09:00', tt: '18:00', title: 'Рекламный тур для блогеров по Северному району', place: 'Северный район', resp: 'Зуева Мария Павловна' },
    { a: 15, m: 0, d: 7, tf: '10:00', tt: '13:00', title: 'Акция «Сохраним лес»: высадка саженцев', place: 'Заречное лесничество', resp: 'Носков Сергей Павлович' },
    { a: 16, m: 0, d: 13, tf: '10:00', title: 'Семинар для судей по новым процессуальным нормам', place: 'Областной суд, малый зал', resp: 'Воронцов Игорь Николаевич' },
    { a: 17, m: 0, d: 10, tf: '17:00', tt: '19:00', title: 'Встреча Губернатора с общественными советами', place: 'Актовый зал Правительства', address: 'г. Заречный, пл. Ленина, 1', resp: 'Белова Елена Сергеевна', desc: 'Обсуждение приоритетов развития области, ответы на вопросы.' },
    { a: 17, m: 0, d: 27, title: 'Заседание Общественной палаты', place: 'Общественная палата', resp: 'Лебедева Наталья Игоревна', tf: '15:00', tt: '17:00' },
    { a: 20, m: 0, d: 16, tf: '11:00', tt: '12:30', title: 'Пресс-конференция по итогам квартала', place: 'Пресс-центр Правительства', address: 'г. Заречный, пл. Ленина, 1', resp: 'Крылов Андрей Викторович' },
    { a: 21, m: 0, d: 1, tf: '09:00', tt: '10:00', title: 'Торжественная линейка к Дню знаний', place: 'Центральная площадь районного центра', resp: 'Серова Ольга Андреевна' },
    { a: 21, m: 0, d: 19, dTo: 20, title: 'Районный сельскохозяйственный праздник «Урожай»', place: 'Площадь у районного Дома культуры', resp: 'Морозов Максим Олегович', desc: 'Выставка-продажа продукции фермеров, конкурсы, концерт.' },
    { a: 23, m: 0, d: 23, tf: '15:00', tt: '17:00', title: 'Выставка работ народных мастеров', place: 'Районный краеведческий музей', resp: 'Фролова Мария Павловна' },

    // ── прошлые месяцы (архив) ──
    { a: 1, m: -1, d: 10, tf: '10:00', tt: '13:00', title: 'Акция «Узнай своё давление»', place: 'Торговый центр «Заречье»', resp: 'Воронцова Елена Сергеевна' },
    { a: 2, m: -1, d: 3, tf: '09:00', tt: '12:00', title: 'Выпускной бал одарённых школьников', place: 'Дворец культуры', resp: 'Лебедев Игорь Николаевич' },
    { a: 3, m: -1, d: 15, dTo: 17, title: 'Фестиваль «Театр без границ»', place: 'Драматический театр', resp: 'Морозова Наталья Игоревна' },
    { a: 4, m: -1, d: 22, tf: '11:00', tt: '15:00', title: 'Кубок губернатора по лёгкой атлетике', place: 'Стадион «Динамо»', resp: 'Ершова Ольга Андреевна' },
    { a: 7, m: -1, d: 8, tf: '12:00', title: 'Заседание совета по строительству', place: 'Малый зал заседаний Правительства', resp: 'Белов Сергей Павлович' },
    { a: 13, m: -1, d: 18, tf: '10:00', tt: '17:00', title: 'Туристический слёт «Тропа Севера»', place: 'Северный район', resp: 'Ершов Андрей Викторович' },
    { a: 17, m: -1, d: 12, tf: '16:00', title: 'Круглый стол по межнациональным отношениям', place: 'Дом дружбы народов', resp: 'Белова Елена Сергеевна' },
    { a: 20, m: -1, d: 25, tf: '11:00', title: 'Брифинг по подготовке к зиме', place: 'Пресс-центр Правительства', resp: 'Крылов Андрей Викторович' },
    { a: 1, m: -2, d: 5, tf: '10:00', tt: '12:00', title: 'Семинар для главврачей', place: 'Областная больница', resp: 'Белов Сергей Павлович' },
    { a: 2, m: -2, d: 14, title: 'Олимпиада школьников по химии', place: 'Университет', resp: 'Серов Максим Олегович', tf: '10:00', tt: '15:00' },
    { a: 5, m: -2, d: 9, tf: '15:00', title: 'Заседание бюджетной комиссии', place: 'Малый зал заседаний Правительства', resp: 'Носкова Елена Сергеевна' },
    { a: 8, m: -2, d: 20, tf: '10:00', tt: '13:00', title: 'День пожилого человека', place: 'Дом ветеранов', resp: 'Крылова Мария Павловна' },
    { a: 15, m: -2, d: 27, title: 'Субботник в Заречном лесничестве', place: 'Заречное лесничество', resp: 'Носков Сергей Павлович', tf: '09:00', tt: '13:00' },
    { a: 21, m: -2, d: 11, tf: '12:00', title: 'День района', place: 'Центральная площадь районного центра', resp: 'Серова Ольга Андреевна' },
    { a: 3, m: -3, d: 6, tf: '19:00', title: 'Гала-концерт «Звёзды Заречья»', place: 'Филармония', resp: 'Фролов Андрей Викторович' },
    { a: 4, m: -3, d: 19, tf: '10:00', tt: '14:00', title: 'Детская спартакиада', place: 'Дворец спорта «Заречье»', resp: 'Ершова Ольга Андреевна' },
    { a: 12, m: -3, d: 13, tf: '14:00', title: 'Семинар для предпринимателей', place: 'Торгово-промышленная палата', resp: 'Фролова Ольга Андреевна' },
    { a: 16, m: -3, d: 21, tf: '10:00', title: 'Совещание председателей судов', place: 'Областной суд', resp: 'Воронцов Игорь Николаевич' },
    { a: 17, m: -3, d: 28, tf: '16:00', title: 'Встреча с руководителями НКО', place: 'Актовый зал Правительства', resp: 'Лебедева Наталья Игоревна' },
]

/** ИОГВ, у которых в плановом месяце нет мероприятий и они не подали данные */
export const PLAN_NO_EVENTS = [10, 18]

const DAY = 86400000

export function makeInitialEvents(): PlanEvent[] {
    const plan = planMonth()
    const now = Date.now()
    return SEEDS.map((s, i): PlanEvent => {
        const ref = shiftMonth(plan, s.m)
        // плановый месяц заполняют в текущем месяце; архивные — задолго до события
        const created = s.m === 0
            ? now - ((1 + ((i * 7) % 18)) * DAY + ((i * 53) % 600) * 60000)
            : new Date(ref.year, ref.month - 2, 8 + (i % 12), 9 + (i % 8), (i * 11) % 60).getTime()
        const edited = i % 5 === 2 ? Math.min(now - 60000, created + 2 * DAY + 3600000) : created
        return {
            id: i + 1,
            authorityId: s.a,
            title: s.title,
            description: s.desc ?? '',
            dateFrom: toYmd(ref, s.d),
            dateTo: s.dTo ? toYmd(ref, s.dTo) : '',
            address: s.address ?? '',
            place: s.place,
            timeFrom: s.tf ?? '',
            timeTo: s.tt ?? '',
            responsible: s.resp,
            createdAt: new Date(created).toISOString(),
            updatedAt: new Date(edited).toISOString(),
        }
    })
}

export function makeInitialNoEvents(): NoEventMark[] {
    const plan = planMonth()
    const prev = shiftMonth(plan, -1)
    return [
        ...PLAN_NO_EVENTS.map((authorityId, i): NoEventMark => ({
            authorityId, ...plan, createdAt: new Date(Date.now() - (3 + i * 4) * DAY).toISOString(),
        })),
        { authorityId: 9, ...prev, createdAt: new Date(prev.year, prev.month - 2, 12, 11, 20).toISOString() },
    ]
}

export const nextId = (events: PlanEvent[]) => events.reduce((m, e) => Math.max(m, e.id), 0) + 1
