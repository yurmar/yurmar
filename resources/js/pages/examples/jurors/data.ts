// ── Вымышленная организация ──────────────────────────────────────────────
// Шахматная лига «Северный ветер» — негосударственное объединение клубов.
// Для внутреннего третейского разбирательства лига ведёт единую базу кандидатов
// в присяжные заседатели: территориальные комиссии присылают списки, база их
// проверяет. Все люди, адреса, комиссии и площадки вымышлены — это интерактивный
// пример вёрстки раздела «Присяжные заседатели». Даты считаются от текущего дня.

export type ListKind = 'main' | 'reserve'
export type SubType = 'list' | 'changes'
export type SubStatus = 'checked' | 'accepted' | 'rejected' | 'failed'
export type TableKey = 'list' | 'removed' | 'added' | 'updated'
export type EditField = 'last' | 'first' | 'middle' | 'sex' | 'birth' | 'locality' | 'street' | 'house' | 'flat'

export interface Platform { id: number; name: string; city: string }
export interface Area { id: number; name: string; platformId: number }
export interface Quota { areaId: number; kind: ListKind; count: number }
export interface Cycle { id: number; dateFrom: string; dateTo: string }

export interface RowData {
    last: string; first: string; middle: string; sex: string; birth: string
    locality: string; street: string; house: string; flat: string
}

export interface Candidate extends RowData {
    id: number
    areaId: number
    platformId: number
    kind: ListKind
    areaNo: number
    regNo: number | null
    status: 'active' | 'removed'
    removalReason: string | null
}

export interface CandEvent {
    id: number
    candidateId: number
    type: 'included' | 'removed' | 'updated' | 'reg_no_assigned' | 'manual_edit'
    at: string
    reason: string | null
    changes: Partial<Record<EditField, [string, string]>> | null
}

export interface Finding {
    id: number
    table: TableKey
    rule: string
    severity: 'error' | 'question'
    message: string
    resolution: 'open' | 'dismissed' | 'fixed'
    comment: string
    rowNo: number
    name: string
    was?: string
    now?: string
}

export interface RemovedItem { candidateId: number | null; name: string; reason: string }
export interface UpdatedItem { candidateId: number; name: string; reason: string; changes: Partial<Record<EditField, [string, string]>> }

export interface Payload {
    rows: RowData[]
    removed: RemovedItem[]
    added: RowData[]
    updated: UpdatedItem[]
}

export interface PaperCheck {
    paperReceived: boolean; signatureOk: boolean; sealOk: boolean; rowsMatch: boolean; platformChecked: boolean
}

export interface Submission {
    id: number
    areaId: number
    platformId: number
    kind: ListKind
    type: SubType
    year: number
    status: SubStatus
    fileName: string
    error: string | null
    uploadedAt: string
    findings: Finding[]
    payload: Payload
    paper: PaperCheck
}

export interface Link { id: number; confidence: 'auto' | 'confirmed' | 'rejected'; a: number; b: number }

export interface Db {
    platforms: Platform[]
    areas: Area[]
    quotas: Quota[]
    cycles: Cycle[]
    reasons: string[]
    candidates: Candidate[]
    events: CandEvent[]
    submissions: Submission[]
    links: Link[]
}

export const ORG_NAME = 'Шахматная лига «Северный ветер»'

// ── Подписи ──────────────────────────────────────────────────────────────

export const KIND_LABEL: Record<ListKind, string> = { main: 'Основной', reserve: 'Запасной' }
export const TYPE_LABEL: Record<SubType, string> = { list: 'Список', changes: 'Изменения и дополнения' }
export const TABLE_LABELS: Record<TableKey, string> = {
    list: 'Список', removed: 'Исключаемые', added: 'Включаемые взамен', updated: 'Уточнённые данные',
}
export const FIELD_LABELS: Record<EditField, string> = {
    last: 'Фамилия', first: 'Имя', middle: 'Отчество', sex: 'Пол', birth: 'Дата рождения',
    locality: 'Населённый пункт', street: 'Улица', house: 'Дом', flat: 'Квартира',
}
export const EVENT_LABELS: Record<CandEvent['type'], string> = {
    included: 'Включён в список',
    removed: 'Исключён из списка',
    updated: 'Данные уточнены',
    reg_no_assigned: 'Присвоен сквозной номер',
    manual_edit: 'Правка вручную',
}

export const RULE_LABELS: Record<string, string> = {
    dup_full: 'Дубль (полный)',
    birth_invalid: 'Дата рождения',
    age: 'Возраст',
    middle_empty: 'Нет отчества',
    sex_fio: 'Пол и отчество',
    house_autoformat: 'Автозамена Excel',
    removed_found: 'Кандидат не найден',
    removed_reason: 'Основание исключения',
    upd_diff: 'Что изменилось',
    upd_reason: 'Основание изменения',
    added_count: 'Число включаемых',
}
export const ruleLabel = (r: string) => RULE_LABELS[r] ?? r

// Подсказка проверяющему рядом с каждым правилом
export const RULE_HINTS: Record<string, string> = {
    dup_full: 'Одна и та же запись встречается дважды — комиссия должна удалить дубль. При принятии второй экземпляр будет пропущен.',
    birth_invalid: 'Дата не существует (например, 30.02). Нужна правильная дата от комиссии; без неё запись не попадёт в базу.',
    age: 'Возраст вне 25–65 лет на дату составления: уточните дату рождения у комиссии или исключите кандидата.',
    middle_empty: 'Если отчества у человека действительно нет — отметьте вопрос просмотренным.',
    sex_fio: 'Пол не согласуется с отчеством — уточните у комиссии.',
    house_autoformat: 'Excel превратил дробь в дату (например, «5/12»). Дом нужно вводить как текст.',
    removed_found: 'Кандидат не найден в списке площадки — проверьте ФИО, дату рождения и номер в списке.',
    removed_reason: 'Укажите основание из справочника оснований исключения.',
    upd_diff: 'Сравните «было» и «стало» и убедитесь, что изменения верные.',
    upd_reason: 'Основание уточнения оформите по образцу «Смена фамилии, ранее — Иванова.».',
    added_count: 'Число включаемых должно равняться числу исключаемых.',
}

// ── Форматирование ───────────────────────────────────────────────────────

export const fullName = (c: Pick<RowData, 'last' | 'first' | 'middle'>) => [c.last, c.first, c.middle].filter(Boolean).join(' ')

export const addressLine = (c: Pick<RowData, 'locality' | 'street' | 'house' | 'flat'>) =>
    [c.locality, c.street, c.house ? `д. ${c.house}` : '', c.flat ? `кв. ${c.flat}` : ''].filter(Boolean).join(', ')

export const fmtDate = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
    return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || '—'
}

const pad = (n: number) => String(n).padStart(2, '0')
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const daysAgo = (n: number) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return toIso(d)
}
export const ageDays = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))

export const dayWord = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'день' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'дня' : 'дней')

// ── Справочники ──────────────────────────────────────────────────────────

const PLATFORMS: Platform[] = [
    { id: 1, name: 'Третейская площадка «Север»', city: 'Северная Гавань' },
    { id: 2, name: 'Третейская площадка «Юг»', city: 'Каменный Брод' },
    { id: 3, name: 'Третейская площадка «Восток»', city: 'Ясный Берег' },
]

const AREAS: Area[] = [
    { id: 1, name: 'Северная Гавань', platformId: 1 },
    { id: 2, name: 'Липовая Роща', platformId: 1 },
    { id: 3, name: 'Звонкие Ключи', platformId: 1 },
    { id: 4, name: 'Каменный Брод', platformId: 2 },
    { id: 5, name: 'Тихая Заводь', platformId: 2 },
    { id: 6, name: 'Золотой Склон', platformId: 2 },
    { id: 7, name: 'Ясный Берег', platformId: 3 },
    { id: 8, name: 'Ветреный Мыс', platformId: 3 },
]

const REASONS = [
    'Переезд на постоянное место жительства в другой город',
    'Состояние здоровья (по медицинскому заключению)',
    'Вступление в должность арбитра лиги',
    'Личное заявление кандидата',
    'Смерть',
]

const STREETS = ['ул. Мира', 'ул. Ленина', 'ул. Садовая', 'ул. Лесная', 'ул. Речная', 'пер. Школьный', 'ул. Молодёжная', 'ул. Береговая', 'ул. Заводская', 'пр. Победы']

const MALE_LAST = ['Волков', 'Зайцев', 'Орлов', 'Мельников', 'Крылов', 'Беляев', 'Соколов', 'Лебедев', 'Тихонов', 'Ершов', 'Макаров', 'Громов', 'Дьячков', 'Сорокин', 'Никонов', 'Рябов', 'Фомин', 'Чернов', 'Алексеев', 'Борисов']
const MALE_FIRST = ['Алексей', 'Дмитрий', 'Иван', 'Михаил', 'Николай', 'Павел', 'Сергей', 'Андрей', 'Виктор', 'Олег']
const MALE_MID = ['Александрович', 'Викторович', 'Иванович', 'Сергеевич', 'Николаевич', 'Петрович', 'Андреевич', 'Олегович']
const FEMALE_FIRST = ['Анна', 'Елена', 'Ирина', 'Мария', 'Ольга', 'Наталья', 'Татьяна', 'Светлана', 'Галина', 'Вера']
const FEMALE_MID = ['Александровна', 'Викторовна', 'Ивановна', 'Сергеевна', 'Николаевна', 'Петровна', 'Андреевна', 'Олеговна']

// ── Генерация демо-данных ────────────────────────────────────────────────

type Rng = () => number
const mulberry32 = (seed: number): Rng => () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const pick = <T,>(rng: Rng, a: T[]): T => a[Math.floor(rng() * a.length)]

let seq = 1000
export const nextId = () => ++seq

function makeRow(rng: Rng, area: Area, taken: Set<string>): RowData {
    for (;;) {
        const female = rng() < 0.5
        const last = pick(rng, MALE_LAST)
        const row: RowData = {
            last: female ? `${last}а` : last,
            first: pick(rng, female ? FEMALE_FIRST : MALE_FIRST),
            middle: pick(rng, female ? FEMALE_MID : MALE_MID),
            sex: female ? 'ж' : 'м',
            birth: `${1962 + Math.floor(rng() * 38)}-${pad(1 + Math.floor(rng() * 12))}-${pad(1 + Math.floor(rng() * 28))}`,
            locality: `г. ${area.name}`,
            street: pick(rng, STREETS),
            house: String(1 + Math.floor(rng() * 90)),
            flat: rng() < 0.7 ? String(1 + Math.floor(rng() * 80)) : '',
        }
        const key = `${fullName(row)}|${row.birth}`
        if (!taken.has(key)) {
            taken.add(key)
            return row
        }
    }
}

const emptyPaper = (): PaperCheck => ({ paperReceived: false, signatureOk: false, sealOk: false, rowsMatch: false, platformChecked: false })
export const paperComplete = (p: PaperCheck) => p.paperReceived && p.signatureOk && p.sealOk && p.rowsMatch && p.platformChecked

export const quotaOf = (db: Db, areaId: number, kind: ListKind) => db.quotas.find(q => q.areaId === areaId && q.kind === kind)?.count ?? 0
export const platformOf = (db: Db, areaId: number) => db.areas.find(a => a.id === areaId)?.platformId ?? 0
export const areaName = (db: Db, id: number) => db.areas.find(a => a.id === id)?.name ?? '—'
export const platformName = (db: Db, id: number) => db.platforms.find(p => p.id === id)?.name ?? '—'

export type Scenario = 'clean' | 'issues'

export interface UploadParams {
    areaId: number
    kind: ListKind
    type: SubType
    year: number
    scenario: Scenario
    fileName: string
    at: string
}

const finding = (f: Omit<Finding, 'id' | 'resolution' | 'comment'>): Finding => ({ ...f, id: nextId(), resolution: 'open', comment: '' })

/** Имитация разбора загруженного файла: собирает содержимое и замечания проверки */
export function buildSubmission(db: Db, p: UploadParams, rng: Rng): Submission {
    const area = db.areas.find(a => a.id === p.areaId)!
    const taken = new Set(db.candidates.map(c => `${fullName(c)}|${c.birth}`))
    const payload: Payload = { rows: [], removed: [], added: [], updated: [] }
    const findings: Finding[] = []

    if (p.type === 'list') {
        const n = quotaOf(db, p.areaId, p.kind)
        for (let i = 0; i < n; i++) payload.rows.push(makeRow(rng, area, taken))
        if (p.scenario === 'issues' && n >= 8) {
            const rows = payload.rows
            rows[0] = { ...rows[1] }
            findings.push(finding({ table: 'list', rule: 'dup_full', severity: 'error', rowNo: 1, name: fullName(rows[0]), message: `Запись дублирует строку 2: ${fullName(rows[0])}, ${fmtDate(rows[0].birth)}.` }))
            const bad = { ...rows[2], birth: '1990-02-30' }
            rows[2] = bad
            findings.push(finding({ table: 'list', rule: 'birth_invalid', severity: 'error', rowNo: 3, name: fullName(bad), message: 'Даты 30.02.1990 не существует.', was: '30.02.1990' }))
            const young = { ...rows[3], birth: `${new Date().getFullYear() - 21}-05-14` }
            rows[3] = young
            findings.push(finding({ table: 'list', rule: 'age', severity: 'error', rowNo: 4, name: fullName(young), message: 'На дату составления списка кандидату 21 год — допустимый возраст 25–65 лет.', was: fmtDate(young.birth) }))
            rows[4] = { ...rows[4], middle: '' }
            findings.push(finding({ table: 'list', rule: 'middle_empty', severity: 'question', rowNo: 5, name: fullName(rows[4]), message: 'Не указано отчество.' }))
            const swapped = { ...rows[5], sex: rows[5].sex === 'м' ? 'ж' : 'м' }
            rows[5] = swapped
            findings.push(finding({ table: 'list', rule: 'sex_fio', severity: 'question', rowNo: 6, name: fullName(swapped), message: `Указан пол «${swapped.sex}», а отчество «${swapped.middle}» — другого рода.`, was: swapped.sex }))
            rows[6] = { ...rows[6], house: '05.12' }
            findings.push(finding({ table: 'list', rule: 'house_autoformat', severity: 'question', rowNo: 7, name: fullName(rows[6]), message: 'Дом «05.12» похож на дату, превращённую Excel из дроби «5/12».', was: '05.12', now: '5/12' }))
        }
    } else {
        const active = db.candidates.filter(c => c.areaId === p.areaId && c.kind === p.kind && c.status === 'active')
        const reasons = db.reasons
        const out = active.slice(0, 2)
        out.forEach((c, i) => {
            payload.removed.push({ candidateId: c.id, name: fullName(c), reason: reasons[i % reasons.length] })
            payload.added.push(makeRow(rng, area, taken))
        })
        const upd = active[3]
        if (upd) {
            payload.updated.push({
                candidateId: upd.id, name: fullName(upd), reason: 'Смена места жительства, ранее — ' + upd.street + '.',
                changes: { street: [upd.street, upd.street === 'ул. Мира' ? 'ул. Ленина' : 'ул. Мира'] },
            })
            const ch = payload.updated[0].changes.street!
            findings.push(finding({ table: 'updated', rule: 'upd_diff', severity: 'question', rowNo: 1, name: fullName(upd), message: `Изменилась улица: ${ch[0]} → ${ch[1]}.`, was: ch[0], now: ch[1] }))
        }
        if (p.scenario === 'issues') {
            payload.removed.push({ candidateId: null, name: 'Рябова Ксения Фёдоровна', reason: reasons[0] })
            findings.push(finding({ table: 'removed', rule: 'removed_found', severity: 'error', rowNo: 3, name: 'Рябова Ксения Фёдоровна', message: 'Кандидат «Рябова Ксения Фёдоровна» не найден в списке площадки.' }))
            if (upd) findings.push(finding({ table: 'updated', rule: 'upd_reason', severity: 'question', rowNo: 1, name: fullName(upd), message: 'Основание уточнения без слова «ранее» — проверьте оформление.' }))
        }
    }

    return {
        id: nextId(), areaId: p.areaId, platformId: area.platformId, kind: p.kind, type: p.type, year: p.year,
        status: 'checked', fileName: p.fileName, error: null, uploadedAt: p.at, findings, payload, paper: emptyPaper(),
    }
}

// ── Подсчёты по загрузке ─────────────────────────────────────────────────

export const openCount = (s: Submission, sev: Finding['severity']) => s.findings.filter(f => f.severity === sev && f.resolution === 'open').length

const rowKey = (r: RowData) => `${fullName(r)}|${r.birth}`
const validBirth = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
    if (!m) return false
    const d = new Date(+m[1], +m[2] - 1, +m[3])
    return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]
}

/** Строки, которые при принятии будут пропущены (дубли и записи без корректной даты рождения) */
function acceptableRows(rows: RowData[]) {
    const seen = new Set<string>()
    const ok: RowData[] = []
    let skipped = 0
    rows.forEach(r => {
        const key = rowKey(r)
        if (!validBirth(r.birth) || seen.has(key)) { skipped++; return }
        seen.add(key)
        ok.push(r)
    })
    return { ok, skipped }
}

export function acceptPreview(db: Db, s: Submission) {
    const dismissed = s.findings.filter(f => f.severity === 'error' && f.resolution !== 'open').length
    const openErrors = openCount(s, 'error')
    if (s.type === 'list') {
        const { ok, skipped } = acceptableRows(s.payload.rows)
        return { included: ok.length, removed: 0, updated: 0, skipped, openErrors, dismissed, canAccept: openErrors === 0 }
    }
    const removed = s.payload.removed.filter(r => r.candidateId !== null).length
    const { ok, skipped } = acceptableRows(s.payload.added)
    return {
        included: ok.length, removed, updated: s.payload.updated.length,
        skipped: skipped + s.payload.removed.length - removed, openErrors, dismissed, canAccept: openErrors === 0,
    }
}

export function activeIn(db: Db, areaId: number, kind: ListKind) {
    return db.candidates.filter(c => c.areaId === areaId && c.kind === kind && c.status === 'active')
}

// ── Действия над базой ───────────────────────────────────────────────────

const toCandidate = (db: Db, s: Submission, r: RowData, no: number): Candidate => ({
    ...r, id: nextId(), areaId: s.areaId, platformId: s.platformId, kind: s.kind, areaNo: no,
    regNo: null, status: 'active', removalReason: null,
})

export function acceptSubmission(db: Db, id: number, at: string): Db {
    const s = db.submissions.find(x => x.id === id)
    if (!s || s.status !== 'checked') return db
    const candidates = [...db.candidates]
    const events = [...db.events]
    const ev = (candidateId: number, type: CandEvent['type'], reason: string | null, changes: CandEvent['changes'] = null) =>
        events.push({ id: nextId(), candidateId, type, at, reason, changes })

    let no = Math.max(0, ...candidates.filter(c => c.areaId === s.areaId && c.kind === s.kind).map(c => c.areaNo))
    if (s.type === 'list') {
        // новый список заменяет действующий список того же вида у комиссии
        candidates.forEach((c, i) => {
            if (c.areaId === s.areaId && c.kind === s.kind && c.status === 'active') {
                candidates[i] = { ...c, status: 'removed', removalReason: 'Заменён новым списком' }
                ev(c.id, 'removed', 'Заменён новым списком')
            }
        })
        acceptableRows(s.payload.rows).ok.forEach(r => {
            const c = toCandidate(db, s, r, ++no)
            candidates.push(c)
            ev(c.id, 'included', null)
        })
    } else {
        s.payload.removed.forEach(r => {
            const i = candidates.findIndex(c => c.id === r.candidateId)
            if (i < 0 || candidates[i].status === 'removed') return
            candidates[i] = { ...candidates[i], status: 'removed', removalReason: r.reason }
            ev(candidates[i].id, 'removed', r.reason)
        })
        s.payload.updated.forEach(u => {
            const i = candidates.findIndex(c => c.id === u.candidateId)
            if (i < 0) return
            const patch: Partial<RowData> = {}
            ;(Object.keys(u.changes) as EditField[]).forEach(f => { patch[f] = u.changes[f]![1] })
            candidates[i] = { ...candidates[i], ...patch }
            ev(candidates[i].id, 'updated', u.reason, u.changes)
        })
        acceptableRows(s.payload.added).ok.forEach(r => {
            const c = toCandidate(db, s, r, ++no)
            candidates.push(c)
            ev(c.id, 'included', 'Включён взамен исключённого')
        })
    }
    return { ...db, candidates, events, submissions: db.submissions.map(x => (x.id === id ? { ...x, status: 'accepted' } : x)) }
}

export const rejectSubmission = (db: Db, id: number): Db => ({
    ...db, submissions: db.submissions.map(x => (x.id === id && x.status === 'checked' ? { ...x, status: 'rejected' } : x)),
})

export const updateSubmission = (db: Db, id: number, patch: (s: Submission) => Submission): Db => ({
    ...db, submissions: db.submissions.map(x => (x.id === id ? patch(x) : x)),
})

export function manualEdit(db: Db, id: number, fields: Partial<Record<EditField, string>>, reason: string, at: string): Db {
    const cur = db.candidates.find(c => c.id === id)
    if (!cur) return db
    const changes: NonNullable<CandEvent['changes']> = {}
    ;(Object.keys(fields) as EditField[]).forEach(f => {
        if (fields[f] !== undefined && fields[f] !== cur[f]) changes[f] = [cur[f], fields[f]!]
    })
    if (!Object.keys(changes).length) return db
    const patch: Partial<RowData> = {}
    ;(Object.keys(changes) as EditField[]).forEach(f => { patch[f] = changes[f]![1] })
    return {
        ...db,
        candidates: db.candidates.map(c => (c.id === id ? { ...c, ...patch } : c)),
        events: [...db.events, { id: nextId(), candidateId: id, type: 'manual_edit', at, reason, changes }],
    }
}

/** Имитация загрузки файла со сквозными номерами реестра: номера получают кандидаты без номера */
export function assignRegNumbers(db: Db, at: string): { db: Db; matched: number } {
    let n = Math.max(0, ...db.candidates.map(c => c.regNo ?? 0))
    const events = [...db.events]
    let matched = 0
    const candidates = db.candidates.map(c => {
        if (c.status !== 'active' || c.regNo !== null || c.kind !== 'main') return c
        matched++
        events.push({ id: nextId(), candidateId: c.id, type: 'reg_no_assigned', at, reason: null, changes: null })
        return { ...c, regNo: ++n }
    })
    return { db: { ...db, candidates, events }, matched }
}

// ── Начальное состояние ──────────────────────────────────────────────────

export function makeSeed(): Db {
    seq = 1000
    const rng = mulberry32(38)
    let db: Db = {
        platforms: PLATFORMS,
        areas: AREAS,
        quotas: AREAS.flatMap(a => [{ areaId: a.id, kind: 'main' as const, count: 10 }, { areaId: a.id, kind: 'reserve' as const, count: 4 }]),
        cycles: [
            { id: 1, dateFrom: `${new Date().getFullYear()}-01-01`, dateTo: `${new Date().getFullYear() + 4}-12-31` },
        ],
        reasons: REASONS,
        candidates: [], events: [], submissions: [], links: [],
    }
    const year = new Date().getFullYear()

    const load = (areaId: number, kind: ListKind, type: SubType, scenario: Scenario, ago: number, accept: boolean) => {
        const sub = buildSubmission(db, {
            areaId, kind, type, year, scenario, at: daysAgo(ago),
            fileName: `${type === 'list' ? 'spisok' : 'izmeneniya'}-${areaId}-${kind === 'main' ? 'osn' : 'zap'}-${year}.xlsx`,
        }, rng)
        db = { ...db, submissions: [...db.submissions, sub] }
        if (accept) db = acceptSubmission(db, sub.id, daysAgo(ago))
        return sub
    }

    // принятые списки: основные — у всех комиссий, запасные — у пяти из восьми
    AREAS.forEach((a, i) => {
        const s = load(a.id, 'main', 'list', 'clean', 70 + i, true)
        db = updateSubmission(db, s.id, x => ({ ...x, paper: { paperReceived: true, signatureOk: true, sealOk: true, rowsMatch: true, platformChecked: true } }))
        if (a.id <= 5) load(a.id, 'reserve', 'list', 'clean', 64 + i, true)
    })
    // принятые изменения: исключены и заменены кандидаты
    load(1, 'main', 'changes', 'clean', 30, true)
    load(4, 'main', 'changes', 'clean', 18, true)

    // ждут решения
    load(2, 'main', 'changes', 'issues', 9, false)
    load(6, 'main', 'list', 'issues', 3, false)
    load(7, 'reserve', 'list', 'clean', 11, false)
    // отклонена и с ошибкой файла
    const rej = load(3, 'reserve', 'list', 'issues', 40, false)
    db = rejectSubmission(db, rej.id)
    db = {
        ...db,
        submissions: [...db.submissions, {
            id: nextId(), areaId: 8, platformId: 3, kind: 'main', type: 'list', year, status: 'failed',
            fileName: 'spisok-8-osn.xlsx', error: 'Не найден лист «Список»: загружена форма «Изменения и дополнения».',
            uploadedAt: daysAgo(5), findings: [], payload: { rows: [], removed: [], added: [], updated: [] }, paper: emptyPaper(),
        }],
    }

    // одинаковые люди в списках разных площадок — для вкладки «Связи»
    const act = (areaId: number) => db.candidates.filter(c => c.areaId === areaId && c.kind === 'main' && c.status === 'active')
    const pairs: [number, number, number][] = [[1, 4, 1], [2, 7, 2], [3, 5, 3], [5, 8, 4]]
    const links: Link[] = []
    const candidates = [...db.candidates]
    pairs.forEach(([a1, a2, k], idx) => {
        const x = act(a1)[k]
        const y = act(a2)[k]
        if (!x || !y) return
        const yi = candidates.findIndex(c => c.id === y.id)
        candidates[yi] = { ...y, last: x.last, first: x.first, middle: x.middle, sex: x.sex, birth: x.birth }
        links.push({ id: nextId(), confidence: idx === 2 ? 'confirmed' : idx === 3 ? 'rejected' : 'auto', a: x.id, b: y.id })
    })
    db = { ...db, candidates, links }

    // часть кандидатов основного списка уже получила сквозные номера
    let n = 0
    db = {
        ...db,
        candidates: db.candidates.map(c => (c.kind === 'main' && c.status === 'active' && c.areaId <= 3 ? { ...c, regNo: ++n } : c)),
    }
    return db
}
