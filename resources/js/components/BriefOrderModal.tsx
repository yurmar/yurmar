import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { apiCreateBriefOrder, BriefFormData } from '@/api/briefOrders'

const SITE_TYPES = [
    'Сайт-визитка',
    'Интернет-магазин',
    'Корпоративный сайт',
    'Информационный портал',
    'Промосайт',
    'Посадочная страница (лендинг)',
    'Другой',
]

const SITE_TASKS = [
    'Привлечение клиентов',
    'Улучшение имиджа и узнаваемости',
    'Интернет-коммерция, продажа товаров',
    'Информирование о компании',
    'Информирование о товарах или услугах',
    'Справочная информация',
    'Привлечение персонала',
    'Расширение партнёрской сети',
    'Повышение лояльности сотрудников',
    'Другие',
]

const SITE_FUNCTIONALITY = [
    'Новости',
    'Фотоальбомы',
    'Каталог товаров или услуг',
    'Интернет-магазин',
    'Вакансии',
    'Опросы и голосования',
    'Формы обратной связи',
    'Форум',
    'Онлайн-консультант',
    'Другие',
]

const HOSTING_OPTIONS = ['На хостинге заказчика', 'Разработчик подбирает хостинг']

const CONTENT_OPTIONS = ['Своими силами', 'Необходима помощь разработчика']

const EMPTY: BriefFormData = {
    contact_person: '',
    company_name: '',
    company_activity: '',
    products_info: '',
    site_sections: '',
    brand_style: '',
    current_site: '',
    current_site_assessment: '',
    competitors: '',
    proposed_domain: '',
    site_types: [],
    site_type_other: '',
    site_tasks: [],
    site_tasks_other: '',
    site_functionality: [],
    site_functionality_other: '',
    target_audience: '',
    language_versions: '',
    design_impression: '',
    color_scheme: '',
    content_placement: '',
    liked_sites: '',
    disliked_sites: '',
    has_advertising: '',
    advertising_details: '',
    hosting_type: '',
    tech_support: '',
    content_filling: '',
    additional_wishes: '',
}

const STEPS = [
    { title: 'О компании', subtitle: 'Расскажите о вашей компании' },
    { title: 'Цели и задачи', subtitle: 'Что должен делать сайт' },
    { title: 'Дизайн', subtitle: 'Внешний вид и стиль' },
    { title: 'Реклама и хостинг', subtitle: 'Технические детали' },
]

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">
                {label}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {error}
                </p>
            )}
        </div>
    )
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/60 focus:bg-white/8 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-colors"
        />
    )
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
    return (
        <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-sky-400/60 focus:bg-white/8 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-colors resize-none"
        />
    )
}

function CheckGroup({
    options, selected, onChange,
    otherLabel, otherValue, onOtherChange,
}: {
    options: string[]
    selected: string[]
    onChange: (v: string[]) => void
    otherLabel?: string
    otherValue?: string
    onOtherChange?: (v: string) => void
}) {
    const toggle = (opt: string) => {
        onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])
    }
    const showOther = otherLabel && selected.includes(otherLabel)
    return (
        <div className="space-y-2 mt-1">
            <div className="flex flex-wrap gap-2">
                {options.map(opt => {
                    const active = selected.includes(opt)
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => toggle(opt)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                active
                                    ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                                    : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
                            }`}
                        >
                            {active && <span className="mr-1">✓</span>}
                            {opt}
                        </button>
                    )
                })}
            </div>
            {showOther && (
                <Input
                    value={otherValue ?? ''}
                    onChange={onOtherChange ?? (() => {})}
                    placeholder="Уточните вариант…"
                />
            )}
        </div>
    )
}

function RadioGroup({ options, selected, onChange }: { options: string[]; selected: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {options.map(opt => {
                const active = selected === opt
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            active
                                ? 'bg-sky-500/25 border-sky-400/60 text-sky-300'
                                : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground'
                        }`}
                    >
                        {active && <span className="mr-1">✓</span>}
                        {opt}
                    </button>
                )
            })}
        </div>
    )
}

type Errors = Partial<Record<keyof BriefFormData, string>>

function validateStep(step: number, form: BriefFormData): Errors {
    const errs: Errors = {}
    if (step === 0) {
        if (!form.contact_person.trim()) errs.contact_person = 'Обязательное поле'
        if (!form.company_name.trim()) errs.company_name = 'Обязательное поле'
        if (!form.company_activity.trim()) errs.company_activity = 'Обязательное поле'
        if (!form.products_info.trim()) errs.products_info = 'Обязательное поле'
        if (!form.site_sections.trim()) errs.site_sections = 'Обязательное поле'
        if (!form.brand_style.trim()) errs.brand_style = 'Обязательное поле'
    }
    if (step === 1) {
        if (form.site_types.length === 0) errs.site_types = 'Выберите хотя бы один тип'
        if (form.site_tasks.length === 0) errs.site_tasks = 'Выберите хотя бы одну задачу'
        if (!form.target_audience.trim()) errs.target_audience = 'Обязательное поле'
        if (!form.language_versions.trim()) errs.language_versions = 'Обязательное поле'
    }
    if (step === 2) {
        if (!form.design_impression.trim()) errs.design_impression = 'Обязательное поле'
        if (!form.color_scheme.trim()) errs.color_scheme = 'Обязательное поле'
        if (!form.content_placement.trim()) errs.content_placement = 'Обязательное поле'
    }
    if (step === 3) {
        if (!form.has_advertising.trim()) errs.has_advertising = 'Обязательное поле'
        if (!form.hosting_type.trim()) errs.hosting_type = 'Обязательное поле'
        if (!form.tech_support.trim()) errs.tech_support = 'Обязательное поле'
        if (!form.content_filling.trim()) errs.content_filling = 'Обязательное поле'
    }
    return errs
}

export default function BriefOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [step, setStep] = useState(0)
    const [form, setForm] = useState<BriefFormData>(EMPTY)
    const [errors, setErrors] = useState<Errors>({})
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)
    const [serverError, setServerError] = useState('')

    const set = (key: keyof BriefFormData, value: any) => {
        setForm(p => ({ ...p, [key]: value }))
        setErrors(p => ({ ...p, [key]: undefined }))
    }

    const handleNext = () => {
        const errs = validateStep(step, form)
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setErrors({})
        setStep(s => s + 1)
    }

    const handleBack = () => { setErrors({}); setStep(s => s - 1) }

    const handleSubmit = async () => {
        const errs = validateStep(step, form)
        if (Object.keys(errs).length > 0) { setErrors(errs); return }
        setSubmitting(true)
        setServerError('')
        try {
            await apiCreateBriefOrder(form)
            setDone(true)
        } catch (e: any) {
            setServerError(e?.response?.data?.message || 'Произошла ошибка. Попробуйте ещё раз.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleClose = () => {
        onClose()
        setTimeout(() => { setStep(0); setForm(EMPTY); setErrors({}); setDone(false); setServerError('') }, 300)
    }

    if (!open) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                onClick={e => { if (e.target === e.currentTarget) handleClose() }}
            >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 pb-4 border-b border-white/8 shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Запросить стоимость разработки</h2>
                            {!done && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Заполните бриф — после изучения заявки мы свяжемся с вами и назовём точные сроки и стоимость.
                                    <br />
                                    <span className="text-red-400">*</span> — обязательные поля.
                                </p>
                            )}
                        </div>
                        <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4">
                            <X size={18} />
                        </button>
                    </div>

                    {done ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4"
                        >
                            <CheckCircle2 size={56} className="text-emerald-400" />
                            <h3 className="text-2xl font-bold">Заявка отправлена!</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Спасибо! Мы изучим ваш бриф, рассчитаем сроки и стоимость и свяжемся с вами в ближайшее время.
                            </p>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors"
                            >
                                Закрыть
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            {/* Step indicator */}
                            <div className="flex items-center gap-1 px-6 py-3 shrink-0 border-b border-white/8">
                                {STEPS.map((s, i) => (
                                    <div key={i} className="flex items-center gap-1 flex-1">
                                        <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${i === step ? 'text-sky-400' : i < step ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${i === step ? 'bg-sky-500 border-sky-500 text-white' : i < step ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}`}>
                                                {i < step ? '✓' : i + 1}
                                            </div>
                                            <span className="hidden sm:block">{s.title}</span>
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div className={`flex-1 h-px mx-1 transition-colors ${i < step ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={step}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-5"
                                    >
                                        <div>
                                            <p className="text-sky-400 text-xs font-semibold tracking-widest uppercase mb-0.5">{STEPS[step].subtitle}</p>
                                            <h3 className="text-lg font-bold">{STEPS[step].title}</h3>
                                        </div>

                                        {step === 0 && (
                                            <>
                                                <Field label="Контактное лицо и способ связи" required error={errors.contact_person}>
                                                    <Input value={form.contact_person} onChange={v => set('contact_person', v)} placeholder="Например: Иван Петров, +7 999 123-45-67, ivan@mail.ru" />
                                                </Field>
                                                <Field label="Полное название компании или частного лица" required error={errors.company_name}>
                                                    <Input value={form.company_name} onChange={v => set('company_name', v)} placeholder="ООО «Название» или ИП Фамилия" />
                                                </Field>
                                                <Field label="Основные направления деятельности" required error={errors.company_activity}>
                                                    <Textarea value={form.company_activity} onChange={v => set('company_activity', v)} placeholder="Чем занимается компания, основные продукты и услуги" />
                                                </Field>
                                                <Field label="Описание товаров или услуг и их количество" required error={errors.products_info}>
                                                    <Textarea value={form.products_info} onChange={v => set('products_info', v)} placeholder="Перечислите основные товары или услуги, их особенности" />
                                                </Field>
                                                <Field label="Предполагаемые разделы сайта" required error={errors.site_sections}>
                                                    <Textarea value={form.site_sections} onChange={v => set('site_sections', v)} placeholder="Например: Главная, О компании, Услуги, Портфолио, Контакты" />
                                                </Field>
                                                <Field label="Есть ли фирменный стиль (логотип, цвета, шрифты)?" required error={errors.brand_style}>
                                                    <Input value={form.brand_style} onChange={v => set('brand_style', v)} placeholder="Да / Нет. Если да — уточните, что будет предоставлено" />
                                                </Field>
                                                <Field label="Адрес действующего сайта (если есть)">
                                                    <Input value={form.current_site} onChange={v => set('current_site', v)} placeholder="https://example.com" />
                                                </Field>
                                                <Field label="Что устраивает в текущем сайте, а что хотели бы изменить?">
                                                    <Textarea value={form.current_site_assessment} onChange={v => set('current_site_assessment', v)} placeholder="Ваши комментарии по текущему сайту" />
                                                </Field>
                                                <Field label="Конкуренты (адреса сайтов, что нравится / не нравится)">
                                                    <Textarea value={form.competitors} onChange={v => set('competitors', v)} placeholder="Сайт конкурента 1: ... — нравится ..., не нравится ..." rows={4} />
                                                </Field>
                                            </>
                                        )}

                                        {step === 1 && (
                                            <>
                                                <Field label="Предполагаемый адрес сайта (домен)">
                                                    <Input value={form.proposed_domain} onChange={v => set('proposed_domain', v)} placeholder="example.ru" />
                                                </Field>
                                                <Field label="Тип создаваемого сайта" required error={errors.site_types}>
                                                    <CheckGroup
                                                        options={SITE_TYPES}
                                                        selected={form.site_types}
                                                        onChange={v => set('site_types', v)}
                                                        otherLabel="Другой"
                                                        otherValue={form.site_type_other}
                                                        onOtherChange={v => set('site_type_other', v)}
                                                    />
                                                </Field>
                                                <Field label="Задачи, которые должен решать сайт" required error={errors.site_tasks}>
                                                    <CheckGroup
                                                        options={SITE_TASKS}
                                                        selected={form.site_tasks}
                                                        onChange={v => set('site_tasks', v)}
                                                        otherLabel="Другие"
                                                        otherValue={form.site_tasks_other}
                                                        onOtherChange={v => set('site_tasks_other', v)}
                                                    />
                                                </Field>
                                                <Field label="Функциональные возможности сайта">
                                                    <CheckGroup
                                                        options={SITE_FUNCTIONALITY}
                                                        selected={form.site_functionality}
                                                        onChange={v => set('site_functionality', v)}
                                                        otherLabel="Другие"
                                                        otherValue={form.site_functionality_other}
                                                        onOtherChange={v => set('site_functionality_other', v)}
                                                    />
                                                </Field>
                                                <Field label="Целевая аудитория сайта" required error={errors.target_audience}>
                                                    <Textarea value={form.target_audience} onChange={v => set('target_audience', v)} placeholder="Опишите вашу аудиторию: возраст, интересы, география и т. д." />
                                                </Field>
                                                <Field label="Нужны ли языковые версии сайта?" required error={errors.language_versions}>
                                                    <Input value={form.language_versions} onChange={v => set('language_versions', v)} placeholder="Только русский / Русский и английский / и т. д." />
                                                </Field>
                                            </>
                                        )}

                                        {step === 2 && (
                                            <>
                                                <Field label="Какое впечатление должен производить сайт?" required error={errors.design_impression}>
                                                    <Textarea value={form.design_impression} onChange={v => set('design_impression', v)} placeholder="Строгий и деловой / Яркий и динамичный / Минималистичный и т. д." />
                                                </Field>
                                                <Field label="Предпочтения по цветовой гамме" required error={errors.color_scheme}>
                                                    <Input value={form.color_scheme} onChange={v => set('color_scheme', v)} placeholder="Например: тёмные тона + синий акцент, либо белый + зелёный" />
                                                </Field>
                                                <Field label="Предпочтительное расположение основного контента" required error={errors.content_placement}>
                                                    <Input value={form.content_placement} onChange={v => set('content_placement', v)} placeholder="По центру / В левой части / В правой части" />
                                                </Field>
                                                <Field label="Сайты, которые нравятся (адреса и что именно нравится)">
                                                    <Textarea value={form.liked_sites} onChange={v => set('liked_sites', v)} placeholder="example.com — нравится дизайн шапки и удобство меню" />
                                                </Field>
                                                <Field label="Сайты с неприемлемым дизайном (адреса и причины)">
                                                    <Textarea value={form.disliked_sites} onChange={v => set('disliked_sites', v)} placeholder="example2.com — слишком много анимации, неудобная навигация" />
                                                </Field>
                                            </>
                                        )}

                                        {step === 3 && (
                                            <>
                                                <Field label="Нужно ли место для баннерной рекламы?" required error={errors.has_advertising}>
                                                    <RadioGroup options={['Да', 'Нет']} selected={form.has_advertising} onChange={v => set('has_advertising', v)} />
                                                </Field>
                                                {form.has_advertising === 'Да' && (
                                                    <Field label="Информация о рекламе (тип, расположение, размеры, количество)">
                                                        <Textarea value={form.advertising_details} onChange={v => set('advertising_details', v)} placeholder="Например: 1 баннер 728×90 в шапке, 1 блок 300×250 в сайдбаре" />
                                                    </Field>
                                                )}
                                                <Field label="Размещение сайта" required error={errors.hosting_type}>
                                                    <RadioGroup options={HOSTING_OPTIONS} selected={form.hosting_type} onChange={v => set('hosting_type', v)} />
                                                </Field>
                                                <Field label="Нужна ли техническая поддержка после сдачи проекта?" required error={errors.tech_support}>
                                                    <Textarea value={form.tech_support} onChange={v => set('tech_support', v)} placeholder="Да / Нет. Если да — уточните объём: обновление контента, доработки и т. д." rows={2} />
                                                </Field>
                                                <Field label="Наполнение сайта контентом" required error={errors.content_filling}>
                                                    <RadioGroup options={CONTENT_OPTIONS} selected={form.content_filling} onChange={v => set('content_filling', v)} />
                                                </Field>
                                                <Field label="Дополнительные пожелания">
                                                    <Textarea value={form.additional_wishes} onChange={v => set('additional_wishes', v)} placeholder="Любые другие пожелания, сроки, бюджет и т. д." rows={4} />
                                                </Field>
                                                {serverError && (
                                                    <p className="text-sm text-red-400 flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                                        <AlertCircle size={15} /> {serverError}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between p-5 border-t border-white/8 shrink-0">
                                <button
                                    onClick={handleBack}
                                    disabled={step === 0}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} /> Назад
                                </button>
                                <span className="text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
                                {step < STEPS.length - 1 ? (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-colors"
                                    >
                                        Далее <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-colors disabled:opacity-60"
                                    >
                                        {submitting ? 'Отправка…' : <><Send size={15} /> Отправить заявку</>}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
