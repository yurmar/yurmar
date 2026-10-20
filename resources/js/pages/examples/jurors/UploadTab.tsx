import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, FileSpreadsheet, HelpCircle, Printer, Upload, XCircle } from 'lucide-react'
import {
    FIELD_LABELS, KIND_LABEL, RULE_HINTS, TABLE_LABELS, TYPE_LABEL, acceptPreview, acceptSubmission, activeIn, addressLine, areaName,
    buildSubmission, daysAgo, fmtDate, fullName, nextId, openCount, paperComplete, platformName, quotaOf, rejectSubmission,
    ruleLabel, updateSubmission, type EditField, type Finding, type ListKind, type Scenario, type SubType, type Submission,
} from './data'
import { BTN, BTN_GHOST, CHIP, Chk, FIELD, LABEL, Section, Segmented, Sheet, StatusBadge, type Ctx } from './ui'

let rngSeed = 7
const makeRng = () => () => {
    rngSeed = (rngSeed * 1664525 + 1013904223) % 4294967296
    return rngSeed / 4294967296
}

const PAPER: { key: keyof Submission['paper']; label: string }[] = [
    { key: 'paperReceived', label: 'Бумажный экземпляр получен' },
    { key: 'signatureOk', label: 'Подпись председателя комиссии на месте' },
    { key: 'sealOk', label: 'Печать комиссии на месте' },
    { key: 'rowsMatch', label: 'Строки на бумаге совпадают с файлом' },
    { key: 'platformChecked', label: 'Представление площадки сверено' },
]

function FindingRow({ f, locked, onResolve }: { f: Finding; locked: boolean; onResolve: (r: Finding['resolution'], comment: string) => void }) {
    const [comment, setComment] = useState(f.comment)
    const [hint, setHint] = useState(false)
    const isErr = f.severity === 'error'
    const needComment = isErr && !comment.trim()

    return (
        <div className="rounded-xl border border-border bg-foreground/5 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {isErr ? <AlertTriangle size={16} className="text-rose-500" /> : <HelpCircle size={16} className="text-amber-500" />}
                        {ruleLabel(f.rule)}
                        <span className="text-xs font-normal text-muted-foreground">· {TABLE_LABELS[f.table]}, строка {f.rowNo}</span>
                    </p>
                    <p className="mt-1 text-sm">{f.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{f.name}</p>
                    {(f.was || f.now) && (
                        <p className="mt-1 text-xs">
                            <span className="text-muted-foreground">в файле:</span> <b>{f.was ?? '—'}</b>
                            {f.now && <> <span className="text-muted-foreground">→ после обработки:</span> <b>{f.now}</b></>}
                        </p>
                    )}
                </div>
                <button type="button" onClick={() => setHint(h => !h)} className="text-xs text-sky-500 hover:underline dark:text-sky-400">Что делать</button>
            </div>
            {hint && <p className="mt-2 rounded-lg bg-sky-500/10 p-2 text-xs">{RULE_HINTS[f.rule] ?? 'Проверьте запись и при необходимости верните файл комиссии.'}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-2">
                {f.resolution === 'open' ? (
                    <>
                        {isErr && (
                            <input className={`${FIELD} !w-auto min-w-[200px] flex-1`} placeholder="Комментарий (обязателен для ошибки)" value={comment} disabled={locked}
                                onChange={e => setComment(e.target.value)} />
                        )}
                        <button type="button" className={BTN_GHOST} disabled={locked || needComment} onClick={() => onResolve('dismissed', comment)}>
                            {isErr ? 'Принять как есть' : 'Просмотрено'}
                        </button>
                        <button type="button" className={BTN_GHOST} disabled={locked || needComment} onClick={() => onResolve('fixed', comment)}>Исправлено</button>
                    </>
                ) : (
                    <>
                        <span className={`${CHIP} ${f.resolution === 'fixed' ? 'text-emerald-500' : ''}`}>
                            {f.resolution === 'fixed' ? 'Исправлено' : isErr ? 'Принято как есть' : 'Просмотрено'}
                        </span>
                        {f.comment && <span className="text-xs text-muted-foreground">«{f.comment}»</span>}
                        {!locked && <button type="button" className="text-xs text-sky-500 hover:underline dark:text-sky-400" onClick={() => onResolve('open', '')}>Вернуть в работу</button>}
                    </>
                )}
            </div>
        </div>
    )
}

function DiffCard({ ctx, s }: { ctx: Ctx; s: Submission }) {
    const { db } = ctx
    const now = activeIn(db, s.areaId, s.kind).length
    const p = acceptPreview(db, s)
    const after = s.type === 'list' ? p.included : now - p.removed + p.included
    const plan = quotaOf(db, s.areaId, s.kind)
    const f = (c: EditField, v: string) => (c === 'birth' ? fmtDate(v) : v)

    return (
        <Section title="Что изменится при принятии" hint={s.type === 'list' ? 'Новый список заменит действующий список комиссии.' : undefined}>
            <div className="flex flex-wrap gap-1.5">
                <span className={CHIP}>Включить: {p.included}</span>
                {s.type === 'changes' && <span className={CHIP}>Исключить: {p.removed}</span>}
                {s.type === 'changes' && <span className={CHIP}>Уточнить: {p.updated}</span>}
                {p.skipped > 0 && <span className={`${CHIP} text-amber-500`}>Будет пропущено: {p.skipped}</span>}
                <span className={CHIP}>Действует сейчас: {now}</span>
                <span className={`${CHIP} ${after !== plan ? 'text-amber-500' : ''}`}>После принятия: {after} (план {plan})</span>
            </div>
            {s.type === 'changes' && (
                <div className="mt-4 space-y-3 text-sm">
                    {s.payload.removed.map((r, i) => (
                        <p key={`r${i}`} className="rounded-lg bg-foreground/5 px-3 py-2">
                            <b className="text-rose-500">Исключить</b> · {r.name}
                            {r.candidateId === null && <span className="text-amber-500"> — не найден, будет пропущен</span>}
                            <span className="block text-xs text-muted-foreground">{r.reason}</span>
                        </p>
                    ))}
                    {s.payload.added.map((r, i) => (
                        <p key={`a${i}`} className="rounded-lg bg-foreground/5 px-3 py-2">
                            <b className="text-emerald-500">Включить</b> · {fullName(r)}, {fmtDate(r.birth)}
                            <span className="block text-xs text-muted-foreground">{addressLine(r)}</span>
                        </p>
                    ))}
                    {s.payload.updated.map((u, i) => (
                        <p key={`u${i}`} className="rounded-lg bg-foreground/5 px-3 py-2">
                            <b className="text-sky-500">Уточнить</b> · {u.name}
                            {(Object.keys(u.changes) as EditField[]).map(c => (
                                <span key={c} className="block text-xs">{FIELD_LABELS[c]}: <span className="text-muted-foreground line-through">{f(c, u.changes[c]![0])}</span> → <b>{f(c, u.changes[c]![1])}</b></span>
                            ))}
                        </p>
                    ))}
                </div>
            )}
            {s.type === 'list' && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                    <table className="min-w-full divide-y divide-border text-sm">
                        <tbody className="divide-y divide-border">
                            {s.payload.rows.slice(0, 5).map((r, i) => (
                                <tr key={i} className="odd:bg-foreground/[0.03]">
                                    <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                                    <td className="px-3 py-1.5 font-medium">{fullName(r)}</td>
                                    <td className="whitespace-nowrap px-3 py-1.5">{fmtDate(r.birth)}</td>
                                    <td className="px-3 py-1.5">{addressLine(r)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {s.payload.rows.length > 5 && <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">…и ещё {s.payload.rows.length - 5} строк</p>}
                </div>
            )}
        </Section>
    )
}

function Review({ ctx, s }: { ctx: Ctx; s: Submission }) {
    const { db, setDb, notify } = ctx
    const [acceptOpen, setAcceptOpen] = useState(false)
    const [rejectOpen, setRejectOpen] = useState(false)
    const [rule, setRule] = useState('')
    const [sev, setSev] = useState<'all' | 'error' | 'question'>('all')
    const [onlyOpen, setOnlyOpen] = useState(false)

    const locked = s.status !== 'checked'
    const p = acceptPreview(db, s)
    const rules = useMemo(() => Array.from(new Set(s.findings.map(f => f.rule))), [s.findings])
    const shown = s.findings.filter(f => (!rule || f.rule === rule) && (sev === 'all' || f.severity === sev) && (!onlyOpen || f.resolution === 'open'))

    const resolve = (id: number, resolution: Finding['resolution'], comment: string) =>
        setDb(d => updateSubmission(d, s.id, x => ({ ...x, findings: x.findings.map(f => (f.id === id ? { ...f, resolution, comment } : f)) })))

    const setPaper = (key: keyof Submission['paper'], v: boolean) =>
        setDb(d => updateSubmission(d, s.id, x => ({ ...x, paper: { ...x.paper, [key]: v } })))

    const printCheck = () => window.print()

    return (
        <div className="space-y-4">
            <Section title="Результаты проверки">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="flex items-center gap-2 text-sm font-medium"><FileSpreadsheet size={16} className="text-muted-foreground" /><span className="truncate">{s.fileName}</span></p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {areaName(db, s.areaId)} · {platformName(db, s.platformId)} · {TYPE_LABEL[s.type]} · {KIND_LABEL[s.kind].toLowerCase()} · {s.year} · {fmtDate(s.uploadedAt)}
                        </p>
                    </div>
                    <StatusBadge status={s.status} />
                </div>
                {s.status === 'failed' ? (
                    <p className="mt-3 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-500">{s.error}</p>
                ) : (
                    <>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className={CHIP}>Ошибок: {s.findings.filter(f => f.severity === 'error').length} (не решено {openCount(s, 'error')})</span>
                            <span className={CHIP}>Вопросов: {s.findings.filter(f => f.severity === 'question').length} (не решено {openCount(s, 'question')})</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button type="button" className={BTN} disabled={locked || !p.canAccept} onClick={() => setAcceptOpen(true)}>
                                <CheckCircle2 size={16} /> Принять в базу
                            </button>
                            <button type="button" className={BTN_GHOST} disabled={locked} onClick={() => setRejectOpen(true)}>
                                <XCircle size={16} /> Отклонить
                            </button>
                            <button type="button" className={BTN_GHOST} onClick={printCheck}><Printer size={16} /> Бумажный чек-лист</button>
                        </div>
                        {!locked ? null : <p className="mt-3 text-xs text-muted-foreground">Решение по загрузке принято — замечания доступны только для просмотра.</p>}
                        {!locked && !p.canAccept && <p className="mt-3 text-xs text-amber-500">Пока есть нерешённые ошибки ({p.openErrors}), принять загрузку нельзя.</p>}
                    </>
                )}
            </Section>

            {s.status !== 'failed' && (
                <>
                    <Section title="Сверка бумажной версии" hint={paperComplete(s.paper) ? 'Сверка оформлена полностью.' : 'Отметьте все пять пунктов, когда сверка выполнена.'}>
                        {PAPER.map(i => <Chk key={i.key} checked={s.paper[i.key]} onChange={v => setPaper(i.key, v)} label={i.label} />)}
                    </Section>

                    <DiffCard ctx={ctx} s={s} />

                    <Section title="Замечания проверки">
                        {s.findings.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Замечаний нет — файл прошёл все правила проверки.</p>
                        ) : (
                            <>
                                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
                                    <div>
                                        <span className={LABEL}>Правило</span>
                                        <select className={FIELD} value={rule} onChange={e => setRule(e.target.value)}>
                                            <option value="">Все правила</option>
                                            {rules.map(r => <option key={r} value={r}>{ruleLabel(r)}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <span className={LABEL}>Уровень</span>
                                        <Segmented<'all' | 'error' | 'question'> value={sev} onChange={setSev}
                                            options={[{ id: 'all', label: 'Все' }, { id: 'error', label: 'Ошибки' }, { id: 'question', label: 'Вопросы' }]} />
                                    </div>
                                    <div className="self-end"><Chk checked={onlyOpen} onChange={setOnlyOpen} label="Только нерешённые" /></div>
                                </div>
                                <div className="space-y-2">
                                    {shown.length === 0
                                        ? <p className="text-sm text-muted-foreground">По выбранным условиям замечаний нет.</p>
                                        : shown.map(f => <FindingRow key={f.id} f={f} locked={locked} onResolve={(r, c) => resolve(f.id, r, c)} />)}
                                </div>
                            </>
                        )}
                    </Section>
                </>
            )}

            {acceptOpen && (
                <Sheet title={<h3 className="text-lg font-semibold">Принять загрузку в базу?</h3>} onClose={() => setAcceptOpen(false)}
                    footer={<>
                        <button type="button" className={BTN_GHOST} onClick={() => setAcceptOpen(false)}>Отмена</button>
                        <button type="button" className={BTN} onClick={() => {
                            setDb(d => acceptSubmission(d, s.id, daysAgo(0)))
                            setAcceptOpen(false)
                            notify('Загрузка принята: списки обновлены')
                        }}><CheckCircle2 size={16} /> Принять</button>
                    </>}>
                    <div className="flex flex-wrap gap-1.5">
                        <span className={CHIP}>Будет включено: {p.included}</span>
                        <span className={CHIP}>Будет исключено: {p.removed}</span>
                        <span className={CHIP}>Будет уточнено: {p.updated}</span>
                        <span className={CHIP}>Пропущено: {p.skipped}</span>
                        <span className={CHIP}>Принято как есть ошибок: {p.dismissed}</span>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">После принятия загрузку нельзя изменить — правки вносятся только загрузкой изменений или вручную в карточке кандидата.</p>
                    {!paperComplete(s.paper) && <p className="mt-3 text-sm text-amber-500">Сверка бумажной версии ещё не оформлена полностью.</p>}
                </Sheet>
            )}
            {rejectOpen && (
                <Sheet title={<h3 className="text-lg font-semibold">Отклонить загрузку?</h3>} onClose={() => setRejectOpen(false)}
                    footer={<>
                        <button type="button" className={BTN_GHOST} onClick={() => setRejectOpen(false)}>Отмена</button>
                        <button type="button" className={BTN} onClick={() => {
                            setDb(d => rejectSubmission(d, s.id))
                            setRejectOpen(false)
                            notify('Загрузка отклонена')
                        }}>Отклонить</button>
                    </>}>
                    <p className="text-sm">Файл «{s.fileName}» не попадёт в базу. Комиссия сможет загрузить исправленный файл.</p>
                </Sheet>
            )}
        </div>
    )
}

export default function UploadTab({ ctx, initialSubmissionId }: { ctx: Ctx; initialSubmissionId: number | null }) {
    const { db, setDb, notify } = ctx
    const fileRef = useRef<HTMLInputElement>(null)
    const [areaId, setAreaId] = useState(() => db.submissions.find(s => s.id === initialSubmissionId)?.areaId ?? db.areas[0].id)
    const [kind, setKind] = useState<ListKind>('main')
    const [type, setType] = useState<SubType>('list')
    const [scenario, setScenario] = useState<Scenario>('issues')
    const [year, setYear] = useState(String(new Date().getFullYear()))
    const [file, setFile] = useState<File | null>(null)
    const [activeId, setActiveId] = useState<number | null>(initialSubmissionId)

    const active = db.submissions.find(s => s.id === activeId) ?? null
    const history = db.submissions.filter(s => s.areaId === areaId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt) || b.id - a.id)
    const canUpload = type === 'list' || activeIn(db, areaId, kind).length >= 4

    const upload = () => {
        const sub = buildSubmission(db, {
            areaId, kind, type, scenario, year: Number(year) || new Date().getFullYear(), at: daysAgo(0),
            fileName: file?.name ?? `${type === 'list' ? 'spisok' : 'izmeneniya'}-${areaId}-${kind === 'main' ? 'osn' : 'zap'}-${year}.xlsx`,
        }, makeRng())
        sub.id = nextId()
        setDb(d => ({ ...d, submissions: [...d.submissions, sub] }))
        setActiveId(sub.id)
        setFile(null)
        notify(`Файл проверен: ошибок ${sub.findings.filter(f => f.severity === 'error').length}, вопросов ${sub.findings.filter(f => f.severity === 'question').length}`)
    }

    return (
        <div className="space-y-6">
            <Section title="Загрузка файла" hint="Демо: содержимое файла не разбирается — проверка имитируется на образце. Выберите, какой образец «загрузить».">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                        <span className={LABEL}>Территориальная комиссия</span>
                        <select className={FIELD} value={areaId} onChange={e => setAreaId(Number(e.target.value))}>
                            {db.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-muted-foreground">{platformName(db, db.areas.find(a => a.id === areaId)!.platformId)}</p>
                    </div>
                    <div>
                        <span className={LABEL}>Вид списка</span>
                        <Segmented<ListKind> value={kind} onChange={setKind} options={[{ id: 'main', label: 'Основной' }, { id: 'reserve', label: 'Запасной' }]} />
                    </div>
                    <div>
                        <span className={LABEL}>Форма</span>
                        <Segmented<SubType> value={type} onChange={setType} options={[{ id: 'list', label: 'Список' }, { id: 'changes', label: 'Изменения' }]} />
                    </div>
                    <div>
                        <span className={LABEL}>Год</span>
                        <input className={FIELD} inputMode="numeric" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                    </div>
                </div>
                <div className="mt-4">
                    <span className={LABEL}>Образец для проверки</span>
                    <Segmented<Scenario> value={scenario} onChange={setScenario}
                        options={[{ id: 'issues', label: 'С замечаниями' }, { id: 'clean', label: 'Без замечаний' }]} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    <button type="button" className={BTN_GHOST} onClick={() => fileRef.current?.click()}><Upload size={16} /> Выбрать файл</button>
                    <span className="text-sm text-muted-foreground">{file ? file.name : 'Файл не выбран — будет подставлено типовое имя'}</span>
                    <button type="button" className={`${BTN} ml-auto`} disabled={!canUpload} onClick={upload}><Upload size={16} /> Загрузить и проверить</button>
                </div>
                {!canUpload && <p className="mt-3 text-xs text-amber-500">Изменения можно загрузить только к действующему списку: сначала примите список этой комиссии.</p>}
            </Section>

            {active && <Review key={active.id} ctx={ctx} s={active} />}

            <Section title={`История загрузок — ${areaName(db, areaId)}`}>
                {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Файлы ещё не загружались.</p>
                ) : (
                    <div className="space-y-2">
                        {history.map(h => (
                            <div key={h.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2 ${h.id === activeId ? 'border-sky-500/50 bg-sky-500/10' : 'border-border bg-foreground/5'}`}>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{h.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{TYPE_LABEL[h.type]} · {KIND_LABEL[h.kind].toLowerCase()} · {h.year} · {fmtDate(h.uploadedAt)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={h.status} />
                                    <button type="button" className={BTN_GHOST} onClick={() => setActiveId(h.id)}>Открыть</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    )
}

