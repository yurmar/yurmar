import { Plus, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { BarChart3, Briefcase, Factory, GraduationCap, Heart, Home, Info, Landmark, MapPin, Phone, RussianRuble, Route, Stethoscope, Tractor, TrendingUp, User, Users } from 'lucide-react'
import type { Passport } from './data'
import { BTN_DANGER_ICON, BTN_GHOST, CardBlock, FIELD } from './ui'
import type { TabId } from './tabs'

type Kind = 'text' | 'num' | 'area'
interface F { key: string; label: string; kind?: Kind; suffix?: string; wide?: boolean }
interface ListCol { key: string; label: string; kind: 'text' | 'num' }
type Block =
    | { type: 'fields'; title: string; icon: LucideIcon; section: keyof Passport; fields: F[] }
    | { type: 'strings'; title: string; icon: LucideIcon; section: keyof Passport; field: string; addLabel: string; placeholder: string }
    | { type: 'rows'; title: string; icon: LucideIcon; section: keyof Passport; field: string; addLabel: string; cols: ListCol[]; blank: Record<string, unknown> }

const n = (key: string, label: string, suffix?: string): F => ({ key, label, kind: 'num', suffix })
const t = (key: string, label: string, wide?: boolean): F => ({ key, label, kind: 'text', wide })

const year = new Date().getFullYear()

const SCHEMA: Partial<Record<TabId, Block[]>> = {
    general: [
        { type: 'fields', title: 'Территория', icon: MapPin, section: 'main_info', fields: [t('municipality', 'Название'), t('adm_centre', 'Центр территории'), t('address', 'Адрес офиса управления', true), n('area', 'Площадь', 'км²'), n('distance', 'Расстояние до управляющей компании', 'км')] },
        { type: 'fields', title: 'Контакты', icon: Phone, section: 'main_info', fields: [t('telephone', 'Телефон'), t('email', 'Email'), t('site', 'Сайт территории', true)] },
    ],
    leader: [
        { type: 'fields', title: 'Основные сведения', icon: User, section: 'leader', fields: [t('name', 'ФИО', true), t('post', 'Должность'), t('birthday', 'Дата рождения'), t('birthday_city', 'Место рождения'), t('mobile', 'Мобильный телефон'), t('email', 'Email')] },
        { type: 'fields', title: 'Образование и специальность', icon: Info, section: 'leader', fields: [{ key: 'education', label: 'Образование', kind: 'area' }, { key: 'speciality', label: 'Специальность', kind: 'area' }] },
        { type: 'strings', title: 'Трудовая деятельность', icon: Briefcase, section: 'leader', field: 'work_history', addLabel: 'Добавить запись', placeholder: 'Период — должность, организация' },
    ],
    demographic: [
        {
            type: 'fields', title: 'Численность и состав населения', icon: Users, section: 'demographic',
            fields: [n('population_total', 'Численность населения', 'чел'), n('percent_of_region', 'Доля от региона', '%'), n('employable_percent', 'Трудоспособные', '%'), n('children_percent', 'Дети', '%'), n('pensioners_percent', 'Пенсионеры', '%')],
        },
        { type: 'fields', title: 'Доходы и занятость', icon: RussianRuble, section: 'demographic', fields: [n('salary_district', 'Зарплата на территории', '₽'), n('salary_region', 'Зарплата по региону', '₽'), n('unemployment_district', 'Безработица на территории', '%'), n('unemployment_region', 'Безработица по региону', '%')] },
        { type: 'rows', title: 'Крупные населённые пункты', icon: MapPin, section: 'demographic', field: 'large_towns', addLabel: 'Добавить пункт', cols: [{ key: 'name', label: 'Название', kind: 'text' }, { key: 'population', label: 'Население', kind: 'num' }], blank: { name: '', population: null } },
        { type: 'rows', title: 'Число работников по годам', icon: Briefcase, section: 'demographic', field: 'workers', addLabel: 'Добавить год', cols: [{ key: 'year', label: 'Год', kind: 'num' }, { key: 'count', label: 'Работников', kind: 'num' }], blank: { year, count: null } },
        { type: 'rows', title: 'Уровень жизни по годам', icon: RussianRuble, section: 'demographic', field: 'level_life', addLabel: 'Добавить год', cols: [{ key: 'year', label: 'Год', kind: 'num' }, { key: 'rur', label: '₽', kind: 'num' }], blank: { year, rur: null } },
    ],
    economy: [
        { type: 'fields', title: 'Экономические показатели', icon: TrendingUp, section: 'economy', fields: [n('nnd_per_person', 'Доход на 1 жителя', 'тыс. ₽'), n('nnd_growth_per_person', 'Прирост дохода на 1 жителя', 'тыс. ₽'), n('subsidies_per_person', 'Субсидии на 1 жителя', 'тыс. ₽'), n('omsu_costs_per_person', 'Расходы на управление на 1 жителя', 'тыс. ₽'), n('finance_possibility', 'Финансовые возможности', '%'), n('omsu_share_in_nnd', 'Доля расходов на управление', '%'), n('debt_share_in_nnd', 'Доля просроченной задолженности', '%')] },
        { type: 'fields', title: 'Организации', icon: Factory, section: 'production', fields: [n('organisation_total', 'Всего организаций'), n('organisation_budget', 'Сервисные и социальные'), n('trade_enterprises', 'Торговля'), n('construction_enterprises', 'Строительство')] },
        { type: 'strings', title: 'Предприятия', icon: Factory, section: 'production', field: 'enterprises', addLabel: 'Добавить предприятие', placeholder: 'Название предприятия' },
        { type: 'fields', title: 'Сельское хозяйство', icon: Tractor, section: 'agriculture', fields: [n('land_use_percent', 'Использование сельхозземель', '%'), n('land_total_hectares', 'Земли с/х назначения', 'га'), n('forest_percent', 'Лесной фонд', '%'), n('forest_hectares', 'Площадь лесов', 'га')] },
    ],
    budget: [
        { type: 'fields', title: 'Исполнение бюджета', icon: RussianRuble, section: 'budget', fields: [n('income_plan', 'Доходы, план', 'тыс. ₽'), n('income_fact', 'Доходы, факт', 'тыс. ₽'), n('costs_plan', 'Расходы, план', 'тыс. ₽'), n('costs_fact', 'Расходы, факт', 'тыс. ₽'), n('deficit_plan', 'Дефицит/профицит, план', 'тыс. ₽'), n('deficit_fact', 'Дефицит/профицит, факт', 'тыс. ₽')] },
        { type: 'fields', title: 'Прочие показатели', icon: Landmark, section: 'budget', fields: [n('mo_duty', 'Долг территории', 'тыс. ₽'), n('investments', 'Инвестиции', 'тыс. ₽'), n('average_salary_enterprises', 'Зарплата на предприятиях', '₽'), n('average_salary_mo', 'Зарплата на территории', '₽')] },
        { type: 'rows', title: 'Наполнение бюджета', icon: RussianRuble, section: 'budget', field: 'budget_data', addLabel: 'Добавить статью', cols: [{ key: 'title', label: 'Статья', kind: 'text' }, { key: 'result', label: 'тыс. ₽', kind: 'num' }], blank: { title: '', result: null } },
    ],
    infrastructure: [
        { type: 'fields', title: 'Дорожное хозяйство', icon: Route, section: 'roads', fields: [n('total_km', 'Общая протяжённость', 'км'), n('not_standard_percent', 'Не соответствуют нормативу', '%'), n('regional_km', 'Магистральные дороги', 'км'), n('district_km', 'Внутренние дороги', 'км'), n('village_km', 'Дороги посёлков', 'км'), n('annual_fund_million', 'Дорожный фонд', 'млн ₽')] },
        { type: 'fields', title: 'Жилищный фонд и коммуникации', icon: Home, section: 'housing', fields: [n('total_area_thousand_m2', 'Жилищный фонд', 'тыс. м²'), n('emergency_thousand_m2', 'Аварийное жильё', 'тыс. м²'), n('dilapidated_thousand_m2', 'Ветхое жильё', 'тыс. м²'), n('central_heating_thousand_m2', 'Центральное отопление', 'тыс. м²'), n('housing_commissioning', 'Ввод жилья', 'тыс. м²'), n('cold_water_supply', 'Холодное водоснабжение', '%'), n('hot_water_supply', 'Горячее водоснабжение', '%'), n('sewerage', 'Канализация', '%')] },
    ],
    social: [
        {
            type: 'fields', title: 'Образование', icon: GraduationCap, section: 'education',
            fields: [n('preschool_institutions', 'Детсады', 'учр.'), n('kindergarten_children', 'Детей в детсадах', 'чел'), n('kindergarten_teachers', 'Педагогов в детсадах', 'чел'), n('kindergarten_queue', 'Очередь в детсады', 'чел'), n('schools', 'Школы', 'учр.'), n('schools_emergency', 'Школ в аварийном состоянии'), n('multi_shift_schools', 'Школ в 2 смены'), n('school_children', 'Школьников', 'чел'), n('school_teachers', 'Учителей', 'чел'), n('school_workers', 'Работников школ', 'чел'), n('average_class_size', 'Наполняемость класса', 'чел'), n('additional_education', 'Допобразование', 'учр.')],
        },
        { type: 'fields', title: 'Здравоохранение', icon: Stethoscope, section: 'healthcare', fields: [n('doctors', 'Врачи', 'чел'), n('nursing_staff', 'Средний медперсонал', 'чел'), n('junior_nursing_staff', 'Младший медперсонал', 'чел'), n('outpatient_doctors', 'Амбулатория: врачи', 'чел'), n('outpatient_senior_staff', 'Амбулатория: старший медперсонал', 'чел'), n('outpatient_junior_staff', 'Амбулатория: младший медперсонал', 'чел')] },
        { type: 'fields', title: 'Культура и спорт', icon: Heart, section: 'culture_sport', fields: [n('libraries', 'Библиотеки'), n('cultural_centers', 'Культурно-досуговые учреждения'), n('sports_facilities', 'Спортивные сооружения'), n('sports_participation_percent', 'Занимаются спортом', '%')] },
    ],
    monitoring: [
        { type: 'fields', title: 'Освоение средств', icon: BarChart3, section: 'monitoring', fields: [n('total_finance_million', 'Объём финансирования', 'млн ₽'), n('disbursed_million', 'Освоено', 'млн ₽')] },
    ],
}

export const isEditable = (tab: TabId): boolean => !!SCHEMA[tab]

type Rec = Record<string, unknown>

function Input({ kind = 'text', value, onChange, suffix, label }: { kind?: Kind | 'num'; value: unknown; onChange: (v: string | number | null) => void; suffix?: string; label: string }) {
    if (kind === 'area') return <textarea aria-label={label} rows={2} className={FIELD} value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} />
    const isNum = kind === 'num'
    return (
        <div className="relative">
            <input
                aria-label={label}
                inputMode={isNum ? 'decimal' : undefined}
                className={`${FIELD} ${suffix ? 'pr-14' : ''}`}
                value={value === null || value === undefined ? '' : String(value)}
                onChange={e => {
                    if (!isNum) return onChange(e.target.value)
                    const raw = e.target.value.replace(',', '.').trim()
                    if (raw === '') return onChange(null)
                    const num = Number(raw)
                    if (Number.isFinite(num)) onChange(num)
                }}
            />
            {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
        </div>
    )
}

export function EditView({ tab, p, setP }: { tab: TabId; p: Passport; setP: (f: (p: Passport) => Passport) => void }) {
    const patch = (section: keyof Passport, fn: (cur: Rec) => Rec): void => setP(prev => ({ ...prev, [section]: fn(prev[section] as unknown as Rec) }))
    return (
        <div className="space-y-6">
            {(SCHEMA[tab] ?? []).map(b => {
                const cur = p[b.section] as unknown as Rec
                if (b.type === 'fields') {
                    return (
                        <CardBlock key={b.title} title={b.title} icon={b.icon} bg>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {b.fields.map(f => (
                                    <label key={f.key} className={`block ${f.wide || f.kind === 'area' ? 'md:col-span-2' : ''}`}>
                                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</span>
                                        <Input kind={f.kind} label={f.label} value={cur[f.key]} suffix={f.suffix} onChange={v => patch(b.section, c => ({ ...c, [f.key]: v }))} />
                                    </label>
                                ))}
                            </div>
                        </CardBlock>
                    )
                }
                if (b.type === 'strings') {
                    const items = (cur[b.field] as string[]) ?? []
                    const set = (next: string[]): void => patch(b.section, c => ({ ...c, [b.field]: next }))
                    return (
                        <CardBlock key={b.title} title={b.title} icon={b.icon} bg>
                            <div className="space-y-2">
                                {items.map((it, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input aria-label={b.placeholder} placeholder={b.placeholder} className={FIELD} value={it} onChange={e => set(items.map((x, j) => (j === i ? e.target.value : x)))} />
                                        <button type="button" aria-label="Удалить" className={BTN_DANGER_ICON} onClick={() => set(items.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" className={`${BTN_GHOST} mt-3`} onClick={() => set([...items, ''])}><Plus size={15} /> {b.addLabel}</button>
                        </CardBlock>
                    )
                }
                const rows = (cur[b.field] as Rec[]) ?? []
                const set = (next: Rec[]): void => patch(b.section, c => ({ ...c, [b.field]: next }))
                return (
                    <CardBlock key={b.title} title={b.title} icon={b.icon} bg>
                        <div className="space-y-2">
                            {rows.map((r, i) => (
                                <div key={i} className="flex gap-2">
                                    {b.cols.map(c => (
                                        <div key={c.key} className={c.kind === 'text' ? 'min-w-0 flex-[2]' : 'min-w-0 flex-1'}>
                                            <Input kind={c.kind} label={c.label} value={r[c.key]} onChange={v => set(rows.map((x, j) => (j === i ? { ...x, [c.key]: v } : x)))} />
                                        </div>
                                    ))}
                                    <button type="button" aria-label="Удалить" className={BTN_DANGER_ICON} onClick={() => set(rows.filter((_, j) => j !== i))}><Trash2 size={15} /></button>
                                </div>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">Колонки: {b.cols.map(c => c.label).join(' · ')}</p>
                        <button type="button" className={`${BTN_GHOST} mt-3`} onClick={() => set([...rows, { ...b.blank }])}><Plus size={15} /> {b.addLabel}</button>
                    </CardBlock>
                )
            })}
        </div>
    )
}
