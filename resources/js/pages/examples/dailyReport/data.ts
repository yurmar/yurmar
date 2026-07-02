// ── Типы ───────────────────────────────────────────────────────────────────

export interface StatTrio {
    total: number
    killed: number
    injured: number
}

export interface CrimeStat {
    total: number
    solved: number
    publicPlaces: number
}

export interface ViolationItem {
    locality: string
    reason: string
    reportedAt: string
    responsible: string
    consumers: string
    /** для активных — ориентир устранения; для устранённых — фактическая дата/время */
    date: string
    enterprise?: string
}

export interface UtilityBlock {
    current: ViolationItem[]
    eliminated: ViolationItem[]
}

export interface Weather {
    tempMin: number
    tempMax: number
    condition: string
    wind: number
    precipitation: number
}

export interface DailyReport {
    id: number
    date: string // YYYY-MM-DD
    traffic: StatTrio
    fires: StatTrio
    crimes: CrimeStat
    calls112: number
    utilities: {
        electricity: UtilityBlock
        water: UtilityBlock
        gas: UtilityBlock
        heat: UtilityBlock
    }
    weather: Weather
    note?: string
}

// ── Вспомогательное ───────────────────────────────────────────────────────

export const UTILITY_LABELS: Record<keyof DailyReport['utilities'], string> = {
    electricity: 'Электроснабжение',
    water: 'Водоснабжение',
    gas: 'Газоснабжение',
    heat: 'Горячее водоснабжение',
}

export function formatDate(iso: string) {
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
}

export function formatWeekday(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'long' })
}

export function fireCalloutRows(fires: StatTrio, traffic: StatTrio) {
    const garbage = Math.max(1, Math.round(fires.total * 0.3))
    const shortCircuit = Math.max(0, Math.round(fires.total * 0.2))
    const falseAlarms = Math.max(1, Math.round(fires.total * 0.6))
    const total = fires.total + traffic.total + garbage + shortCircuit + falseAlarms
    return [
        { label: 'Пожары всего', value: fires.total },
        { label: '— горение мусора', value: garbage, sub: true },
        { label: 'ДТП (выезды)', value: traffic.total },
        { label: 'Короткое замыкание', value: shortCircuit },
        { label: 'Ложные вызовы', value: falseAlarms },
        { label: 'Итого выездов', value: total, bold: true },
    ]
}

// ── Выдуманные данные на неделю ──────────────────────────────────────────
// Сквозной сюжет: авария на ВЛ в Сосновке (устранена день 3), порыв
// водовода в Дубровино (устранён день 4), утечка газа в Заречном
// (устранена день 4), отключение ГВС в Ясногорске из-за грозы,
// растянутое на несколько дней и устранённое только в последнем рапорте.

const EMPTY_UTIL: UtilityBlock = { current: [], eliminated: [] }

export const REPORTS: DailyReport[] = [
    {
        id: 1,
        date: '2026-06-26',
        traffic: { total: 6, killed: 0, injured: 7 },
        fires: { total: 3, killed: 0, injured: 0 },
        crimes: { total: 24, solved: 17, publicPlaces: 6 },
        calls112: 942,
        weather: { tempMin: 14, tempMax: 24, condition: 'Ясно', wind: 3, precipitation: 0 },
        utilities: {
            water: EMPTY_UTIL,
            gas: EMPTY_UTIL,
            heat: EMPTY_UTIL,
            electricity: {
                current: [{
                    locality: 'п. Сосновка',
                    reason: 'Обрыв провода на опоре ВЛ-0.4 кВ',
                    reportedAt: '26.06.2026 07:40',
                    responsible: 'РЭС «Северные сети», бригада №3',
                    consumers: '2 дома / 6 чел.',
                    date: '26.06.2026 18:00 (ориентир)',
                }],
                eliminated: [],
            },
        },
    },
    {
        id: 2,
        date: '2026-06-27',
        traffic: { total: 11, killed: 1, injured: 14 },
        fires: { total: 5, killed: 0, injured: 1 },
        crimes: { total: 31, solved: 19, publicPlaces: 9 },
        calls112: 1284,
        weather: { tempMin: 16, tempMax: 27, condition: 'Переменная облачность', wind: 4, precipitation: 10 },
        note: 'Рост числа ДТП связан с выходным днём и увеличением трафика на трассах региона.',
        utilities: {
            electricity: {
                current: [{
                    locality: 'п. Сосновка',
                    reason: 'Обрыв провода на опоре ВЛ-0.4 кВ',
                    reportedAt: '26.06.2026 07:40',
                    responsible: 'РЭС «Северные сети», бригада №3',
                    consumers: '2 дома / 6 чел.',
                    date: '27.06.2026 12:00 (ориентир)',
                }],
                eliminated: [],
            },
            water: {
                current: [{
                    locality: 'с. Дубровино',
                    reason: 'Порыв на магистральном водоводе',
                    reportedAt: '27.06.2026 09:10',
                    responsible: 'МУП «Водоканал»',
                    consumers: '96 абонентов',
                    date: '28.06.2026 14:00 (ориентир)',
                }],
                eliminated: [],
            },
            gas: EMPTY_UTIL,
            heat: EMPTY_UTIL,
        },
    },
    {
        id: 3,
        date: '2026-06-28',
        traffic: { total: 9, killed: 0, injured: 10 },
        fires: { total: 4, killed: 0, injured: 0 },
        crimes: { total: 27, solved: 18, publicPlaces: 7 },
        calls112: 1156,
        weather: { tempMin: 17, tempMax: 26, condition: 'Переменная облачность', wind: 5, precipitation: 20 },
        utilities: {
            electricity: {
                current: [],
                eliminated: [{
                    locality: 'п. Сосновка',
                    reason: 'Обрыв провода на опоре ВЛ-0.4 кВ',
                    reportedAt: '26.06.2026 07:40',
                    responsible: 'РЭС «Северные сети», бригада №3',
                    consumers: '2 дома / 6 чел.',
                    date: '28.06.2026 02:15',
                    enterprise: 'РЭС «Северные сети»',
                }],
            },
            water: {
                current: [{
                    locality: 'с. Дубровино',
                    reason: 'Порыв на магистральном водоводе',
                    reportedAt: '27.06.2026 09:10',
                    responsible: 'МУП «Водоканал»',
                    consumers: '96 абонентов',
                    date: '28.06.2026 20:00 (ориентир)',
                }],
                eliminated: [],
            },
            gas: {
                current: [{
                    locality: 'г. Заречный',
                    reason: 'Утечка бытового газа в жилом доме №14',
                    reportedAt: '28.06.2026 16:45',
                    responsible: 'АО «Газ-Сервис», аварийная служба',
                    consumers: '1 дом, рядом СЗО — детский сад №4',
                    date: '28.06.2026 20:30 (ориентир)',
                }],
                eliminated: [],
            },
            heat: EMPTY_UTIL,
        },
    },
    {
        id: 4,
        date: '2026-06-29',
        traffic: { total: 5, killed: 0, injured: 6 },
        fires: { total: 2, killed: 0, injured: 0 },
        crimes: { total: 19, solved: 15, publicPlaces: 4 },
        calls112: 861,
        weather: { tempMin: 15, tempMax: 22, condition: 'Пасмурно', wind: 6, precipitation: 60 },
        utilities: {
            electricity: EMPTY_UTIL,
            water: {
                current: [],
                eliminated: [{
                    locality: 'с. Дубровино',
                    reason: 'Порыв на магистральном водоводе',
                    reportedAt: '27.06.2026 09:10',
                    responsible: 'МУП «Водоканал»',
                    consumers: '96 абонентов',
                    date: '29.06.2026 11:05',
                    enterprise: 'МУП «Водоканал»',
                }],
            },
            gas: {
                current: [],
                eliminated: [{
                    locality: 'г. Заречный',
                    reason: 'Утечка бытового газа в жилом доме №14',
                    reportedAt: '28.06.2026 16:45',
                    responsible: 'АО «Газ-Сервис», аварийная служба',
                    consumers: '1 дом, рядом СЗО — детский сад №4',
                    date: '28.06.2026 21:10',
                    enterprise: 'АО «Газ-Сервис»',
                }],
            },
            heat: {
                current: [{
                    locality: 'пгт Ясногорск',
                    reason: 'Внеплановая задержка ремонта теплотрассы перед началом отопительного сезона',
                    reportedAt: '29.06.2026 06:00',
                    responsible: 'ТСК «Тепло-Сервис»',
                    consumers: '340 абонентов',
                    date: '02.07.2026 08:00 (ориентир)',
                }],
                eliminated: [],
            },
        },
    },
    {
        id: 5,
        date: '2026-06-30',
        traffic: { total: 7, killed: 1, injured: 9 },
        fires: { total: 6, killed: 0, injured: 1 },
        crimes: { total: 22, solved: 16, publicPlaces: 5 },
        calls112: 1030,
        weather: { tempMin: 13, tempMax: 19, condition: 'Гроза', wind: 9, precipitation: 85 },
        note: 'Рост числа пожаров связан с грозовым фронтом, прошедшим через регион в вечерние часы.',
        utilities: {
            electricity: {
                current: [{
                    locality: 'д. Каменка',
                    reason: 'Повреждение ЛЭП после грозового фронта',
                    reportedAt: '30.06.2026 19:20',
                    responsible: 'РЭС «Северные сети», аварийная бригада',
                    consumers: '14 домов / 38 чел., 1 СЗО (ФАП)',
                    date: '01.07.2026 09:00 (ориентир)',
                }],
                eliminated: [],
            },
            water: EMPTY_UTIL,
            gas: EMPTY_UTIL,
            heat: {
                current: [{
                    locality: 'пгт Ясногорск',
                    reason: 'Внеплановая задержка ремонта теплотрассы перед началом отопительного сезона',
                    reportedAt: '29.06.2026 06:00',
                    responsible: 'ТСК «Тепло-Сервис»',
                    consumers: '340 абонентов',
                    date: '02.07.2026 08:00 (ориентир)',
                }],
                eliminated: [],
            },
        },
    },
    {
        id: 6,
        date: '2026-07-01',
        traffic: { total: 4, killed: 0, injured: 5 },
        fires: { total: 3, killed: 0, injured: 0 },
        crimes: { total: 20, solved: 14, publicPlaces: 5 },
        calls112: 878,
        weather: { tempMin: 14, tempMax: 21, condition: 'Малооблачно', wind: 4, precipitation: 15 },
        utilities: {
            electricity: {
                current: [{
                    locality: 'д. Каменка',
                    reason: 'Повреждение ЛЭП после грозового фронта',
                    reportedAt: '30.06.2026 19:20',
                    responsible: 'РЭС «Северные сети», аварийная бригада',
                    consumers: '14 домов / 38 чел., 1 СЗО (ФАП)',
                    date: '01.07.2026 21:00 (ориентир)',
                }],
                eliminated: [],
            },
            water: EMPTY_UTIL,
            gas: EMPTY_UTIL,
            heat: {
                current: [{
                    locality: 'пгт Ясногорск',
                    reason: 'Внеплановая задержка ремонта теплотрассы перед началом отопительного сезона',
                    reportedAt: '29.06.2026 06:00',
                    responsible: 'ТСК «Тепло-Сервис»',
                    consumers: '340 абонентов',
                    date: '02.07.2026 08:00 (ориентир)',
                }],
                eliminated: [],
            },
        },
    },
    {
        id: 7,
        date: '2026-07-02',
        traffic: { total: 6, killed: 0, injured: 8 },
        fires: { total: 4, killed: 0, injured: 0 },
        crimes: { total: 23, solved: 16, publicPlaces: 6 },
        calls112: 967,
        weather: { tempMin: 16, tempMax: 25, condition: 'Ясно', wind: 3, precipitation: 5 },
        note: 'Обстановка стабилизировалась, все аварийные ситуации предыдущих суток устранены.',
        utilities: {
            electricity: {
                current: [],
                eliminated: [{
                    locality: 'д. Каменка',
                    reason: 'Повреждение ЛЭП после грозового фронта',
                    reportedAt: '30.06.2026 19:20',
                    responsible: 'РЭС «Северные сети», аварийная бригада',
                    consumers: '14 домов / 38 чел., 1 СЗО (ФАП)',
                    date: '01.07.2026 23:40',
                    enterprise: 'РЭС «Северные сети»',
                }],
            },
            water: EMPTY_UTIL,
            gas: EMPTY_UTIL,
            heat: {
                current: [],
                eliminated: [{
                    locality: 'пгт Ясногорск',
                    reason: 'Внеплановая задержка ремонта теплотрассы перед началом отопительного сезона',
                    reportedAt: '29.06.2026 06:00',
                    responsible: 'ТСК «Тепло-Сервис»',
                    consumers: '340 абонентов',
                    date: '02.07.2026 07:20',
                    enterprise: 'ТСК «Тепло-Сервис»',
                }],
            },
        },
    },
]

export function hasActiveIncidents(r: DailyReport) {
    return Object.values(r.utilities).some(u => u.current.length > 0)
}

export function getReport(id: number) {
    return REPORTS.find(r => r.id === id) ?? null
}

export function getPrevReport(id: number) {
    const idx = REPORTS.findIndex(r => r.id === id)
    return idx > 0 ? REPORTS[idx - 1] : null
}
