import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, BarChart3, Building2, ChevronDown, ChevronRight, Edit, Globe, Mail, MapPin, Phone, Save, Search, User, X } from 'lucide-react'
import { ORG_NAME, clone, makeSeed, type Passport, type Territory } from './data'
import { BTN, BTN_GHOST, FIELD, fillDot, tabFill } from './ui'
import { GROUPS, PASSPORT_TABS, isTabId, type TabId } from './tabs'
import { BudgetView, DemographicView, EconomyView, GeneralView, InfrastructureView, LeaderView, MonitoringView, OverviewView, SocialView } from './views'
import { EditView, isEditable } from './edit'
import ReportsTab from './ReportsTab'

const fillPct = (p: Passport): number => {
    const parts = PASSPORT_TABS.map(t => tabFill(t.sections, p)).filter((x): x is number => x !== undefined)
    return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)
}

export default function PassportsExample() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [territories, setTerritories] = useState<Territory[]>(makeSeed)
    const [toast, setToast] = useState('')

    const notify = useCallback((text: string) => {
        setToast(text)
        window.setTimeout(() => setToast(''), 3200)
    }, [])

    const current = id ? territories.find(t => t.id === Number(id)) : undefined

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>
                {current
                    ? <PassportPage key={current.id} t={current} setTerritories={setTerritories} notify={notify} onBack={() => navigate('/examples/passports')} />
                    : <TerritoryList territories={territories} open={tid => navigate(`/examples/passports/${tid}`)} />}
            </div>
            {toast && <div role="status" className="fixed bottom-6 left-1/2 z-[130] max-w-[92vw] -translate-x-1/2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-xl">{toast}</div>}
        </div>
    )
}

function Hero({ title, text, small }: { title: string; text?: string; small?: boolean }) {
    return (
        <section className={`relative mt-4 overflow-hidden rounded-2xl px-6 text-white sm:px-12 ${small ? 'py-5' : 'py-8'}`} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}>
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300"><Building2 size={14} /> Территории присутствия</span>
            <h1 className={`mt-3 font-bold leading-tight ${small ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}>{title}</h1>
            {!small && <div className="mt-4 h-px w-16 bg-sky-400" />}
            {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{text}</p>}
            {!small && <p className="mt-3 text-xs text-white/40">{ORG_NAME} · демо-данные вымышлены, изменения живут до перезагрузки страницы</p>}
        </section>
    )
}

function TerritoryList({ territories, open }: { territories: Territory[]; open: (id: number) => void }) {
    const [q, setQ] = useState('')
    const list = territories.filter(t => t.name.toLowerCase().includes(q.trim().toLowerCase()))
    return (
        <>
            <Hero title="Паспорта территорий" text="Единый паспорт каждой территории присутствия: население, экономика, бюджет, инфраструктура, социальная сфера, руководитель и отчёты — вся картина в одном месте." />
            <div className="relative mx-auto mb-8 mt-8 max-w-md">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск территории..." className={`${FIELD} pl-11 pr-10`} />
                {q && <button type="button" aria-label="Очистить поиск" onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-foreground/10"><X size={14} /></button>}
            </div>
            {list.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Ничего не найдено</p>
            ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {list.map(t => (
                        <button key={t.id} type="button" onClick={() => open(t.id)} className="card-block group rounded-2xl p-5 text-left transition-transform hover:-translate-y-1">
                            <div className="mb-4 flex items-center gap-3">
                                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-border bg-foreground/5"><User size={22} className="text-muted-foreground" aria-hidden /></span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium leading-tight">{t.passport.leader.name || 'Руководитель не указан'}</span>
                                    <span className="block text-xs text-muted-foreground">{t.passport.leader.post}</span>
                                </span>
                                <ChevronRight size={18} className="flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                            <h3 className="font-semibold">{t.name}</h3>
                            <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><MapPin size={12} />{t.passport.main_info.adm_centre}</p>
                            <p className="mt-1 text-xs text-muted-foreground">Заполнено {fillPct(t.passport)}%</p>
                        </button>
                    ))}
                </div>
            )}
        </>
    )
}

function PassportPage({ t, setTerritories, notify, onBack }: { t: Territory; setTerritories: (f: (t: Territory[]) => Territory[]) => void; notify: (s: string) => void; onBack: () => void }) {
    const [params, setParams] = useSearchParams()
    const tabParam = params.get('tab')
    const tab: TabId = isTabId(tabParam) ? tabParam : 'overview'
    const setTab = useCallback((id: TabId) => setParams(id === 'overview' ? {} : { tab: id }, { replace: true }), [setParams])

    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState<Passport>(() => clone(t.passport))
    const saved = t.passport
    const view = editing ? draft : saved
    const dirty = useMemo(() => editing && JSON.stringify(draft) !== JSON.stringify(saved), [editing, draft, saved])

    const save = (): void => {
        setTerritories(list => list.map(x => (x.id === t.id ? { ...x, passport: draft } : x)))
        setEditing(false)
        notify('Паспорт сохранён')
    }
    const cancel = (): void => { setDraft(clone(saved)); setEditing(false) }
    const startEdit = (): void => { setDraft(clone(saved)); setEditing(true) }
    // отчёты сохраняются сразу, как и в оригинале (загрузка/удаление файла не требует режима правки)
    const setReports = (f: (p: Passport) => Passport): void => setTerritories(list => list.map(x => (x.id === t.id ? { ...x, passport: f(x.passport) } : x)))

    const m = view.main_info
    const back = (): void => { if (dirty && !window.confirm('Есть несохранённые изменения. Уйти без сохранения?')) return; onBack() }
    const editableHere = isEditable(tab)

    return (
        <>
            <Hero small title={m.municipality || 'Территория'} />
            <section className="-mt-3 rounded-b-2xl bg-slate-900/95 px-6 pb-5 pt-4 text-white sm:px-12" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <p className="flex items-center gap-2 text-sm text-white/80"><MapPin size={15} className="text-white/60" />{m.adm_centre || 'Центр не указан'}</p>
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium"><BarChart3 size={14} /> Заполнено {fillPct(view)}%</p>
                    </div>
                    {!editing && editableHere && <button type="button" onClick={startEdit} className={BTN}><Edit size={15} /> Редактировать</button>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/20 pt-4 md:grid-cols-4">
                    {[[MapPin, 'Адрес', m.address], [Phone, 'Телефон', m.telephone], [Mail, 'Email', m.email], [Globe, 'Сайт', m.site]].map(([Icon, label, val]) => {
                        const I = Icon as typeof MapPin
                        return val ? (
                            <div key={String(label)} className="flex min-w-0 items-center gap-3"><I size={16} className="flex-shrink-0 text-white/60" /><div className="min-w-0"><p className="text-xs text-white/50">{String(label)}</p><p className="truncate text-sm text-white/85">{String(val)}</p></div></div>
                        ) : null
                    })}
                </div>
            </section>

            <button type="button" onClick={back} className={`${BTN_GHOST} mb-4 mt-4`}><ChevronRight size={14} className="rotate-180" /> К списку территорий</button>

            <Nav tab={tab} onChange={setTab} p={view} />

            <div className="mt-4" role="tabpanel">
                {editing && editableHere ? <EditView tab={tab} p={draft} setP={f => setDraft(f)} /> : <TabBody tab={tab} p={view} setTab={setTab} setReports={setReports} notify={notify} />}
            </div>

            {editing && (
                <div className="sticky bottom-4 z-[60] mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur">
                    <span className="flex items-center gap-2 text-sm"><span className={`h-2 w-2 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`} aria-hidden />{dirty ? 'Есть несохранённые изменения' : 'Режим редактирования'}</span>
                    {!editableHere && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><AlertCircle size={14} /> У этой вкладки нет полей для правки</span>}
                    <div className="flex gap-2">
                        <button type="button" onClick={cancel} className={BTN_GHOST}><X size={15} /> Отмена</button>
                        <button type="button" onClick={save} className={BTN}><Save size={15} /> Сохранить</button>
                    </div>
                </div>
            )}
        </>
    )
}

function TabBody({ tab, p, setTab, setReports, notify }: { tab: TabId; p: Passport; setTab: (t: TabId) => void; setReports: (f: (p: Passport) => Passport) => void; notify: (s: string) => void }) {
    switch (tab) {
        case 'overview': return <OverviewView p={p} onNavigate={setTab} />
        case 'general': return <GeneralView p={p} />
        case 'leader': return <LeaderView p={p} />
        case 'demographic': return <DemographicView p={p} />
        case 'economy': return <EconomyView p={p} />
        case 'budget': return <BudgetView p={p} />
        case 'infrastructure': return <InfrastructureView p={p} />
        case 'social': return <SocialView p={p} />
        case 'monitoring': return <MonitoringView p={p} />
        case 'reports': return <ReportsTab p={p} setP={setReports} notify={notify} />
    }
}

function Nav({ tab, onChange, p }: { tab: TabId; onChange: (t: TabId) => void; p: Passport }) {
    const current = PASSPORT_TABS.find(x => x.id === tab)
    return (
        <>
            <div className="relative md:hidden">
                <label htmlFor="passport-section" className="sr-only">Раздел паспорта</label>
                <select id="passport-section" value={tab} onChange={e => onChange(e.target.value as TabId)} className={`${FIELD} appearance-none pr-10`}>
                    {GROUPS.map(g => g.tabs.length === 1 && g.tabs[0].id === g.id
                        ? <option key={g.id} value={g.tabs[0].id}>{g.tabs[0].label}</option>
                        : <optgroup key={g.id} label={g.label}>{g.tabs.map(x => { const f = tabFill(x.sections, p); return <option key={x.id} value={x.id}>{x.label}{f !== undefined ? ` — ${Math.round(f * 100)}%` : ''}</option> })}</optgroup>)}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden />
                <span className="sr-only">Выбрано: {current?.label}</span>
            </div>
            <div role="tablist" aria-label="Разделы паспорта" className="hidden flex-wrap gap-x-6 gap-y-3 md:flex">
                {GROUPS.map(g => (
                    <div key={g.id} role="presentation" className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-500">{g.label}</span>
                        <div role="presentation" className="flex flex-wrap gap-1.5">
                            {g.tabs.map(x => {
                                const dot = fillDot(tabFill(x.sections, p))
                                const active = x.id === tab
                                return (
                                    <button key={x.id} type="button" role="tab" aria-selected={active} onClick={() => onChange(x.id)}
                                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${active ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'border border-border bg-foreground/5 text-muted-foreground hover:text-foreground'}`}>
                                        <x.icon size={14} /> {x.label}
                                        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot.cls}`} title={dot.title} aria-label={dot.title} />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}
