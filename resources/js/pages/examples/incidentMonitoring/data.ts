// ── Вымышленная организация ──────────────────────────────────────────────
// Торговая сеть «Северный ветер». Все инциденты, площадки и сотрудники
// вымышлены — интерактивный пример вёрстки раздела «Мониторинг IT инцидентов».
// Даты считаются от текущего дня, чтобы в примере всегда было что показать.

export interface Incident {
    id: number
    description: string
    comment: string
    start: string // локальное время, 'YYYY-MM-DDTHH:mm'
    end: string // '' — не решён
    resolved: boolean
    assistance: boolean
    noIncident: boolean
    localization: string
    group: string
    author: string
}

export const GROUP = 'ИТ-служба торговой сети «Северный ветер»'
export const ME = 'Громов Артём'
export const OTHER_AUTHOR = 'Фомина Светлана'

export const LOCALIZATIONS = [
    'Головной офис',
    'Распределительный центр',
    'Магазины — Центральный район',
    'Магазины — Северный район',
    'Интернет-магазин',
    'Облачная CRM',
    'Кассовая система',
    'Корпоративная почта',
    'Сеть передачи данных',
]

const pad = (n: number) => String(n).padStart(2, '0')

export const toLocalInput = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`

export const toDateOnly = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const parseLocal = (s: string): Date | null => {
    if (!s) return null
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
}

export const formatDisplay = (s: string): string => {
    const d = parseLocal(s)
    return d ? `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}` : '-'
}

const at = (daysAgo: number, h: number, m = 0) => {
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(h, m, 0, 0)
    return toLocalInput(d)
}

export const dayWord = (n: number) => {
    if (n % 10 === 1 && n % 100 !== 11) return 'день'
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня'
    return 'дней'
}

/** Показывать ли инцидент на выбранную дату: нерешённые тянутся до сегодняшнего дня */
export function visibleOnDate(inc: Incident, date: string): boolean {
    const start = parseLocal(inc.start)
    if (!start) return false
    if (inc.noIncident) return toDateOnly(start) === date
    const from = toDateOnly(start)
    if (!inc.resolved) return date >= from && date <= toDateOnly(new Date())
    const end = parseLocal(inc.end)
    return end ? date >= from && date <= toDateOnly(end) : date === from
}

let seq = 100
export const nextId = () => ++seq

export const initialIncidents: Incident[] = [
    {
        id: 1, noIncident: false, resolved: false, assistance: true,
        description: 'Периодические обрывы связи с кассами в магазинах Северного района. Чеки пробиваются с задержкой до 40 секунд, часть операций уходит в офлайн-режим.',
        comment: 'Провайдер подтвердил деградацию магистрального канала, ведутся работы. Подключён резервный LTE-канал на пяти магазинах.',
        start: at(2, 9, 20), end: '', localization: 'Магазины — Северный район', group: GROUP, author: ME,
    },
    {
        id: 2, noIncident: false, resolved: false, assistance: false,
        description: 'Не открывается карточка клиента в облачной CRM у менеджеров контакт-центра: страница зависает на загрузке истории обращений.',
        comment: 'Проблема воспроизводится на 6 из 14 рабочих мест. Заведено обращение вендору.',
        start: at(0, 8, 45), end: '', localization: 'Облачная CRM', group: GROUP, author: ME,
    },
    {
        id: 3, noIncident: false, resolved: true, assistance: false,
        description: 'Не работает печать на сетевых принтерах бухгалтерии после обновления драйверов.',
        comment: 'Откатили драйвер на предыдущую версию, печать восстановлена. Обновление отложено до выхода исправленной сборки.',
        start: at(0, 9, 10), end: at(0, 10, 35), localization: 'Головной офис', group: GROUP, author: ME,
    },
    {
        id: 4, noIncident: false, resolved: true, assistance: true,
        description: 'Сбой на складском сервере: недоступна система учёта остатков, сотрудники распределительного центра не могут оформить приёмку.',
        comment: 'Заменён вышедший из строя блок питания, сервер перезагружен, данные целы. Приёмка возобновлена, накопленные накладные внесены вручную.',
        start: at(1, 7, 30), end: at(1, 12, 15), localization: 'Распределительный центр', group: GROUP, author: OTHER_AUTHOR,
    },
    {
        id: 5, noIncident: false, resolved: true, assistance: false,
        description: 'Не доходила входящая почта от внешних адресатов — письма оседали в очереди почтового шлюза.',
        comment: 'Освободили место на диске шлюза, очередь разобрана. Настроен мониторинг заполнения диска.',
        start: at(3, 13, 0), end: at(3, 15, 20), localization: 'Корпоративная почта', group: GROUP, author: ME,
    },
    {
        id: 6, noIncident: false, resolved: true, assistance: false,
        description: 'Интернет-магазин отвечал с задержкой более 10 секунд в период распродажи, часть заказов не оформлялась.',
        comment: 'Увеличено число экземпляров приложения, сброшен кэш каталога. Нагрузочный тест перед следующей акцией запланирован.',
        start: at(5, 18, 40), end: at(5, 21, 5), localization: 'Интернет-магазин', group: GROUP, author: OTHER_AUTHOR,
    },
    {
        id: 7, noIncident: true, resolved: true, assistance: false,
        description: 'Инцидентов за сутки не зарегистрировано.',
        comment: '',
        start: at(4, 17, 55), end: '', localization: '', group: GROUP, author: ME,
    },
    {
        id: 8, noIncident: false, resolved: true, assistance: false,
        description: 'Пропал доступ в интернет в переговорных головного офиса — не работала точка Wi-Fi на третьем этаже.',
        comment: 'Перезагружен коммутатор питания, точка доступа заменена на резервную.',
        start: at(6, 11, 15), end: at(6, 12, 0), localization: 'Сеть передачи данных', group: GROUP, author: ME,
    },
]
