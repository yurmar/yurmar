import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import type { NotebookProject, NotebookProjectPatch } from '@/api/notebookProjects'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from './projectMeta'

interface Props {
    project: NotebookProject
    onChange: (patch: NotebookProjectPatch) => void
    errors: Record<string, string>
    autoFocusName?: boolean
}

const label = 'block text-xs font-medium text-muted-foreground mb-1'
const field = 'w-full input-field rounded-lg px-3 py-2 text-base sm:text-sm'

export default function ProjectForm({ project, onChange, errors, autoFocusName }: Props) {
    const [form, setForm] = useState({
        name: project.name,
        short_name: project.short_name ?? '',
        description: project.description ?? '',
        status: project.status,
        priority: project.priority,
        local_path: project.local_path ?? '',
        repository_url: project.repository_url ?? '',
        start_date: project.start_date ?? '',
        deadline: project.deadline ?? '',
    })
    const [techs, setTechs] = useState<string[]>(project.technologies ?? [])
    const [techInput, setTechInput] = useState('')
    const [pathCopied, setPathCopied] = useState(false)

    const copyPath = async () => {
        try {
            await navigator.clipboard.writeText(form.local_path)
            setPathCopied(true)
            setTimeout(() => setPathCopied(false), 1500)
        } catch { /* буфер обмена недоступен */ }
    }
    const nameRef = useRef<HTMLInputElement>(null)
    const descriptionRef = useRef<HTMLTextAreaElement>(null)

    // Поле описания растёт вместе с текстом, чтобы он помещался целиком.
    const fitDescription = () => {
        const el = descriptionRef.current
        if (!el || el.offsetParent === null) return // вкладка скрыта: замеры нулевые
        el.style.height = 'auto'
        el.style.height = `${el.scrollHeight}px`
    }

    useLayoutEffect(fitDescription, [form.description])

    // Вкладка «Общая информация» монтируется скрытой — пересчитываем при показе и смене ширины.
    useEffect(() => {
        const el = descriptionRef.current
        if (!el || typeof ResizeObserver === 'undefined') return
        const observer = new ResizeObserver(fitDescription)
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (autoFocusName) nameRef.current?.focus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm(prev => ({ ...prev, [key]: value }))
        const nullable = ['short_name', 'description', 'local_path', 'repository_url', 'start_date', 'deadline']
        onChange({ [key]: nullable.includes(key) && value === '' ? null : value } as NotebookProjectPatch)
    }

    const commitTech = () => {
        const value = techInput.trim()
        if (!value || techs.includes(value) || techs.length >= 30) {
            setTechInput('')
            return
        }
        const next = [...techs, value]
        setTechs(next)
        setTechInput('')
        onChange({ technologies: next })
    }

    const removeTech = (t: string) => {
        const next = techs.filter(x => x !== t)
        setTechs(next)
        onChange({ technologies: next.length ? next : null })
    }

    const err = (key: string) =>
        errors[key] ? <p className="mt-1 text-xs text-red-400">{errors[key]}</p> : null

    return (
        <div className="space-y-4">
            <div>
                <input
                    ref={nameRef}
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Название проекта"
                    maxLength={255}
                    className="w-full bg-transparent text-xl font-bold text-foreground placeholder-muted-foreground/50 focus:outline-none text-base sm:text-xl"
                />
                {err('name')}
            </div>

            <div>
                <label className={label}>Короткое название</label>
                <input
                    value={form.short_name}
                    onChange={e => set('short_name', e.target.value)}
                    placeholder="Например, yurmar"
                    maxLength={50}
                    className={field}
                />
                {err('short_name')}
            </div>

            <div>
                <label className={label}>Описание</label>
                <textarea
                    ref={descriptionRef}
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={4}
                    placeholder="Цели, идея, что нужно сделать"
                    className={`${field} resize-none overflow-hidden min-h-[6rem]`}
                />
                {err('description')}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={label}>Статус</label>
                    <select
                        value={form.status}
                        onChange={e => set('status', e.target.value as NotebookProject['status'])}
                        className={field}
                    >
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {err('status')}
                </div>
                <div>
                    <label className={label}>Приоритет</label>
                    <select
                        value={form.priority}
                        onChange={e => set('priority', e.target.value as NotebookProject['priority'])}
                        className={field}
                    >
                        {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {err('priority')}
                </div>
                <div>
                    <label className={label}>Дата начала</label>
                    <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className={field} />
                    {err('start_date')}
                </div>
                <div>
                    <label className={label}>Дедлайн</label>
                    <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={field} />
                    {err('deadline')}
                </div>
            </div>

            <div>
                <label className={label}>Локальный путь</label>
                <div className="flex items-center gap-2">
                    <input
                        value={form.local_path}
                        onChange={e => set('local_path', e.target.value)}
                        placeholder="/Users/me/Projects/my-project"
                        maxLength={1024}
                        className={field}
                    />
                    <button
                        type="button"
                        onClick={copyPath}
                        disabled={!form.local_path}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-sky-500/30 text-sky-500 text-sm font-medium whitespace-nowrap hover:bg-sky-500/10 disabled:opacity-40"
                    >
                        {pathCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        {pathCopied ? 'Скопировано' : 'Копировать'}
                    </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Справочная строка: браузер не открывает каталоги.</p>
                {err('local_path')}
            </div>

            <div>
                <label className={label}>Репозиторий</label>
                <input
                    value={form.repository_url}
                    onChange={e => set('repository_url', e.target.value)}
                    placeholder="https://github.com/user/repo"
                    maxLength={2048}
                    className={field}
                />
                {err('repository_url')}
            </div>

            <div>
                <label className={label}>Технологии</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {techs.map(t => (
                        <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-xs text-foreground">
                            {t}
                            <button type="button" onClick={() => removeTech(t)} aria-label={`Убрать ${t}`} className="text-muted-foreground hover:text-red-400">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
                <input
                    value={techInput}
                    onChange={e => setTechInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            commitTech()
                        }
                    }}
                    onBlur={commitTech}
                    placeholder="Добавьте технологию и нажмите Enter"
                    maxLength={50}
                    className={field}
                />
                {err('technologies')}
            </div>

            <p className="text-xs text-muted-foreground">
                Не храните в описании, путях и ссылках пароли, токены и другие секреты.
            </p>
        </div>
    )
}
