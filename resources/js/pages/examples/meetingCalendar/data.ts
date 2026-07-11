// ── Вымышленная организация ──────────────────────────────────────────────
// Администрация Заречного муниципального округа, приёмная главы округа.
// Все имена, номера и адреса вымышлены — интерактивный пример вёрстки.

export const ORG_NAME = 'Приёмная главы Заречного муниципального округа'

// ── Типы ───────────────────────────────────────────────────────────────────

export type MeetingStatus = 'scheduled' | 'cancelled' | 'rescheduled'

export interface Meeting {
    id: number
    date: string // YYYY-MM-DD
    timeStart: string // HH:MM
    timeEnd: string // HH:MM
    topic: string
    organizer: string
    place: string
    notify: boolean
    departments: string[] // id из DEPARTMENTS
    status: MeetingStatus
    cancelReason?: string
    originalDate?: string
    originalTime?: string
}

export interface Department {
    id: string
    name: string
    contact: string
    phone: string
    email: string
}

export type DirectoryCategory = 'room' | 'office' | 'agency'

export interface DirectoryEntry {
    id: string
    category: DirectoryCategory
    name: string
    detail: string
    phone: string
}

// ── Справочник подразделений (для рассылки уведомлений) ─────────────────────

export const DEPARTMENTS: Department[] = [
    { id: 'fin', name: 'Финансовое управление', contact: 'Игнатьева Т.В.', phone: 'доб. 141', email: 'finupr@zarechny.local' },
    { id: 'gkh', name: 'Отдел ЖКХ и благоустройства', contact: 'Мартынов С.А.', phone: 'доб. 118', email: 'gkh@zarechny.local' },
    { id: 'arch', name: 'Отдел архитектуры и градостроительства', contact: 'Белоусова Н.К.', phone: 'доб. 129', email: 'arch@zarechny.local' },
    { id: 'obr', name: 'Управление образования', contact: 'Русакова И.М.', phone: 'доб. 205', email: 'obr@zarechny.local' },
    { id: 'kult', name: 'Отдел культуры и молодёжной политики', contact: 'Тихомиров Д.Е.', phone: 'доб. 233', email: 'kultura@zarechny.local' },
    { id: 'soc', name: 'Управление социальной защиты', contact: 'Фадеева Л.Г.', phone: 'доб. 147', email: 'soc@zarechny.local' },
    { id: 'legal', name: 'Юридический отдел', contact: 'Крамарёв П.П.', phone: 'доб. 112', email: 'legal@zarechny.local' },
    { id: 'zakup', name: 'Отдел закупок', contact: 'Северинова Ю.А.', phone: 'доб. 156', email: 'zakupki@zarechny.local' },
    { id: 'gochs', name: 'Отдел ГО и ЧС', contact: 'Волошин А.Н.', phone: 'доб. 199', email: 'go-chs@zarechny.local' },
    { id: 'press', name: 'Пресс-служба', contact: 'Ерохина В.С.', phone: 'доб. 101', email: 'press@zarechny.local' },
]

// ── Адресная книга приёмной (боковая панель) ─────────────────────────────────

export const DIRECTORY: DirectoryEntry[] = [
    { id: 'r1', category: 'room', name: 'Малый зал', detail: 'каб. 214, 2 этаж · 12 мест', phone: 'доб. 214' },
    { id: 'r2', category: 'room', name: 'Большой (актовый) зал', detail: '1 этаж · 80 мест', phone: 'доб. 105' },
    { id: 'r3', category: 'room', name: 'Переговорная главы', detail: 'каб. 301, 3 этаж · 8 мест', phone: 'доб. 301' },
    { id: 'o1', category: 'office', name: 'Приёмная главы округа', detail: 'Соболев В.Н.', phone: 'доб. 100' },
    { id: 'o2', category: 'office', name: 'Приёмная 1-го заместителя', detail: 'Крылова А.П.', phone: 'доб. 102' },
    { id: 'o3', category: 'office', name: 'Приёмная зам. по ЖКХ', detail: 'Дементьев О.И.', phone: 'доб. 118' },
    { id: 'a1', category: 'agency', name: 'Прокуратура округа', detail: 'надзорное производство', phone: '8 (49631) 2-14-07' },
    { id: 'a2', category: 'agency', name: 'ОМВД по Заречному округу', detail: 'дежурная часть', phone: '8 (49631) 2-02-02' },
    { id: 'a3', category: 'agency', name: 'Роспотребнадзор', detail: 'территориальный отдел', phone: '8 (49631) 2-30-45' },
]

export const DIRECTORY_LABELS: Record<DirectoryCategory, string> = {
    room: 'Переговорные',
    office: 'Приёмные руководителей',
    agency: 'Внешние ведомства',
}

// ── Вспомогательные функции ──────────────────────────────────────────────

export function formatDate(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatWeekday(dateStr: string) {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('ru-RU', { weekday: 'long' })
}

export function departmentsEnding(count: number) {
    if (count % 10 === 1 && count % 100 !== 11) return 'ение'
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return 'ения'
    return 'ений'
}

export const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

let nextId = 1000

export function makeMeetingId() {
    return nextId++
}

// ── Вымышленный график совещаний (июнь–август 2026) ──────────────────────

export const INITIAL_MEETINGS: Meeting[] = [
    { id: 1, date: '2026-06-18', timeStart: '10:00', timeEnd: '11:00', topic: 'Подготовка округа к отопительному сезону', organizer: 'Дементьев О.И., заместитель главы по ЖКХ', place: 'Малый зал, каб. 214', notify: true, departments: ['gkh', 'zakup'], status: 'scheduled' },
    { id: 2, date: '2026-06-24', timeStart: '14:00', timeEnd: '15:30', topic: 'Исполнение бюджета округа за I полугодие', organizer: 'Соболев В.Н., глава округа', place: 'Переговорная главы, каб. 301', notify: true, departments: ['fin', 'legal'], status: 'scheduled' },
    { id: 3, date: '2026-06-29', timeStart: '11:00', timeEnd: '12:00', topic: 'Приёмка отремонтированных дворовых территорий', organizer: 'Мартынов С.А., начальник отдела ЖКХ', place: 'Большой (актовый) зал', notify: false, departments: [], status: 'cancelled', cancelReason: 'Перенос сроков подрядчиком' },

    { id: 4, date: '2026-07-01', timeStart: '09:30', timeEnd: '10:30', topic: 'Оперативное совещание при главе округа', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 5, date: '2026-07-01', timeStart: '15:00', timeEnd: '16:00', topic: 'Комиссия по делам несовершеннолетних', organizer: 'Фадеева Л.Г., управление соцзащиты', place: 'Переговорная главы, каб. 301', notify: true, departments: ['soc', 'obr'], status: 'scheduled' },
    { id: 6, date: '2026-07-03', timeStart: '10:00', timeEnd: '11:00', topic: 'Готовность школ округа к новому учебному году', organizer: 'Русакова И.М., управление образования', place: 'Малый зал, каб. 214', notify: true, departments: ['obr', 'gkh', 'gochs'], status: 'scheduled' },
    { id: 7, date: '2026-07-06', timeStart: '11:00', timeEnd: '12:30', topic: 'Рассмотрение обращений граждан за июнь', organizer: 'Крылова А.П., первый заместитель главы', place: 'Приёмная 1-го заместителя', notify: false, departments: [], status: 'scheduled' },
    { id: 8, date: '2026-07-07', timeStart: '09:00', timeEnd: '10:00', topic: 'Оперативное совещание при главе округа', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 9, date: '2026-07-08', timeStart: '13:00', timeEnd: '14:00', topic: 'Согласование схемы размещения нестационарных объектов', organizer: 'Белоусова Н.К., отдел архитектуры', place: 'Переговорная главы, каб. 301', notify: true, departments: ['arch', 'legal'], status: 'rescheduled', originalDate: '2026-07-05', originalTime: '13:00' },
    { id: 10, date: '2026-07-09', timeStart: '10:00', timeEnd: '11:00', topic: 'Итоги закупочных процедур II квартала', organizer: 'Северинова Ю.А., отдел закупок', place: 'Малый зал, каб. 214', notify: true, departments: ['zakup', 'fin', 'legal'], status: 'scheduled' },
    { id: 11, date: '2026-07-10', timeStart: '11:30', timeEnd: '12:30', topic: 'Подготовка Дня города: концертная программа', organizer: 'Тихомиров Д.Е., отдел культуры', place: 'Большой (актовый) зал', notify: true, departments: ['kult', 'press', 'gochs'], status: 'scheduled' },

    { id: 12, date: '2026-07-13', timeStart: '09:30', timeEnd: '10:30', topic: 'Еженедельное аппаратное совещание', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 13, date: '2026-07-13', timeStart: '14:00', timeEnd: '15:00', topic: 'Взаимодействие с Роспотребнадзором по летним лагерям', organizer: 'Русакова И.М., управление образования', place: 'Переговорная главы, каб. 301', notify: false, departments: [], status: 'scheduled' },
    { id: 14, date: '2026-07-14', timeStart: '10:00', timeEnd: '11:00', topic: 'Ход исполнения предписаний прокуратуры', organizer: 'Крамарёв П.П., юридический отдел', place: 'Приёмная главы округа', notify: true, departments: ['legal', 'gkh'], status: 'scheduled' },
    { id: 15, date: '2026-07-15', timeStart: '11:00', timeEnd: '12:00', topic: 'Координационный совет по благоустройству', organizer: 'Дементьев О.И., заместитель главы по ЖКХ', place: 'Большой (актовый) зал', notify: true, departments: ['gkh', 'arch', 'zakup'], status: 'scheduled' },
    { id: 16, date: '2026-07-16', timeStart: '13:30', timeEnd: '14:30', topic: 'Отчёт пресс-службы о медиаактивности округа', organizer: 'Ерохина В.С., пресс-служба', place: 'Приёмная главы округа', notify: false, departments: [], status: 'cancelled', cancelReason: 'Глава округа в командировке' },
    { id: 17, date: '2026-07-17', timeStart: '09:00', timeEnd: '10:00', topic: 'Готовность к пожароопасному периоду', organizer: 'Волошин А.Н., отдел ГО и ЧС', place: 'Малый зал, каб. 214', notify: true, departments: ['gochs', 'gkh'], status: 'scheduled' },

    { id: 18, date: '2026-07-20', timeStart: '09:30', timeEnd: '10:30', topic: 'Еженедельное аппаратное совещание', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 19, date: '2026-07-22', timeStart: '11:00', timeEnd: '12:00', topic: 'Рассмотрение жалоб на качество дорог', organizer: 'Мартынов С.А., начальник отдела ЖКХ', place: 'Переговорная главы, каб. 301', notify: true, departments: ['gkh', 'legal'], status: 'scheduled' },
    { id: 20, date: '2026-07-23', timeStart: '14:00', timeEnd: '15:00', topic: 'Приём предпринимателей по вопросам аренды', organizer: 'Крылова А.П., первый заместитель главы', place: 'Приёмная 1-го заместителя', notify: false, departments: [], status: 'scheduled' },
    { id: 21, date: '2026-07-27', timeStart: '09:30', timeEnd: '10:30', topic: 'Еженедельное аппаратное совещание', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 22, date: '2026-07-29', timeStart: '10:00', timeEnd: '11:30', topic: 'Итоги месячника по благоустройству дворов', organizer: 'Дементьев О.И., заместитель главы по ЖКХ', place: 'Большой (актовый) зал', notify: true, departments: ['gkh', 'press'], status: 'scheduled' },

    { id: 23, date: '2026-08-04', timeStart: '09:30', timeEnd: '10:30', topic: 'Еженедельное аппаратное совещание', organizer: 'Соболев В.Н., глава округа', place: 'Малый зал, каб. 214', notify: true, departments: ['fin', 'gkh', 'obr', 'soc', 'press'], status: 'scheduled' },
    { id: 24, date: '2026-08-12', timeStart: '11:00', timeEnd: '12:00', topic: 'Подготовка проекта бюджета округа на 2027 год', organizer: 'Игнатьева Т.В., финансовое управление', place: 'Переговорная главы, каб. 301', notify: true, departments: ['fin', 'legal', 'zakup'], status: 'scheduled' },
    { id: 25, date: '2026-08-19', timeStart: '10:00', timeEnd: '11:00', topic: 'Готовность образовательных учреждений к 1 сентября', organizer: 'Русакова И.М., управление образования', place: 'Малый зал, каб. 214', notify: true, departments: ['obr', 'gkh', 'gochs'], status: 'scheduled' },
]
