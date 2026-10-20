import { useMemo, useState } from 'react'
import { AlarmClock, ArrowDown, ArrowUp, CalendarDays, Eye, FilePlus2, Hourglass, FileCheck2, Scale, Search, SlidersHorizontal, X } from 'lucide-react'
import {
    COMPANIES, EXECUTORS, PROCEEDINGS, ROLE_LABEL, SECTION_LABEL, SPHERES, STATUS_LABEL, companyName, daysBetween, emptyInstance, fmtDate, isOverdue,
    mainCourt, mainNumber, shift, shortName, sphereName, todayIso, withHistory,
    type Case, type Role, type Section, type Status,
} from './data'
import ExportButtons from './ExportButtons'
import { BTN, BTN_GHOST, Dot, Empty, FIELD, Field, Segmented, Sheet, StatTile, StatusBadge, TD, TR, Table, type Ctx } from './ui'

type SortField = 'receipt' | 'task'

const emptyAdv = { proceeding: '', from: '', to: '', court: '', judge: '', party: '' }

const emptyForm = () => ({
    number: '', court: '', subject: '', sphereId: 1, proceeding: 'АПК', receiptDate: todayIso(), role: 'plaintiff' as Role,
    companyId: 1, executorId: 1, status: 'in_progress' as Status, currentTask: '', currentTaskDate: '', claim: '', directorControl: false,
})

export default function CasesTab({ ctx }: { ctx: Ctx }) {
    const { db } = ctx
    const [section, setSection] = useState<Section>('group')
    const [search, setSearch] = useState('')
    const [sphere, setSphere] = useState('')
    const [status, setStatus] = useState('')
    const [executor, setExecutor] = useState('')
    const [company, setCompany] = useState('')
    const [special, setSpecial] = useState<'' | 'overdue' | 'control' | 'soon'>('')
    const [sortBy, setSortBy] = useState<SortField>('receipt')
    const [desc, setDesc] = useState(true)
    const [creating, setCreating] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [adv, setAdv] = useState(emptyAdv)
    const [form, setForm] = useState(emptyForm)

    const inSection = useMemo(() => db.cases.filter(c => c.section === section), [db.cases, section])

    const tiles = useMemo(() => {
        const soon = (c: Case) => c.instances.some(i => i.nextHearing && daysBetween(todayIso(), i.nextHearing) >= 0 && daysBetween(todayIso(), i.nextHearing) <= 14)
        return {
            total: inSection.length,
            active: inSection.filter(c => c.status === 'in_progress').length,
            enforcement: inSection.filter(c => c.status === 'enforcement').length,
            overdue: inSection.filter(isOverdue).length,
            soon: inSection.filter(c => c.status !== 'terminated' && soon(c)).length,
            control: inSection.filter(c => c.directorControl && c.status !== 'terminated').length,
            soonFn: soon,
        }
    }, [inSection])

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase()
        const list = inSection.filter(c => {
            if (sphere && c.sphereId !== Number(sphere)) return false
            if (status && c.status !== status) return false
            if (executor && c.executorId !== Number(executor)) return false
            if (company && c.companyId !== Number(company)) return false
            if (special === 'overdue' && !isOverdue(c)) return false
            if (special === 'control' && !(c.directorControl && c.status !== 'terminated')) return false
            if (special === 'soon' && !(c.status !== 'terminated' && tiles.soonFn(c))) return false
            if (q) {
                // как в оригинале: № дела (любой инстанции), истец, ответчик, предмет спора
                const hay = [
                    c.subject, ...c.instances.map(i => i.number), ...c.extraNumbers,
                    ...c.parties.filter(p => p.role === 'plaintiff' || p.role === 'defendant').map(p => p.name),
                ].join(' ').toLowerCase()
                if (!hay.includes(q)) return false
            }
            const has = (v: string, part: string) => v.toLowerCase().includes(part.trim().toLowerCase())
            if (adv.proceeding && !has(c.proceeding, adv.proceeding)) return false
            if (adv.from && c.receiptDate < adv.from) return false
            if (adv.to && c.receiptDate > adv.to) return false
            if (adv.court && !c.instances.some(i => has(i.court, adv.court))) return false
            if (adv.judge && !c.instances.some(i => has(i.judge, adv.judge))) return false
            if (adv.party && !c.parties.some(p => has(`${p.name} ${p.inn}`, adv.party))) return false
            return true
        })
        const dir = desc ? -1 : 1
        return [...list].sort((a, b) => {
            if (sortBy === 'receipt') return a.receiptDate.localeCompare(b.receiptDate) * dir
            const ax = a.currentTaskDate ?? '9999', bx = b.currentTaskDate ?? '9999'
            return ax.localeCompare(bx) * dir
        })
    }, [inSection, search, sphere, status, executor, company, special, adv, sortBy, desc, tiles])

    const submit = () => {
        if (!form.subject.trim()) { ctx.notify('Укажите предмет спора'); return }
        const id = db.seq + 1
        const claim = Number(form.claim.replace(/\s/g, '')) || 0
        const base: Case = {
            id, section: form.directorControl ? 'resonant' : form.companyId === 1 ? 'group' : 'subsidiaries', projectId: null,
            sphereId: form.sphereId, subject: form.subject.trim(), proceeding: form.proceeding, receiptDate: form.receiptDate || todayIso(),
            role: form.role, companyId: form.companyId, executorId: form.executorId, status: form.status, outcome: null, outcomeComment: '',
            currentTask: form.currentTask.trim(), currentTaskDate: form.currentTaskDate || null, directorControl: form.directorControl,
            instances: [emptyInstance('first', form.court.trim(), form.number.trim())],
            parties: [{ id: id + 1, role: form.role, name: companyName(form.companyId), inn: '', ours: true }],
            fin: { claim, costs: 0, awarded: null, awardedCosts: null }, programs: [], extraNumbers: [],
            enforcement: { writIssued: false, transferredTo: 'none', deadline: null, note: '' }, notes: [], history: [], linkedIds: [],
        }
        const created = withHistory(base, id + 2, 'Дело создано')
        ctx.setDb(d => ({ ...d, seq: id + 2, cases: [created, ...d.cases] }))
        setSection(created.section)
        setCreating(false)
        setForm(emptyForm())
        ctx.notify('Дело создано')
        ctx.openCase(id)
    }

    const toggleSpecial = (v: typeof special) => setSpecial(s => (s === v ? '' : v))
    const advActive = Object.values(adv).some(Boolean)
    const hasFilters = !!(advActive || search || sphere || status || executor || company || special)

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Segmented<Section>
                    value={section}
                    onChange={setSection}
                    options={(Object.keys(SECTION_LABEL) as Section[]).map(s => ({ id: s, label: SECTION_LABEL[s] }))}
                />
                <div className="flex flex-wrap items-center gap-2">
                    <ExportButtons formats={['excel', 'pdf']} what="список дел с учётом текущих фильтров" />
                    <button type="button" className={BTN} onClick={() => setCreating(true)}><FilePlus2 size={15} /> Новое дело</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <StatTile title="Всего дел" icon={Scale} value={tiles.total} onClick={() => { setSpecial(''); setStatus('') }} />
                <StatTile title="В работе" icon={Hourglass} value={tiles.active} onClick={() => { setSpecial(''); setStatus('in_progress') }} />
                <StatTile title="На исполнении" icon={FileCheck2} value={tiles.enforcement} onClick={() => { setSpecial(''); setStatus('enforcement') }} />
                <StatTile title="Просрочены задачи" icon={AlarmClock} tone="text-rose-500" value={tiles.overdue} onClick={() => toggleSpecial('overdue')} />
                <StatTile title="Заседания за 14 дней" icon={CalendarDays} tone="text-amber-500" value={tiles.soon} onClick={() => toggleSpecial('soon')} />
                <StatTile title="На контроле директора" icon={Eye} tone="text-violet-500" value={tiles.control} onClick={() => toggleSpecial('control')} />
            </div>

            <div className="card-block rounded-2xl p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <div className="relative lg:col-span-2">
                        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            className={`${FIELD} !rounded-full pl-10 pr-9`}
                            placeholder="Поиск по № дела, истцу, ответчику, предмету спора..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button type="button" aria-label="Очистить поиск" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch('')}>
                                <X size={15} />
                            </button>
                        )}
                    </div>
                    <button type="button" className={`${BTN_GHOST} lg:col-span-1`} onClick={() => setShowAdvanced(true)}>
                        <SlidersHorizontal size={15} /> Поиск по реквизитам{advActive && ' •'}
                    </button>
                    <select className={FIELD} value={sphere} onChange={e => setSphere(e.target.value)} aria-label="Сфера">
                        <option value="">Все сферы</option>
                        {SPHERES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select className={FIELD} value={status} onChange={e => setStatus(e.target.value)} aria-label="Статус">
                        <option value="">Все статусы</option>
                        {(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                    <select className={FIELD} value={executor} onChange={e => setExecutor(e.target.value)} aria-label="Исполнитель">
                        <option value="">Все исполнители</option>
                        {EXECUTORS.map(e => <option key={e.id} value={e.id}>{shortName(e.name)}</option>)}
                    </select>
                    <select className={FIELD} value={company} onChange={e => setCompany(e.target.value)} aria-label="Компания группы">
                        <option value="">Все компании</option>
                        {COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                        Найдено: {rows.length}
                        {special && <> · фильтр: {special === 'overdue' ? 'просроченные задачи' : special === 'soon' ? 'заседания за 14 дней' : 'на контроле директора'}</>}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        <span>Сортировать по</span>
                        <select className={`${FIELD} !w-auto !py-1.5`} value={sortBy} onChange={e => setSortBy(e.target.value as SortField)} aria-label="Сортировка">
                            <option value="receipt">дате поступления</option>
                            <option value="task">сроку актуальной задачи</option>
                        </select>
                        <button type="button" className={BTN_GHOST} onClick={() => setDesc(v => !v)}>{desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />}{desc ? 'Сначала новые' : 'Сначала старые'}</button>
                        {hasFilters && (
                            <button type="button" className={BTN_GHOST} onClick={() => { setSearch(''); setSphere(''); setStatus(''); setExecutor(''); setCompany(''); setSpecial(''); setAdv(emptyAdv) }}>Сбросить</button>
                        )}
                    </div>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="card-block rounded-2xl p-4"><Empty icon={Scale} text="Дел по выбранным условиям нет" /></div>
            ) : (
                <Table head={['Дело', 'Предмет спора', 'Статус', 'Роль', 'Исполнитель', 'Актуальная задача', 'Поступило']}>
                    {rows.map(c => (
                        <tr key={c.id} className={`${TR} cursor-pointer`} onClick={() => ctx.openCase(c.id)}>
                            <td className={`${TD} whitespace-nowrap align-top`}>
                                <p className="font-semibold">{mainNumber(c)}</p>
                                <p className="max-w-[14rem] truncate text-xs text-muted-foreground">{mainCourt(c)}</p>
                            </td>
                            <td className={`${TD} min-w-[18rem] align-top`}>
                                <p className="font-medium">{c.subject}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{sphereName(c.sphereId)} · {c.proceeding} · {companyName(c.companyId)}</p>
                            </td>
                            <td className={`${TD} align-top`}><StatusBadge status={c.status} /></td>
                            <td className={`${TD} whitespace-nowrap align-top`}>{ROLE_LABEL[c.role]}</td>
                            <td className={`${TD} whitespace-nowrap align-top`}>{shortName(EXECUTORS.find(e => e.id === c.executorId)?.name ?? '—')}</td>
                            <td className={`${TD} min-w-[14rem] align-top`}>
                                {c.currentTask ? (
                                    <div className="flex items-start gap-2">
                                        <span className="mt-1.5"><Dot date={c.currentTaskDate} done={c.status === 'terminated'} /></span>
                                        <div>
                                            <p>{c.currentTask}</p>
                                            <p className="text-xs text-muted-foreground">до {fmtDate(c.currentTaskDate)}</p>
                                        </div>
                                    </div>
                                ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className={`${TD} whitespace-nowrap align-top`}>{fmtDate(c.receiptDate)}</td>
                        </tr>
                    ))}
                </Table>
            )}

            {creating && (
                <Sheet
                    title={<h2 className="text-lg font-semibold">Новое дело</h2>}
                    onClose={() => setCreating(false)}
                    footer={<><button type="button" className={BTN_GHOST} onClick={() => setCreating(false)}>Отмена</button><button type="button" className={BTN} onClick={submit}>Создать дело</button></>}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Номер дела"><input className={FIELD} value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="А71-0000/2026" /></Field>
                        <Field label="Суд"><input className={FIELD} value={form.court} onChange={e => setForm({ ...form, court: e.target.value })} placeholder="Арбитражный суд Северного округа" /></Field>
                        <Field label="Предмет спора *" className="sm:col-span-2"><textarea rows={2} className={FIELD} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></Field>
                        <Field label="Сфера">
                            <select className={FIELD} value={form.sphereId} onChange={e => setForm({ ...form, sphereId: Number(e.target.value) })}>{SPHERES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        </Field>
                        <Field label="Вид судопроизводства">
                            <select className={FIELD} value={form.proceeding} onChange={e => setForm({ ...form, proceeding: e.target.value })}>{PROCEEDINGS.map(p => <option key={p}>{p}</option>)}</select>
                        </Field>
                        <Field label="Компания группы">
                            <select className={FIELD} value={form.companyId} onChange={e => setForm({ ...form, companyId: Number(e.target.value) })}>{COMPANIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        </Field>
                        <Field label="Роль компании в деле">
                            <select className={FIELD} value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>{(Object.keys(ROLE_LABEL) as Role[]).map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                        </Field>
                        <Field label="Исполнитель">
                            <select className={FIELD} value={form.executorId} onChange={e => setForm({ ...form, executorId: Number(e.target.value) })}>{EXECUTORS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
                        </Field>
                        <Field label="Статус">
                            <select className={FIELD} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>{(Object.keys(STATUS_LABEL) as Status[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select>
                        </Field>
                        <Field label="Дата поступления"><input type="date" className={FIELD} value={form.receiptDate} onChange={e => setForm({ ...form, receiptDate: e.target.value })} /></Field>
                        <Field label="Сумма требований, ₽"><input inputMode="numeric" className={FIELD} value={form.claim} onChange={e => setForm({ ...form, claim: e.target.value.replace(/[^\d\s]/g, '') })} placeholder="0" /></Field>
                        <Field label="Актуальная задача"><input className={FIELD} value={form.currentTask} onChange={e => setForm({ ...form, currentTask: e.target.value })} /></Field>
                        <Field label="Срок задачи"><input type="date" min={shift(-365)} className={FIELD} value={form.currentTaskDate} onChange={e => setForm({ ...form, currentTaskDate: e.target.value })} /></Field>
                        <label className="flex cursor-pointer items-center gap-2 text-sm sm:col-span-2">
                            <input type="checkbox" className="h-4 w-4" checked={form.directorControl} onChange={e => setForm({ ...form, directorControl: e.target.checked })} />
                            Резонансное дело — на контроле генерального директора
                        </label>
                    </div>
                </Sheet>
            )}
            {showAdvanced && (
                <Sheet
                    title={<h2 className="flex items-center gap-2 text-lg font-semibold"><Search size={17} className="text-violet-500" />Поиск по реквизитам</h2>}
                    onClose={() => setShowAdvanced(false)}
                    footer={<><button type="button" className={BTN_GHOST} onClick={() => setAdv(emptyAdv)}>Сбросить</button><button type="button" className={BTN} onClick={() => setShowAdvanced(false)}>Применить</button></>}
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Вид судопроизводства" className="sm:col-span-2"><input className={FIELD} list="jd-proceedings" value={adv.proceeding} onChange={e => setAdv({ ...adv, proceeding: e.target.value })} /></Field>
                        <datalist id="jd-proceedings">{PROCEEDINGS.map(p => <option key={p} value={p} />)}</datalist>
                        <Field label="Дата поступления с"><input type="date" className={FIELD} value={adv.from} onChange={e => setAdv({ ...adv, from: e.target.value })} /></Field>
                        <Field label="по"><input type="date" className={FIELD} value={adv.to} onChange={e => setAdv({ ...adv, to: e.target.value })} /></Field>
                        <Field label="Суд" className="sm:col-span-2"><input className={FIELD} value={adv.court} onChange={e => setAdv({ ...adv, court: e.target.value })} /></Field>
                        <Field label="Судья" className="sm:col-span-2"><input className={FIELD} value={adv.judge} onChange={e => setAdv({ ...adv, judge: e.target.value })} /></Field>
                        <Field label="Участник дела (наименование или ИНН)" className="sm:col-span-2"><input className={FIELD} value={adv.party} onChange={e => setAdv({ ...adv, party: e.target.value })} /></Field>
                    </div>
                </Sheet>
            )}
        </div>
    )
}
