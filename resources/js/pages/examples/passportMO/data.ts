// Демо-данные раздела «Паспорта территорий»: всё вымышлено, государственных и муниципальных структур нет.
// Территории — посёлки-спутники вымышленной девелоперской группы «Северный берег».

export const ORG_NAME = 'Группа «Северный берег»'
export const REGION_NAME = 'Регион «Приозёрье»'

export interface ReportFile { file_id: number; name: string; size: number }

export interface Passport {
    main_info: { municipality: string; adm_centre: string; address: string; distance: number | null; area: number | null; site: string; telephone: string; email: string }
    leader: { name: string; photo: string | null; birthday: string; birthday_city: string; education: string; speciality: string; post: string; mobile: string; email: string; work_history: string[] }
    demographic: {
        population_total: number | null; percent_of_region: number | null; employable_percent: number | null; children_percent: number | null; pensioners_percent: number | null
        salary_district: number | null; salary_region: number | null; unemployment_district: number | null; unemployment_region: number | null
        large_towns: { name: string; population: number | null }[]
        workers: { year: number; count: number | null }[]
        level_life: { year: number; rur: number | null }[]
    }
    budget: {
        income_plan: number | null; income_fact: number | null; costs_plan: number | null; costs_fact: number | null; deficit_plan: number | null; deficit_fact: number | null
        mo_duty: number | null; investments: number | null; average_salary_enterprises: number | null; average_salary_mo: number | null
        budget_data: { title: string; result: number | null }[]
    }
    production: { organisation_total: number | null; organisation_budget: number | null; trade_enterprises: number | null; construction_enterprises: number | null; enterprises: string[] }
    economy: { nnd_per_person: number | null; nnd_growth_per_person: number | null; subsidies_per_person: number | null; omsu_costs_per_person: number | null; finance_possibility: number | null; omsu_share_in_nnd: number | null; debt_share_in_nnd: number | null }
    agriculture: { land_use_percent: number | null; land_total_hectares: number | null; forest_percent: number | null; forest_hectares: number | null }
    roads: { total_km: number | null; not_standard_percent: number | null; regional_km: number | null; district_km: number | null; village_km: number | null; annual_fund_million: number | null }
    housing: { total_area_thousand_m2: number | null; emergency_thousand_m2: number | null; dilapidated_thousand_m2: number | null; central_heating_thousand_m2: number | null; cold_water_supply: number | null; hot_water_supply: number | null; sewerage: number | null; housing_commissioning: number | null }
    education: {
        preschool_institutions: number | null; schools: number | null; schools_emergency: number | null; additional_education: number | null; kindergarten_children: number | null; kindergarten_teachers: number | null
        kindergarten_queue: number | null; school_children: number | null; school_workers: number | null; school_teachers: number | null; average_class_size: number | null; multi_shift_schools: number | null
    }
    culture_sport: { libraries: number | null; cultural_centers: number | null; sports_facilities: number | null; sports_participation_percent: number | null }
    healthcare: { doctors: number | null; nursing_staff: number | null; junior_nursing_staff: number | null; outpatient_doctors: number | null; outpatient_senior_staff: number | null; outpatient_junior_staff: number | null }
    monitoring: { total_finance_million: number | null; disbursed_million: number | null }
    reports: ReportFile[]
}

export interface Territory { id: number; name: string; passport: Passport }

/** Ключевые показатели территории; остальное выводится из них масштабированием. */
interface Spec {
    id: number; name: string; centre: string; address: string; distance: number; area: number; site: string; phone: string; mail: string
    leader: { name: string; birthday: string; city: string; education: string; speciality: string; mobile: string; mail: string; history: string[] }
    pop: number; salary: number; unemp: number; towns: [string, number][]
    income: number; incomePct: number; costsPct: number; fin: number; doneShare: number
    enterprises: string[]; reports: [string, number][]
}

const K = (v: number, d = 0): number => Math.round(v * 10 ** d) / 10 ** d

function build(s: Spec): Territory {
    const p = s.pop / 10000 // масштаб: 1.0 на 10 тыс. жителей
    const costs = K(s.income * 1.04)
    const incomeFact = K(s.income * s.incomePct)
    const costsFact = K(costs * s.costsPct)
    const years = [2020, 2021, 2022, 2023, 2024]
    const wBase = Math.round(s.pop * 0.31)
    const housing = K(s.pop * 0.0225, 1)
    const school = Math.round(s.pop * 0.108)
    const kids = Math.round(s.pop * 0.052)
    return {
        id: s.id,
        name: s.name,
        passport: {
            main_info: { municipality: s.name, adm_centre: s.centre, address: s.address, distance: s.distance, area: s.area, site: s.site, telephone: s.phone, email: s.mail },
            leader: {
                name: s.leader.name, photo: null, birthday: s.leader.birthday, birthday_city: s.leader.city, education: s.leader.education, speciality: s.leader.speciality,
                post: 'Управляющий территорией', mobile: s.leader.mobile, email: s.leader.mail, work_history: s.leader.history,
            },
            demographic: {
                population_total: s.pop, percent_of_region: K((s.pop / 2400000) * 100, 2), employable_percent: K(57.5 + (s.id % 4) * 1.3, 1), children_percent: K(19 + (s.id % 3) * 0.9, 1),
                pensioners_percent: K(100 - (57.5 + (s.id % 4) * 1.3) - (19 + (s.id % 3) * 0.9), 1),
                salary_district: s.salary, salary_region: 71400, unemployment_district: s.unemp, unemployment_region: 1.9,
                large_towns: s.towns.map(([name, population]) => ({ name, population })),
                workers: years.map((year, i) => ({ year, count: Math.round(wBase * (0.93 + i * 0.018)) })),
                level_life: years.map((year, i) => ({ year, rur: Math.round(s.salary * (0.72 + i * 0.068)) })),
            },
            budget: {
                income_plan: s.income, income_fact: incomeFact, costs_plan: costs, costs_fact: costsFact, deficit_plan: K(s.income - costs), deficit_fact: K(incomeFact - costsFact),
                mo_duty: K(s.income * 0.06), investments: K(s.income * 0.22), average_salary_enterprises: Math.round(s.salary * 1.08), average_salary_mo: s.salary,
                budget_data: [
                    { title: 'Аренда и сервисные платежи', result: K(s.income * 0.34) },
                    { title: 'Продажа объектов недвижимости', result: K(s.income * 0.27) },
                    { title: 'Коммунальные услуги', result: K(s.income * 0.19) },
                    { title: 'Паркинг и благоустройство', result: K(s.income * 0.1) },
                    { title: 'Прочие поступления', result: K(s.income * 0.1) },
                ],
            },
            production: {
                organisation_total: Math.round(p * 118), organisation_budget: Math.round(p * 17), trade_enterprises: Math.round(p * 36), construction_enterprises: Math.round(p * 14),
                enterprises: s.enterprises,
            },
            economy: {
                nnd_per_person: K(s.salary * 0.0078 + p * 0.9, 1), nnd_growth_per_person: K(1.2 + (s.id % 4) * 0.7, 1), subsidies_per_person: K(2.1 + (s.id % 3) * 1.4, 1), omsu_costs_per_person: K(6.4 + (s.id % 5) * 0.8, 1),
                finance_possibility: K(64 + (s.id % 5) * 4.5, 1), omsu_share_in_nnd: K(18 + (s.id % 4) * 2.2, 1), debt_share_in_nnd: K(2.5 + (s.id % 3) * 1.8, 1),
            },
            agriculture: { land_use_percent: K(38 + (s.id % 5) * 7, 1), land_total_hectares: Math.round(s.area * 19), forest_percent: K(41 + (s.id % 4) * 9, 1), forest_hectares: Math.round(s.area * 38) },
            roads: {
                total_km: K(s.area * 0.19, 1), not_standard_percent: K(21 + (s.id % 5) * 6.5, 1), regional_km: K(s.area * 0.06, 1), district_km: K(s.area * 0.08, 1), village_km: K(s.area * 0.05, 1), annual_fund_million: K(s.income * 0.0011, 1),
            },
            housing: {
                total_area_thousand_m2: housing, emergency_thousand_m2: K(housing * (0.012 + (s.id % 4) * 0.008), 1), dilapidated_thousand_m2: K(housing * (0.03 + (s.id % 3) * 0.012), 1), central_heating_thousand_m2: K(housing * (0.52 + (s.id % 5) * 0.07), 1),
                cold_water_supply: K(88 + (s.id % 5) * 2.4, 1), hot_water_supply: K(52 + (s.id % 5) * 7.5, 1), sewerage: K(47 + (s.id % 5) * 8.5, 1), housing_commissioning: K(housing * 0.034, 1),
            },
            education: {
                preschool_institutions: Math.max(2, Math.round(p * 1.9)), schools: Math.max(2, Math.round(p * 1.6)), schools_emergency: s.id % 3 === 0 ? 1 : 0, additional_education: Math.max(1, Math.round(p * 0.6)),
                kindergarten_children: kids, kindergarten_teachers: Math.round(kids / 9.6), kindergarten_queue: Math.round(kids * (0.02 + (s.id % 4) * 0.015)),
                school_children: school, school_workers: Math.round(school / 6.4), school_teachers: Math.round(school / 11.8), average_class_size: K(21 + (s.id % 4) * 1.7, 1), multi_shift_schools: s.id % 2,
            },
            culture_sport: { libraries: Math.max(2, Math.round(p * 1.4)), cultural_centers: Math.max(1, Math.round(p * 1.1)), sports_facilities: Math.round(p * 7.5), sports_participation_percent: K(36 + (s.id % 5) * 4.2, 1) },
            healthcare: {
                doctors: Math.round(p * 14), nursing_staff: Math.round(p * 31), junior_nursing_staff: Math.round(p * 12), outpatient_doctors: Math.round(p * 8), outpatient_senior_staff: Math.round(p * 15), outpatient_junior_staff: Math.round(p * 5),
            },
            monitoring: { total_finance_million: s.fin, disbursed_million: K(s.fin * s.doneShare, 1) },
            reports: s.reports.map(([name, size], i) => ({ file_id: s.id * 100 + i + 1, name, size })),
        },
    }
}

const SEED: Spec[] = [
    {
        id: 1, name: 'Озёрный', centre: 'пос. Озёрный', address: 'пос. Озёрный, ул. Набережная, 14, офис управления', distance: 38, area: 412,
        site: 'https://ozerny.example.org', phone: '+7 (900) 111-21-01', mail: 'office@ozerny.example.org',
        leader: { name: 'Аркадий Викторович Лесников', birthday: '14.03.1979', city: 'г. Северореченск', education: 'Высшее, Северореченский технический университет', speciality: 'Инженер-строитель, магистр менеджмента', mobile: '+7 (900) 111-21-77', mail: 'lesnikov@ozerny.example.org',
            history: ['2002–2008 — прораб, ООО «СтройАльянс»', '2008–2014 — главный инженер, ЗАО «Северный берег-Девелопмент»', '2014–2019 — директор по строительству, группа «Северный берег»', 'С 2019 — управляющий территорией «Озёрный»'] },
        pop: 24600, salary: 78200, unemp: 1.4, towns: [['пос. Озёрный', 14800], ['д. Каменка', 4200], ['с. Берёзовое', 3300], ['д. Ласточкино', 2300]],
        income: 1286400, incomePct: 1.03, costsPct: 0.96, fin: 284.5, doneShare: 0.86,
        enterprises: ['Завод стеновых материалов «Озёрный кирпич»', 'Логистический парк «Северные ворота»', 'Агрофирма «Заречье»', 'Сеть магазинов «Продукты у озера»', 'Мебельная фабрика «Лесной двор»'],
        reports: [['Отчёт управляющего за 2023 год.pdf', 2480000], ['Отчёт управляющего за 2024 год.pdf', 2910000], ['Презентация итогов года.pptx', 7340000]],
    },
    {
        id: 2, name: 'Каменный Ручей', centre: 'пос. Каменный Ручей', address: 'пос. Каменный Ручей, пр-т Строителей, 3', distance: 71, area: 268,
        site: 'https://kruchey.example.org', phone: '+7 (900) 222-33-02', mail: 'info@kruchey.example.org',
        leader: { name: 'Марина Олеговна Тихонова', birthday: '02.09.1984', city: 'г. Светлоград', education: 'Высшее, Светлоградская академия экономики', speciality: 'Экономист, специалист по управлению недвижимостью', mobile: '+7 (900) 222-33-88', mail: 'tikhonova@kruchey.example.org',
            history: ['2006–2011 — экономист, УК «Дом и сервис»', '2011–2016 — начальник планово-экономического отдела, группа «Северный берег»', '2016–2021 — заместитель управляющего территорией «Озёрный»', 'С 2021 — управляющая территорией «Каменный Ручей»'] },
        pop: 15800, salary: 69500, unemp: 2.1, towns: [['пос. Каменный Ручей', 9700], ['д. Горка', 2900], ['д. Липовка', 1900], ['с. Тихое', 1300]],
        income: 802300, incomePct: 0.98, costsPct: 0.94, fin: 176.2, doneShare: 0.72,
        enterprises: ['Карьер «Каменный Ручей»', 'Хлебозавод «Золотой колос»', 'Тепличный комплекс «Зелёный сезон»', 'Автосервис «Мотор-Север»'],
        reports: [['Отчёт управляющего за 2024 год.pdf', 2140000], ['Финансовая сводка 1 полугодие.xlsx', 860000]],
    },
    {
        id: 3, name: 'Светлая Гавань', centre: 'г. Светлая Гавань', address: 'г. Светлая Гавань, ул. Портовая, 22', distance: 124, area: 590,
        site: 'https://gavan.example.org', phone: '+7 (900) 333-44-03', mail: 'hello@gavan.example.org',
        leader: { name: 'Станислав Андреевич Корабельников', birthday: '27.11.1976', city: 'г. Светлая Гавань', education: 'Высшее, Институт водного транспорта', speciality: 'Инженер-эксплуатационник, MBA', mobile: '+7 (900) 333-44-90', mail: 'korabelnikov@gavan.example.org',
            history: ['1999–2005 — диспетчер, «Приозёрский порт»', '2005–2012 — начальник терминала, ООО «Северная логистика»', '2012–2018 — директор по эксплуатации, группа «Северный берег»', '2018–2020 — управляющий территорией «Каменный Ручей»', 'С 2020 — управляющий территорией «Светлая Гавань»'] },
        pop: 41300, salary: 84900, unemp: 1.2, towns: [['г. Светлая Гавань', 29600], ['пос. Маячный', 5400], ['д. Прибрежная', 3800], ['д. Рыбацкая', 2500]],
        income: 2210800, incomePct: 1.06, costsPct: 0.97, fin: 512.8, doneShare: 0.91,
        enterprises: ['Порт «Светлая Гавань»', 'Рыбоперерабатывающий завод «Северный улов»', 'Судоремонтная верфь «Причал»', 'Гостиничный комплекс «Маяк»', 'Холодильный терминал «Айсберг»', 'Туристический кластер «Приозёрье-Отдых»'],
        reports: [['Отчёт управляющего за 2022 год.pdf', 3010000], ['Отчёт управляющего за 2023 год.pdf', 3190000], ['Отчёт управляющего за 2024 год.pdf', 3440000], ['План развития порта.docx', 1280000]],
    },
    {
        id: 4, name: 'Сосновый Бор', centre: 'пос. Сосновый Бор', address: 'пос. Сосновый Бор, ул. Хвойная, 9', distance: 56, area: 337,
        site: 'https://sbor.example.org', phone: '+7 (900) 444-55-04', mail: 'contact@sbor.example.org',
        leader: { name: 'Елена Павловна Рябинина', birthday: '19.05.1981', city: 'г. Северореченск', education: 'Высшее, Северореченский педагогический университет', speciality: 'Социальный педагог, менеджер социальной сферы', mobile: '+7 (900) 444-55-61', mail: 'ryabinina@sbor.example.org',
            history: ['2003–2009 — заместитель директора школы-интерната «Берёзка»', '2009–2015 — руководитель социальных проектов, фонд «Северный берег — людям»', '2015–2022 — директор по социальному развитию, группа «Северный берег»', 'С 2022 — управляющая территорией «Сосновый Бор»'] },
        pop: 12400, salary: 66300, unemp: 2.6, towns: [['пос. Сосновый Бор', 7100], ['д. Смолянка', 2400], ['д. Брусничная', 1700], ['с. Дальнее', 1200]],
        income: 641200, incomePct: 0.95, costsPct: 0.92, fin: 128.9, doneShare: 0.46,
        enterprises: ['Лесопильный комплекс «Сосновый Бор»', 'Санаторий «Хвойный»', 'Цех переработки ягод «Брусника»'],
        reports: [['Отчёт управляющего за 2024 год.pdf', 1980000]],
    },
    {
        id: 5, name: 'Вересковая Долина', centre: 'пос. Вересковый', address: 'пос. Вересковый, ул. Центральная, 1', distance: 93, area: 455,
        site: 'https://veresk.example.org', phone: '+7 (900) 555-66-05', mail: 'team@veresk.example.org',
        leader: { name: 'Денис Игоревич Полянский', birthday: '08.01.1987', city: 'г. Светлоград', education: 'Высшее, Светлоградский аграрный университет', speciality: 'Агроном, менеджер проектов', mobile: '+7 (900) 555-66-12', mail: 'polyansky@veresk.example.org',
            history: ['2009–2013 — агроном, КФХ «Вересковое»', '2013–2018 — руководитель агропроектов, группа «Северный берег»', '2018–2023 — заместитель управляющего территорией «Светлая Гавань»', 'С 2023 — управляющий территорией «Вересковая Долина»'] },
        pop: 9800, salary: 61800, unemp: 3.1, towns: [['пос. Вересковый', 5200], ['д. Луговая', 2100], ['д. Овражная', 1500], ['д. Тёплая', 1000]],
        income: 487900, incomePct: 0.9, costsPct: 0.89, fin: 96.4, doneShare: 0.38,
        enterprises: ['Агрокомплекс «Вересковая Долина»', 'Молочная ферма «Белая река»', 'Мастерские народных промыслов'],
        reports: [],
    },
    {
        id: 6, name: 'Янтарный Берег', centre: 'г. Янтарный', address: 'г. Янтарный, наб. Солнечная, 5', distance: 152, area: 701,
        site: 'https://yantarny.example.org', phone: '+7 (900) 666-77-06', mail: 'welcome@yantarny.example.org',
        leader: { name: 'Ольга Сергеевна Заречная', birthday: '23.07.1982', city: 'г. Янтарный', education: 'Высшее, Институт туризма и сервиса', speciality: 'Менеджер гостеприимства, магистр', mobile: '+7 (900) 666-77-34', mail: 'zarechnaya@yantarny.example.org',
            history: ['2004–2010 — директор гостиницы «Янтарная»', '2010–2016 — директор по развитию, «Приозёрье-Отдых»', '2016–2024 — заместитель управляющего территорией «Светлая Гавань»', 'С 2024 — управляющая территорией «Янтарный Берег»'] },
        pop: 33700, salary: 81600, unemp: 1.7, towns: [['г. Янтарный', 23100], ['пос. Солнечный', 4800], ['д. Песчаная', 3300], ['д. Дюнная', 2500]],
        income: 1764300, incomePct: 1.01, costsPct: 0.95, fin: 391.6, doneShare: 0.78,
        enterprises: ['Курортный комплекс «Янтарь-Резорт»', 'Аквапарк «Волна»', 'Ювелирная мануфактура «Солнечный камень»', 'Пансионат «Дюны»', 'Рыбная биржа «Янтарный Берег»'],
        reports: [['Отчёт управляющего за 2024 год.pdf', 2760000], ['Сезонная аналитика посещаемости.xlsx', 1530000]],
    },
]

export const makeSeed = (): Territory[] => SEED.map(build)

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T
