import { useState } from 'react'
import {
    AlertTriangle, BarChart3, Baby, BookOpen, Bike, Briefcase, CheckCircle2, ClipboardCheck, Droplets, Factory, FileText, GraduationCap, Heart, Home,
    ListOrdered, MapPin, Music, Percent, Phone, RussianRuble, Scale, Stethoscope, Tractor, TrendingDown, TrendingUp, User, Users, Wallet, Route, Landmark, Truck, Thermometer,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Passport } from './data'
import {
    BTN, BarRows, CardBlock, Collapsible, DataTable, Donut, EmptyHint, Fact, FactGrid, Segmented, Stat, StatGrid, StackedBar, StatusBadge, Timeline, TrendChart, VIZ,
    fmtNum, fmtPct, fmtSigned, tabFill, type Column, type Tone,
} from './ui'
import { PASSPORT_TABS, type TabId } from './tabs'

const link = 'text-sky-500 hover:underline dark:text-sky-400'
const share = (part: number | null, total: number | null): number | null => (part === null || !total ? null : (part / total) * 100)
const toMln = (v: number | null): number | null => (v === null ? null : Math.round(v / 100) / 10)
const telHref = (s: string): string => `tel:${s.replace(/[^\d+]/g, '')}`

// ==================== Обзор ====================

export function OverviewView({ p, onNavigate }: { p: Passport; onNavigate: (t: TabId) => void }) {
    const filled = PASSPORT_TABS.map(t => ({ tab: t, fill: tabFill(t.sections, p) })).filter((x): x is { tab: (typeof PASSPORT_TABS)[number]; fill: number } => x.fill !== undefined)
    const total = Math.round((filled.reduce((a, b) => a + b.fill, 0) / filled.length) * 100)
    const incomplete = filled.filter(x => x.fill < 0.9).sort((a, b) => a.fill - b.fill)
    const l = p.leader
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <CardBlock title="Руководитель" icon={User} bg>
                    <button type="button" onClick={() => onNavigate('leader')} className="flex w-full items-center gap-4 text-left">
                        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-border bg-foreground/5"><User size={28} className="text-muted-foreground" aria-hidden /></span>
                        <span className="min-w-0">
                            <span className="block font-semibold leading-tight">{l.name || 'Не указан'}</span>
                            <span className="block text-xs text-muted-foreground">{l.post}</span>
                        </span>
                    </button>
                </CardBlock>
                <CardBlock title="Заполненность паспорта" icon={CheckCircle2} bg>
                    <div className="mb-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-sky-500">{total}%</span>
                        <span className="text-xs text-muted-foreground">{incomplete.length === 0 ? 'Все разделы заполнены' : `Требуют внимания: ${incomplete.length}`}</span>
                    </div>
                    <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${total}%` }} /></div>
                    <div className="flex flex-wrap gap-1.5">
                        {incomplete.map(({ tab, fill }) => (
                            <button key={tab.id} type="button" onClick={() => onNavigate(tab.id)} className="rounded-lg border border-border bg-foreground/5 px-2.5 py-1 text-xs font-medium hover:bg-foreground/10">
                                {tab.label} · {Math.round(fill * 100)}%
                            </button>
                        ))}
                    </div>
                </CardBlock>
                <CardBlock title="Последние отчёты" icon={FileText} bg>
                    {p.reports.length === 0 ? <p className="text-sm text-muted-foreground">Отчёты ещё не загружены</p> : (
                        <ul className="space-y-2">
                            {p.reports.slice(0, 3).map(r => (
                                <li key={r.file_id} className="flex items-center gap-2 text-sm"><FileText size={15} className="flex-shrink-0 text-muted-foreground" aria-hidden /><span className="truncate">{r.name}</span></li>
                            ))}
                        </ul>
                    )}
                    <button type="button" onClick={() => onNavigate('reports')} className={`${BTN} mt-3`}>Все отчёты</button>
                </CardBlock>
            </div>

            <StatGrid>
                <Stat label="Численность населения" value={p.demographic.population_total} suffix="чел" icon={Users} />
                <Stat label="Площадь территории" value={p.main_info.area} suffix="км²" icon={MapPin} />
                <Stat label="Средняя зарплата" value={p.demographic.salary_district} suffix="₽" icon={RussianRuble} />
                <Stat label="Уровень безработицы" value={p.demographic.unemployment_district} suffix="%" digits={1} icon={TrendingDown} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Экономика" icon={TrendingUp} bg>
                    <MetricRows rows={[
                        ['Доход на 1 жителя', p.economy.nnd_per_person, 'тыс. ₽'], ['Прирост дохода', p.economy.nnd_growth_per_person, 'тыс. ₽'],
                        ['Субсидии на 1 жителя', p.economy.subsidies_per_person, 'тыс. ₽'], ['Финансовые возможности', p.economy.finance_possibility, '%'],
                    ]} />
                </CardBlock>
                <CardBlock title="Бюджет" icon={RussianRuble} bg>
                    <MetricRows rows={[
                        ['Доходы', p.budget.income_fact, 'тыс. ₽', 'positive'], ['Расходы', p.budget.costs_fact, 'тыс. ₽', 'negative'],
                        ['Баланс', p.budget.deficit_fact, 'тыс. ₽', 'balance'], ['Долг территории', p.budget.mo_duty, 'тыс. ₽'],
                    ]} />
                </CardBlock>
                <CardBlock title="Инфраструктура" icon={Landmark}>
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <Mini label="Дороги" v={p.roads.total_km} s="км" icon={Truck} />
                        <Mini label="Жилой фонд" v={p.housing.total_area_thousand_m2} s="тыс. м²" icon={Home} />
                        <Mini label="Аварийное жильё" v={p.housing.emergency_thousand_m2} s="тыс. м²" icon={AlertTriangle} />
                        <Mini label="Центр. отопление" v={p.housing.central_heating_thousand_m2} s="тыс. м²" icon={Thermometer} />
                    </div>
                </CardBlock>
                <CardBlock title="Социальная сфера" icon={Heart}>
                    <div className="grid grid-cols-2 gap-3 p-4">
                        <Mini label="Школы" v={p.education.schools} icon={GraduationCap} />
                        <Mini label="Детсады" v={p.education.preschool_institutions} icon={Baby} />
                        <Mini label="Врачи" v={p.healthcare.doctors} icon={Stethoscope} />
                        <Mini label="Спортсооружения" v={p.culture_sport.sports_facilities} icon={Bike} />
                    </div>
                </CardBlock>
            </div>
        </div>
    )
}

function MetricRows({ rows }: { rows: [string, number | null, string, ('positive' | 'negative' | 'balance')?][] }) {
    return (
        <div>
            {rows.map(([label, v, s, kind]) => {
                const color = kind === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : kind === 'negative' ? 'text-rose-600 dark:text-rose-400' : kind === 'balance' && v ? (v > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400') : ''
                return (
                    <div key={label} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className={`text-sm font-medium ${color}`}>{fmtNum(v, 1)}{v !== null && ` ${s}`}</span>
                    </div>
                )
            })}
        </div>
    )
}

function Mini({ label, v, s, icon: Icon }: { label: string; v: number | null; s?: string; icon: typeof Home }) {
    return (
        <div className="flex items-center gap-3 rounded-lg bg-foreground/5 p-3">
            <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/10"><Icon size={15} className="text-sky-500" aria-hidden /></span>
            <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold">{fmtNum(v, 1)}{s && v !== null && <span className="text-xs font-normal text-muted-foreground"> {s}</span>}</p></div>
        </div>
    )
}

// ==================== Основное ====================

export function GeneralView({ p }: { p: Passport }) {
    const m = p.main_info
    const secs = PASSPORT_TABS.filter(t => t.sections)
    const done = secs.filter(t => (tabFill(t.sections, p) ?? 0) >= 0.9).length
    const total = Math.round((secs.reduce((a, t) => a + (tabFill(t.sections, p) ?? 0), 0) / secs.length) * 100)
    return (
        <div className="space-y-6">
            <StatGrid cols={3}>
                <Stat label="Площадь территории" value={m.area} suffix="км²" icon={MapPin} />
                <Stat label="Расстояние от управляющей компании" value={m.distance} suffix="км" icon={MapPin} />
                <Stat label="Заполненность паспорта" value={total} suffix="%" icon={ClipboardCheck} hint={`Заполнено разделов: ${done} из ${secs.length} · отчётов: ${fmtNum(p.reports.length)}`} />
            </StatGrid>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Территория" icon={MapPin} bg>
                    <FactGrid>
                        <Fact label="Название">{m.municipality || null}</Fact>
                        <Fact label="Центр территории">{m.adm_centre || null}</Fact>
                        <div className="sm:col-span-2"><Fact label="Адрес офиса управления">{m.address || null}</Fact></div>
                    </FactGrid>
                </CardBlock>
                <CardBlock title="Контакты" icon={Phone} bg>
                    <FactGrid>
                        <Fact label="Телефон">{m.telephone ? <a href={telHref(m.telephone)} className={link}>{m.telephone}</a> : null}</Fact>
                        <Fact label="Email">{m.email ? <a href={`mailto:${m.email}`} className={link}>{m.email}</a> : null}</Fact>
                        <div className="sm:col-span-2"><Fact label="Сайт территории">{m.site ? <span className="break-all">{m.site}</span> : null}</Fact></div>
                    </FactGrid>
                </CardBlock>
            </div>
        </div>
    )
}

// ==================== Руководитель ====================

const COLLAPSED = 5

export function LeaderView({ p }: { p: Passport }) {
    const l = p.leader
    const history = l.work_history.filter(x => x.trim())
    const [all, setAll] = useState(false)
    const shown = all ? history : history.slice(0, COLLAPSED)
    return (
        <div className="space-y-6">
            <div className="card-block rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-2xl border border-border bg-foreground/5"><User size={56} className="text-muted-foreground" aria-hidden /></div>
                    <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-500">Руководитель</span>
                        <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{l.name || 'Не указан'}</h2>
                        {l.post && <p className="mt-1 text-muted-foreground">{l.post}</p>}
                    </div>
                </div>
            </div>
            <CardBlock title="Основные сведения" icon={User} bg>
                <FactGrid>
                    <Fact label="Дата рождения">{l.birthday || null}</Fact>
                    <Fact label="Место рождения">{l.birthday_city || null}</Fact>
                    <Fact label="Мобильный телефон">{l.mobile ? <a href={telHref(l.mobile)} className={link}>{l.mobile}</a> : null}</Fact>
                    <Fact label="Email">{l.email ? <a href={`mailto:${l.email}`} className={link}>{l.email}</a> : null}</Fact>
                </FactGrid>
            </CardBlock>
            <Collapsible title="Образование и специальность">
                <FactGrid>
                    <Fact label="Образование"><span className="font-normal">{l.education || null}</span></Fact>
                    <Fact label="Специальность"><span className="font-normal">{l.speciality || null}</span></Fact>
                </FactGrid>
            </Collapsible>
            <CardBlock title="Трудовая деятельность" icon={Briefcase} bg>
                {history.length === 0 ? <EmptyHint text="Данные о трудовой деятельности не заполнены" /> : (
                    <>
                        <Timeline items={shown} />
                        {history.length > COLLAPSED && <button type="button" onClick={() => setAll(a => !a)} className={`${BTN} mt-4`}>{all ? 'Свернуть' : `Показать все (${history.length})`}</button>}
                    </>
                )}
            </CardBlock>
        </div>
    )
}

// ==================== Демография ====================

interface Town { name: string; population: number | null }

const series = (items: { year: number; count?: number | null; rur?: number | null }[], key: 'count' | 'rur'): { x: number; y: number }[] =>
    items.filter(w => w[key] !== null && w[key] !== undefined).map(w => ({ x: w.year, y: w[key] as number })).sort((a, b) => a.x - b.x)

export function DemographicView({ p }: { p: Passport }) {
    const d = p.demographic
    const total = d.population_total
    const salaryD = d.salary_district
    const salaryR = d.salary_region
    const unD = d.unemployment_district
    const unR = d.unemployment_region
    const towns = d.large_towns.filter(t => t.name)
    const workers = series(d.workers, 'count')
    const level = series(d.level_life, 'rur')
    const cols: Column<Town>[] = [
        { key: 'name', header: 'Населённый пункт', render: t => t.name, sortValue: t => t.name },
        { key: 'pop', header: 'Население, чел', align: 'right', render: t => fmtNum(t.population), sortValue: t => t.population ?? -1 },
        { key: 'share', header: 'Доля территории', align: 'right', render: t => (total && t.population !== null ? fmtPct((t.population / total) * 100) : '—'), sortValue: t => t.population ?? -1 },
    ]
    return (
        <div className="space-y-6">
            <StatGrid>
                <Stat label="Население" value={total} suffix="чел" icon={Users} hint={d.percent_of_region !== null ? `${fmtPct(d.percent_of_region)} от жителей региона` : undefined} />
                <Stat label="Трудоспособные" value={d.employable_percent} suffix="%" digits={1} icon={Briefcase} />
                <Stat label="Средняя зарплата" value={salaryD} suffix="₽" icon={RussianRuble} hint={salaryD && salaryR ? `${fmtNum((salaryD / salaryR) * 100)}% от региональной` : undefined} />
                <Stat label="Безработица" value={unD} suffix="%" digits={1} icon={TrendingDown} hint={unD !== null && unR !== null ? `${unD === unR ? 'как' : unD < unR ? 'ниже' : 'выше'} региональной (${fmtPct(unR)})` : undefined} />
            </StatGrid>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Возрастная структура" icon={Percent} bg>
                    <StackedBar items={[
                        { label: 'Трудоспособные', value: d.employable_percent, color: VIZ[0] },
                        { label: 'Дети до 15 лет', value: d.children_percent, color: VIZ[1] },
                        { label: 'Пенсионеры', value: d.pensioners_percent, color: VIZ[2] },
                    ]} />
                </CardBlock>
                <CardBlock title="Сравнение с регионом" icon={TrendingUp} bg>
                    <div className="space-y-5">
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Средняя зарплата, ₽</p>
                            <BarRows items={[{ label: 'Территория', value: salaryD, display: fmtNum(salaryD), color: VIZ[0] }, { label: 'Регион', value: salaryR, display: fmtNum(salaryR), color: VIZ[3] }]} max={Math.max(salaryD ?? 0, salaryR ?? 0, 1)} />
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Безработица, %</p>
                            <BarRows items={[{ label: 'Территория', value: unD, display: fmtPct(unD), color: VIZ[0] }, { label: 'Регион', value: unR, display: fmtPct(unR), color: VIZ[3] }]} max={Math.max(unD ?? 0, unR ?? 0, 1)} />
                        </div>
                    </div>
                </CardBlock>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Число работников по годам" icon={Briefcase} bg>
                    {workers.length === 0 ? <EmptyHint text="Нет данных по годам" /> : <TrendChart data={workers} unit="чел" />}
                </CardBlock>
                <CardBlock title="Уровень жизни, ₽ по годам" icon={RussianRuble} bg>
                    {level.length === 0 ? <EmptyHint text="Нет данных по годам" /> : <TrendChart data={level} unit="₽" color={VIZ[1]} />}
                </CardBlock>
            </div>
            <CardBlock title="Крупные населённые пункты" icon={MapPin} bg>
                <DataTable rows={towns} columns={cols} rowKey={(t, i) => `${t.name}-${i}`} defaultSort={{ key: 'pop', dir: 'desc' }} empty="Крупные населённые пункты не указаны" />
            </CardBlock>
        </div>
    )
}

// ==================== Экономика ====================

export function EconomyView({ p }: { p: Passport }) {
    const e = p.economy
    const pr = p.production
    const a = p.agriculture
    const known = (pr.organisation_budget ?? 0) + (pr.trade_enterprises ?? 0) + (pr.construction_enterprises ?? 0)
    const other = pr.organisation_total !== null ? Math.max(0, pr.organisation_total - known) : 0
    const orgData = [
        { name: 'Сервисные и социальные', value: pr.organisation_budget ?? 0 },
        { name: 'Торговля', value: pr.trade_enterprises ?? 0 },
        { name: 'Строительство', value: pr.construction_enterprises ?? 0 },
        { name: 'Прочие', value: other },
    ].filter(x => x.value > 0)
    const rows = pr.enterprises.filter(x => x.trim()).map((name, i) => ({ name, i: i + 1 }))
    const cols: Column<{ name: string; i: number }>[] = [
        { key: 'i', header: '№', render: r => r.i, sortValue: r => r.i },
        { key: 'name', header: 'Предприятие', render: r => r.name, sortValue: r => r.name },
    ]
    return (
        <div className="space-y-6">
            <StatGrid>
                <Stat label="Доход на 1 жителя" value={e.nnd_per_person} suffix="тыс. ₽" digits={1} icon={RussianRuble} />
                <Stat label="Прирост дохода на 1 жителя" value={e.nnd_growth_per_person} suffix="тыс. ₽" digits={1} icon={TrendingUp} />
                <Stat label="Субсидии на 1 жителя" value={e.subsidies_per_person} suffix="тыс. ₽" digits={1} icon={RussianRuble} />
                <Stat label="Расходы на управление на 1 жителя" value={e.omsu_costs_per_person} suffix="тыс. ₽" digits={1} icon={RussianRuble} />
            </StatGrid>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Финансовые показатели, %" icon={Percent} bg>
                    <BarRows max={100} unit="%" items={[
                        { label: 'Финансовые возможности', value: e.finance_possibility, color: VIZ[1] },
                        { label: 'Доля расходов на управление в доходе', value: e.omsu_share_in_nnd, color: VIZ[0] },
                        { label: 'Доля просроченной задолженности в доходе', value: e.debt_share_in_nnd, color: VIZ[4] },
                    ]} />
                </CardBlock>
                <CardBlock title="Организации" icon={Factory} bg>
                    {orgData.length === 0 ? <EmptyHint text="Данные об организациях не заполнены" /> : <Donut data={orgData} centerValue={fmtNum(pr.organisation_total ?? orgData.reduce((s, x) => s + x.value, 0))} centerLabel="всего" />}
                </CardBlock>
            </div>
            <CardBlock title="Сельское хозяйство" icon={Tractor} bg>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <BarRows max={100} unit="%" items={[{ label: 'Использование сельхозземель', value: a.land_use_percent, color: VIZ[1] }, { label: 'Лесной фонд', value: a.forest_percent, color: VIZ[2] }]} />
                    <FactGrid>
                        <Fact label="Земли с/х назначения">{a.land_total_hectares !== null ? `${fmtNum(a.land_total_hectares)} га` : null}</Fact>
                        <Fact label="Площадь лесов">{a.forest_hectares !== null ? `${fmtNum(a.forest_hectares)} га` : null}</Fact>
                    </FactGrid>
                </div>
            </CardBlock>
            <CardBlock title="Предприятия" icon={Factory} bg>
                <DataTable rows={rows} columns={cols} rowKey={r => r.i} defaultSort={{ key: 'i', dir: 'asc' }} empty="Перечень предприятий не заполнен" />
            </CardBlock>
        </div>
    )
}

// ==================== Бюджет ====================

const execTone = (pct: number | null): { tone: Tone; text: string } =>
    pct === null ? { tone: 'none', text: 'Нет данных' } : pct >= 95 ? { tone: 'ok', text: 'Исполнено' } : pct >= 70 ? { tone: 'warn', text: 'В процессе' } : { tone: 'bad', text: 'Отстаёт' }

function PlanFactTip({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number }[]; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="rounded-xl border border-border bg-background px-3 py-2 text-sm shadow-lg">
            <p className="mb-1 font-semibold">{label}</p>
            {payload.map(x => <p key={x.name}>{x.name}: {fmtSigned(Number(x.value ?? 0), 1)}</p>)}
        </div>
    )
}

export function BudgetView({ p }: { p: Passport }) {
    const b = p.budget
    const incPct = b.income_plan && b.income_fact !== null ? (b.income_fact / b.income_plan) * 100 : null
    const cosPct = b.costs_plan && b.costs_fact !== null ? (b.costs_fact / b.costs_plan) * 100 : null
    const defF = b.deficit_fact
    const balanceLabel = defF === null ? undefined : defF > 0 ? 'Профицит' : defF < 0 ? 'Дефицит' : 'Баланс'
    const struct = b.budget_data.filter(x => x.title).map(x => ({ label: x.title, value: x.result })).sort((x, y) => (y.value ?? -Infinity) - (x.value ?? -Infinity))
    const chart = [
        { name: 'Доходы', plan: toMln(b.income_plan), fact: toMln(b.income_fact) },
        { name: 'Расходы', plan: toMln(b.costs_plan), fact: toMln(b.costs_fact) },
        { name: 'Дефицит / профицит', plan: toMln(b.deficit_plan), fact: toMln(b.deficit_fact) },
    ]
    const inc = execTone(incPct)
    const cos = execTone(cosPct)
    return (
        <div className="space-y-6">
            <StatGrid cols={3}>
                <Stat label="Доходы (факт)" value={b.income_fact} suffix="тыс. ₽" icon={TrendingUp} digits={1} hint={b.income_plan !== null ? `план ${fmtNum(b.income_plan, 1)}` : undefined} />
                <Stat label="Расходы (факт)" value={b.costs_fact} suffix="тыс. ₽" icon={TrendingDown} digits={1} hint={b.costs_plan !== null ? `план ${fmtNum(b.costs_plan, 1)}` : undefined} />
                <Stat label={balanceLabel ? `${balanceLabel} (факт)` : 'Дефицит/профицит (факт)'} value={defF === null ? null : fmtSigned(defF, 1)} suffix="тыс. ₽" icon={Scale} hint={b.deficit_plan !== null ? `план ${fmtSigned(b.deficit_plan, 1)}` : undefined} />
            </StatGrid>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Исполнение бюджета" icon={RussianRuble} bg>
                    <div className="space-y-5">
                        <div>
                            <div className="mb-1 flex items-center justify-between gap-2"><span className="text-sm font-medium">Доходы</span><StatusBadge tone={inc.tone} text={inc.text} /></div>
                            <BarRows max={100} items={[{ label: `факт ${fmtNum(b.income_fact, 1)} из ${fmtNum(b.income_plan, 1)} тыс. ₽`, value: incPct, display: fmtPct(incPct), color: VIZ[1] }]} />
                        </div>
                        <div>
                            <div className="mb-1 flex items-center justify-between gap-2"><span className="text-sm font-medium">Расходы</span><StatusBadge tone={cos.tone} text={cos.text} /></div>
                            <BarRows max={100} items={[{ label: `факт ${fmtNum(b.costs_fact, 1)} из ${fmtNum(b.costs_plan, 1)} тыс. ₽`, value: cosPct, display: fmtPct(cosPct), color: VIZ[0] }]} />
                        </div>
                    </div>
                </CardBlock>
                <CardBlock title="План и факт, млн ₽" icon={Scale} bg>
                    {chart.every(c => c.plan === null && c.fact === null) ? <EmptyHint text="Данные бюджета не заполнены" /> : (
                        <div className="h-64 [&_*:focus]:outline-none">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chart} layout="vertical" accessibilityLayer={false} barCategoryGap="28%" margin={{ top: 4, right: 76, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => fmtNum(v)} />
                                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: 'currentColor' }} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'rgba(148,163,184,0.08)' }} content={<PlanFactTip />} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="plan" name="План" fill={VIZ[3]} radius={[0, 4, 4, 0]} barSize={14}>
                                        <LabelList dataKey="plan" position="right" formatter={(v: unknown) => fmtNum(Number(v), 1)} style={{ fontSize: 10, fill: 'currentColor' }} />
                                    </Bar>
                                    <Bar dataKey="fact" name="Факт" fill={VIZ[0]} radius={[0, 4, 4, 0]} barSize={14}>
                                        <LabelList dataKey="fact" position="right" formatter={(v: unknown) => fmtNum(Number(v), 1)} style={{ fontSize: 10, fill: 'currentColor' }} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardBlock>
            </div>
            <CardBlock title="Наполнение бюджета" icon={ListOrdered} bg>
                {struct.length === 0 ? <EmptyHint text="Структура бюджета не заполнена" /> : <BarRows items={struct.map((s, i) => ({ ...s, display: fmtNum(s.value, 1), color: VIZ[i % VIZ.length] }))} unit="тыс. ₽" />}
            </CardBlock>
            <StatGrid>
                <Stat label="Долг территории" value={b.mo_duty} suffix="тыс. ₽" icon={Scale} digits={1} />
                <Stat label="Инвестиции" value={b.investments} suffix="тыс. ₽" icon={TrendingUp} digits={1} />
                <Stat label="Зарплата на предприятиях" value={b.average_salary_enterprises} suffix="₽" icon={RussianRuble} />
                <Stat label="Зарплата на территории" value={b.average_salary_mo} suffix="₽" icon={RussianRuble} />
            </StatGrid>
        </div>
    )
}

// ==================== Инфраструктура ====================

export function InfrastructureView({ p }: { p: Passport }) {
    const r = p.roads
    const h = p.housing
    const t = h.total_area_thousand_m2
    const roadMax = Math.max(r.regional_km ?? 0, r.district_km ?? 0, r.village_km ?? 0, 1)
    const housingRow = (label: string, v: number | null, color: string): BarItemLike => ({ label: `${label} (${fmtNum(v, 1)} тыс. м²)`, value: share(v, t), display: fmtPct(share(v, t)), color })
    return (
        <div className="space-y-6">
            <StatGrid>
                <Stat label="Дороги, всего" value={r.total_km} suffix="км" icon={Route} digits={1} hint={r.not_standard_percent !== null ? `${fmtPct(r.not_standard_percent)} не соответствуют нормативу` : undefined} />
                <Stat label="Дорожный фонд" value={r.annual_fund_million} suffix="млн ₽" icon={RussianRuble} digits={1} />
                <Stat label="Жилищный фонд" value={t} suffix="тыс. м²" icon={Home} digits={1} />
                <Stat label="Ввод жилья" value={h.housing_commissioning} suffix="тыс. м²" icon={Home} digits={1} />
            </StatGrid>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardBlock title="Дорожное хозяйство" icon={Route} bg>
                    <BarRows max={roadMax} unit="км" items={[
                        { label: 'Магистральные дороги', value: r.regional_km, color: VIZ[0] },
                        { label: 'Внутренние дороги', value: r.district_km, color: VIZ[1] },
                        { label: 'Дороги посёлков', value: r.village_km, color: VIZ[2] },
                    ]} />
                    <div className="mt-5"><BarRows max={100} unit="%" items={[{ label: 'Не соответствуют нормативу', value: r.not_standard_percent, color: VIZ[4] }]} /></div>
                </CardBlock>
                <CardBlock title="Жилищный фонд" icon={AlertTriangle} bg>
                    <p className="mb-3 text-xs text-muted-foreground">Доля от общей площади жилья ({t !== null ? `${fmtNum(t, 1)} тыс. м²` : 'нет данных'})</p>
                    <BarRows max={100} items={[housingRow('Аварийное жильё', h.emergency_thousand_m2, VIZ[4]), housingRow('Ветхое жильё', h.dilapidated_thousand_m2, VIZ[2]), housingRow('Центральное отопление', h.central_heating_thousand_m2, VIZ[1])]} />
                </CardBlock>
            </div>
            <CardBlock title="Коммунальная инфраструктура, обеспеченность" icon={Droplets} bg>
                <BarRows max={100} unit="%" items={[
                    { label: 'Холодное водоснабжение', value: h.cold_water_supply, color: VIZ[0] },
                    { label: 'Горячее водоснабжение', value: h.hot_water_supply, color: VIZ[2] },
                    { label: 'Канализация', value: h.sewerage, color: VIZ[3] },
                ]} />
            </CardBlock>
        </div>
    )
}
type BarItemLike = { label: string; value: number | null; display?: string; color?: string }

// ==================== Социальная сфера ====================

type Part = 'education' | 'health' | 'culture'
const ratio = (a: number | null, b: number | null, unit: string): string | undefined => (a === null || !b ? undefined : `${fmtNum(a / b, 1)} ${unit}`)

export function SocialView({ p }: { p: Passport }) {
    const [part, setPart] = useState<Part>('education')
    const e = p.education
    const h = p.healthcare
    const c = p.culture_sport
    const staff = [
        { name: 'Врачебный персонал', value: h.doctors ?? 0 },
        { name: 'Средний медперсонал', value: h.nursing_staff ?? 0 },
        { name: 'Младший медперсонал', value: h.junior_nursing_staff ?? 0 },
    ].filter(x => x.value > 0)
    return (
        <div className="space-y-6">
            <Segmented<Part> label="Раздел социальной сферы" value={part} onChange={setPart} options={[{ id: 'education', label: 'Образование' }, { id: 'health', label: 'Медицина' }, { id: 'culture', label: 'Культура и спорт' }]} />
            {part === 'education' && (
                <>
                    <StatGrid>
                        <Stat label="Детсады" value={e.preschool_institutions} suffix="учр." icon={Baby} hint={ratio(e.kindergarten_children, e.kindergarten_teachers, 'детей на педагога')} />
                        <Stat label="Детей в детсадах" value={e.kindergarten_children} suffix="чел" icon={Baby} hint={e.kindergarten_queue !== null ? `очередь: ${fmtNum(e.kindergarten_queue)}` : undefined} />
                        <Stat label="Школы" value={e.schools} suffix="учр." icon={GraduationCap} hint={e.multi_shift_schools !== null ? `в 2 смены: ${fmtNum(e.multi_shift_schools)}` : undefined} />
                        <Stat label="Школьников" value={e.school_children} suffix="чел" icon={Users} hint={ratio(e.school_children, e.school_teachers, 'учеников на учителя')} />
                    </StatGrid>
                    <CardBlock title="Образование — подробнее" icon={GraduationCap} bg>
                        <StatGrid>
                            <Stat label="Педагогов в детсадах" value={e.kindergarten_teachers} icon={Users} />
                            <Stat label="Учителей" value={e.school_teachers} icon={Users} />
                            <Stat label="Работников школ" value={e.school_workers} icon={Users} />
                            <Stat label="Допобразование" value={e.additional_education} suffix="учр." icon={GraduationCap} />
                            <Stat label="Школ в аварийном состоянии" value={e.schools_emergency} icon={AlertTriangle} />
                            <Stat label="Наполняемость класса" value={e.average_class_size} suffix="чел" digits={1} icon={Users} />
                        </StatGrid>
                    </CardBlock>
                </>
            )}
            {part === 'health' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <CardBlock title="Кадры здравоохранения" icon={Stethoscope} bg>
                        {staff.length === 0 ? <EmptyHint text="Данные о персонале не заполнены" /> : <Donut data={staff} unit="чел" centerValue={fmtNum(staff.reduce((s, x) => s + x.value, 0))} centerLabel="всего" />}
                    </CardBlock>
                    <CardBlock title="Амбулаторное звено" icon={Stethoscope} bg>
                        <BarRows unit="чел" items={[
                            { label: 'Врачи', value: h.outpatient_doctors, color: VIZ[0] },
                            { label: 'Старший медперсонал', value: h.outpatient_senior_staff, color: VIZ[1] },
                            { label: 'Младший медперсонал', value: h.outpatient_junior_staff, color: VIZ[2] },
                        ]} />
                    </CardBlock>
                </div>
            )}
            {part === 'culture' && (
                <>
                    <StatGrid cols={3}>
                        <Stat label="Библиотеки" value={c.libraries} icon={BookOpen} />
                        <Stat label="Культурно-досуговые учреждения" value={c.cultural_centers} icon={Music} />
                        <Stat label="Спортивные сооружения" value={c.sports_facilities} icon={Bike} />
                    </StatGrid>
                    <CardBlock title="Физкультура и спорт" icon={Bike} bg>
                        <BarRows max={100} unit="%" items={[{ label: 'Доля населения, систематически занимающегося спортом', value: c.sports_participation_percent, color: VIZ[1] }]} />
                    </CardBlock>
                </>
            )}
        </div>
    )
}

// ==================== Мониторинг ====================

export function MonitoringView({ p }: { p: Passport }) {
    const total = p.monitoring.total_finance_million
    const done = p.monitoring.disbursed_million
    const pct = total && done !== null ? (done / total) * 100 : null
    const left = total !== null && done !== null ? total - done : null
    const st: { tone: Tone; text: string } = pct === null ? { tone: 'none', text: 'Нет данных' } : pct >= 80 ? { tone: 'ok', text: 'В норме' } : pct >= 50 ? { tone: 'warn', text: 'Требует внимания' } : { tone: 'bad', text: 'Отстаёт' }
    return (
        <div className="space-y-6">
            <div className="card-block flex flex-wrap items-center gap-3 rounded-2xl p-4">
                <BarChart3 size={20} className="text-sky-500" aria-hidden />
                <span className="font-semibold">Сводный статус освоения средств</span>
                <StatusBadge tone={st.tone} text={st.text} />
                <span className="text-xs text-muted-foreground">В норме — от 80%, требует внимания — 50–79%, отстаёт — менее 50%</span>
            </div>
            <StatGrid>
                <Stat label="Объём финансирования" value={total} suffix="млн ₽" digits={1} icon={Wallet} />
                <Stat label="Освоено" value={done} suffix="млн ₽" digits={1} icon={RussianRuble} />
                <Stat label="Остаток" value={left} suffix="млн ₽" digits={1} icon={Wallet} />
                <Stat label="Освоение" value={pct} suffix="%" digits={1} icon={CheckCircle2} />
            </StatGrid>
            <CardBlock title="Освоение бюджета" icon={BarChart3} bg>
                <BarRows max={100} items={[{ label: `${fmtNum(done, 1)} из ${fmtNum(total, 1)} млн ₽`, value: pct, display: fmtPct(pct), color: st.tone === 'ok' ? VIZ[1] : st.tone === 'warn' ? VIZ[2] : VIZ[4] }]} />
            </CardBlock>
        </div>
    )
}
