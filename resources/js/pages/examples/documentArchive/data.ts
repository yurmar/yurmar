// ── Типы ───────────────────────────────────────────────────────────────────

export type FileExt = 'pdf' | 'docx' | 'xlsx' | 'pptx'

export interface ArchiveFile {
    id: number
    name: string
    extension: FileExt
    sizeKb: number
    uploadDate: string // YYYY-MM-DD
    code: string        // архивный шифр, напр. «РП-014»
    url?: string         // blob-url для локально загруженных файлов
}

export type SectionIconKey = 'scroll' | 'signature' | 'terminal' | 'palette' | 'users'

export interface ArchiveSection {
    id: string
    name: string
    description: string
    icon: SectionIconKey
    prefix: string
    files: ArchiveFile[]
}

export interface ReportFile {
    id: number
    name: string
    year: number
    month: number // 1-12
    date: string  // YYYY-MM-DD
    sizeKb: number
}

// ── Вспомогательное ──────────────────────────────────────────────────────

export const MONTH_NAMES = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

export function formatSize(kb: number) {
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} МБ`
    return `${kb} КБ`
}

export function formatDate(iso: string) {
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
}

export function isFileNew(uploadDate: string) {
    const diffDays = (Date.now() - new Date(uploadDate + 'T00:00:00').getTime()) / 86_400_000
    return diffDays >= 0 && diffDays < 7
}

export function groupReportsByYear(reports: ReportFile[]) {
    const byYear: Record<number, Record<number, ReportFile[]>> = {}
    for (const r of reports) {
        byYear[r.year] ??= {}
        byYear[r.year][r.month] ??= []
        byYear[r.year][r.month].push(r)
    }
    return byYear
}

// ── Выдуманные разделы и файлы ───────────────────────────────────────────

export const INITIAL_SECTIONS: ArchiveSection[] = [
    {
        id: 'regulations',
        name: 'Регламенты и политики',
        description: 'Внутренние регламенты, положения и политики компании',
        icon: 'scroll',
        prefix: 'РП',
        files: [
            { id: 1, name: 'Регламент документооборота', extension: 'pdf', sizeKb: 842, uploadDate: '2026-02-11', code: 'РП-001' },
            { id: 2, name: 'Политика информационной безопасности', extension: 'pdf', sizeKb: 1360, uploadDate: '2026-01-20', code: 'РП-002' },
            { id: 3, name: 'Положение об удалённой работе', extension: 'docx', sizeKb: 96, uploadDate: '2026-03-04', code: 'РП-003' },
            { id: 4, name: 'Регламент согласования договоров', extension: 'pdf', sizeKb: 610, uploadDate: '2026-04-18', code: 'РП-004' },
            { id: 5, name: 'Кодекс деловой этики', extension: 'pdf', sizeKb: 455, uploadDate: '2026-01-09', code: 'РП-005' },
            { id: 6, name: 'Порядок работы с персональными данными', extension: 'pdf', sizeKb: 728, uploadDate: '2026-07-09', code: 'РП-006' },
            { id: 7, name: 'Регламент реагирования на инциденты', extension: 'docx', sizeKb: 140, uploadDate: '2026-05-22', code: 'РП-007' },
        ],
    },
    {
        id: 'contracts',
        name: 'Шаблоны договоров',
        description: 'Типовые формы договоров, актов и приложений',
        icon: 'signature',
        prefix: 'ДГ',
        files: [
            { id: 8, name: 'Договор оказания услуг (типовой)', extension: 'docx', sizeKb: 88, uploadDate: '2026-01-15', code: 'ДГ-001' },
            { id: 9, name: 'Соглашение о неразглашении (NDA)', extension: 'docx', sizeKb: 64, uploadDate: '2026-02-02', code: 'ДГ-002' },
            { id: 10, name: 'Договор подряда', extension: 'docx', sizeKb: 92, uploadDate: '2026-03-28', code: 'ДГ-003' },
            { id: 11, name: 'Приложение — техническое задание', extension: 'docx', sizeKb: 120, uploadDate: '2026-04-05', code: 'ДГ-004' },
            { id: 12, name: 'Акт выполненных работ (типовой)', extension: 'docx', sizeKb: 54, uploadDate: '2026-05-14', code: 'ДГ-005' },
            { id: 13, name: 'Реестр действующих договоров', extension: 'xlsx', sizeKb: 210, uploadDate: '2026-07-08', code: 'ДГ-006' },
        ],
    },
    {
        id: 'technical',
        name: 'Технические инструкции',
        description: 'Регламенты разработки, деплоя и инфраструктуры',
        icon: 'terminal',
        prefix: 'ТИ',
        files: [
            { id: 14, name: 'Инструкция по деплою продакшена', extension: 'pdf', sizeKb: 310, uploadDate: '2026-02-19', code: 'ТИ-001' },
            { id: 15, name: 'Стандарты код-ревью', extension: 'pdf', sizeKb: 180, uploadDate: '2026-03-11', code: 'ТИ-002' },
            { id: 16, name: 'Регламент CI/CD пайплайна', extension: 'pdf', sizeKb: 265, uploadDate: '2026-04-27', code: 'ТИ-003' },
            { id: 17, name: 'Схема инфраструктуры проекта', extension: 'pdf', sizeKb: 1920, uploadDate: '2026-05-30', code: 'ТИ-004' },
            { id: 18, name: 'Инструкция по резервному копированию', extension: 'pdf', sizeKb: 205, uploadDate: '2026-06-16', code: 'ТИ-005' },
            { id: 19, name: 'Гайд по онбордингу разработчика', extension: 'pdf', sizeKb: 890, uploadDate: '2026-07-10', code: 'ТИ-006' },
            { id: 20, name: 'Чек-лист код-фриза перед релизом', extension: 'docx', sizeKb: 48, uploadDate: '2026-06-02', code: 'ТИ-007' },
        ],
    },
    {
        id: 'brand',
        name: 'Брендбук и дизайн',
        description: 'Фирменный стиль, шаблоны презентаций и материалы',
        icon: 'palette',
        prefix: 'БР',
        files: [
            { id: 21, name: 'Брендбук компании', extension: 'pdf', sizeKb: 4200, uploadDate: '2026-01-30', code: 'БР-001' },
            { id: 22, name: 'Гайдлайн по цветам и типографике', extension: 'pdf', sizeKb: 980, uploadDate: '2026-02-27', code: 'БР-002' },
            { id: 23, name: 'Презентация о компании', extension: 'pptx', sizeKb: 3640, uploadDate: '2026-04-09', code: 'БР-003' },
            { id: 24, name: 'Шаблон коммерческого предложения', extension: 'pptx', sizeKb: 1520, uploadDate: '2026-05-21', code: 'БР-004' },
            { id: 25, name: 'Фирменные бланки', extension: 'docx', sizeKb: 310, uploadDate: '2026-07-06', code: 'БР-005' },
        ],
    },
    {
        id: 'hr',
        name: 'Кадровые документы',
        description: 'Формы, положения и материалы отдела кадров',
        icon: 'users',
        prefix: 'КД',
        files: [
            { id: 26, name: 'Штатное расписание', extension: 'xlsx', sizeKb: 76, uploadDate: '2026-03-16', code: 'КД-001' },
            { id: 27, name: 'Положение об отпусках', extension: 'pdf', sizeKb: 340, uploadDate: '2026-01-24', code: 'КД-002' },
            { id: 28, name: 'Анкета кандидата', extension: 'docx', sizeKb: 44, uploadDate: '2026-04-13', code: 'КД-003' },
            { id: 29, name: 'Чек-лист адаптации новичка', extension: 'pdf', sizeKb: 128, uploadDate: '2026-06-25', code: 'КД-004' },
            { id: 30, name: 'Политика премирования', extension: 'pdf', sizeKb: 275, uploadDate: '2026-02-08', code: 'КД-005' },
        ],
    },
]

export const INITIAL_REPORTS: ReportFile[] = [
    { id: 1, name: 'Отчёт о выполненных работах', year: 2025, month: 11, date: '2025-11-30', sizeKb: 480 },
    { id: 2, name: 'Финансовый отчёт', year: 2025, month: 11, date: '2025-11-30', sizeKb: 220 },
    { id: 3, name: 'Отчёт о выполненных работах', year: 2025, month: 12, date: '2025-12-30', sizeKb: 512 },
    { id: 4, name: 'Финансовый отчёт', year: 2025, month: 12, date: '2025-12-30', sizeKb: 236 },
    { id: 5, name: 'Годовой отчёт 2025', year: 2025, month: 12, date: '2025-12-31', sizeKb: 2140 },
    { id: 6, name: 'Отчёт о выполненных работах', year: 2026, month: 1, date: '2026-01-31', sizeKb: 498 },
    { id: 7, name: 'Финансовый отчёт', year: 2026, month: 1, date: '2026-01-31', sizeKb: 244 },
    { id: 8, name: 'Отчёт о выполненных работах', year: 2026, month: 2, date: '2026-02-27', sizeKb: 470 },
    { id: 9, name: 'Финансовый отчёт', year: 2026, month: 2, date: '2026-02-27', sizeKb: 228 },
    { id: 10, name: 'Отчёт о выполненных работах', year: 2026, month: 3, date: '2026-03-31', sizeKb: 540 },
    { id: 11, name: 'Финансовый отчёт', year: 2026, month: 3, date: '2026-03-31', sizeKb: 252 },
    { id: 12, name: 'Отчёт о загрузке команды', year: 2026, month: 3, date: '2026-03-31', sizeKb: 165 },
    { id: 13, name: 'Отчёт о выполненных работах', year: 2026, month: 4, date: '2026-04-30', sizeKb: 505 },
    { id: 14, name: 'Финансовый отчёт', year: 2026, month: 4, date: '2026-04-30', sizeKb: 231 },
    { id: 15, name: 'Отчёт о выполненных работах', year: 2026, month: 5, date: '2026-05-29', sizeKb: 512 },
    { id: 16, name: 'Финансовый отчёт', year: 2026, month: 5, date: '2026-05-29', sizeKb: 240 },
    { id: 17, name: 'Отчёт о выполненных работах', year: 2026, month: 6, date: '2026-06-30', sizeKb: 488 },
    { id: 18, name: 'Финансовый отчёт', year: 2026, month: 6, date: '2026-06-30', sizeKb: 226 },
    { id: 19, name: 'Отчёт о загрузке команды', year: 2026, month: 6, date: '2026-06-30', sizeKb: 172 },
]
