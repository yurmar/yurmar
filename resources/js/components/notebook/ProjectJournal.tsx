import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
    ActivityAction,
    ActivityChange,
    ActivityEntity,
    apiGetProjectJournal,
    ProjectActivity,
} from '@/api/notebookProjects'
import {
    LINK_TYPE_OPTIONS,
    MATERIAL_CATEGORY_OPTIONS,
    MILESTONE_STATUS_OPTIONS,
    PRIORITY_OPTIONS,
    STATUS_OPTIONS,
    TASK_STATUS_OPTIONS,
} from './projectMeta'

interface Props {
    projectId: number
    /** Вкладка открыта: журнал перечитывается при каждом показе. */
    active: boolean
}

const ENTITY_LABEL: Record<ActivityEntity, string> = {
    project: 'проект',
    milestone: 'этап',
    task: 'задача',
    link: 'ссылка',
    file: 'файл',
    folder: 'папка',
    note: 'запись',
}

const ACTION_DOT: Record<ActivityAction, string> = {
    created: 'bg-emerald-400',
    updated: 'bg-sky-400',
    deleted: 'bg-red-400',
    attached: 'bg-violet-400',
    detached: 'bg-amber-400',
    reordered: 'bg-slate-400',
    imported: 'bg-teal-400',
}

const FIELD_LABEL: Record<string, string> = {
    name: 'Название',
    short_name: 'Короткое имя',
    title: 'Название',
    description: 'Описание',
    status: 'Статус',
    priority: 'Приоритет',
    local_path: 'Локальный путь',
    repository_url: 'Репозиторий',
    technologies: 'Технологии',
    start_date: 'Дата начала',
    deadline: 'Дедлайн',
    due_date: 'Срок',
    is_pinned: 'Закрепление',
    milestone_id: 'Этап',
    note_id: 'Запись',
    reference_url: 'Ссылка',
    type: 'Тип',
    path: 'Путь',
    url: 'Адрес',
    category: 'Категория',
    tags: 'Теги',
    folder_id: 'Папка',
    parent_id: 'Родительская папка',
}

const VALUE_LABELS: Record<string, { value: string; label: string }[]> = {
    status: [...STATUS_OPTIONS, ...TASK_STATUS_OPTIONS, ...MILESTONE_STATUS_OPTIONS],
    priority: PRIORITY_OPTIONS,
    type: LINK_TYPE_OPTIONS,
    category: MATERIAL_CATEGORY_OPTIONS,
}

const TOTALS_LABEL: Record<string, string> = { milestones: 'этапов', tasks: 'задач', links: 'ссылок' }

function formatValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === '') return 'пусто'
    if (typeof value === 'boolean') return value ? 'закреплён' : 'откреплён'
    const text = String(value)
    return VALUE_LABELS[field]?.find(o => o.value === text)?.label ?? text
}

function describe(a: ProjectActivity): string {
    const what = ENTITY_LABEL[a.entity]
    switch (a.action) {
        case 'created': return `Добавлено: ${what}`
        case 'updated': return `Изменено: ${what}`
        case 'deleted': return `Удалено: ${what}`
        case 'attached': return 'Привязана запись'
        case 'detached': return 'Отвязана запись'
        case 'reordered': return `Изменён порядок ${a.entity === 'task' ? 'задач' : 'этапов'}`
        case 'imported': {
            const totals = a.changes?.[0]?.to as Record<string, number> | undefined
            const parts = Object.entries(totals ?? {})
                .filter(([k, n]) => TOTALS_LABEL[k] && n > 0)
                .map(([k, n]) => `${n} ${TOTALS_LABEL[k]}`)
            return `Импортирован план${parts.length ? `: ${parts.join(', ')}` : ''}`
        }
    }
}

function changeText(c: ActivityChange): string {
    const label = FIELD_LABEL[c.field] ?? c.field
    if (!('from' in c) && !('to' in c)) return `${label} изменено`
    return `${label}: ${formatValue(c.field, c.from)} → ${formatValue(c.field, c.to)}`
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString('ru-RU', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
}

export default function ProjectJournal({ projectId, active }: Props) {
    const [items, setItems] = useState<ProjectActivity[]>([])
    const [page, setPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [more, setMore] = useState(false)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!active) return
        let cancelled = false
        setError(false)
        apiGetProjectJournal(projectId)
            .then(r => {
                if (cancelled) return
                setItems(r.data.data)
                setPage(r.data.current_page)
                setLastPage(r.data.last_page)
            })
            .catch(() => !cancelled && setError(true))
            .finally(() => !cancelled && setLoading(false))
        return () => { cancelled = true }
    }, [projectId, active])

    const loadMore = async () => {
        setMore(true)
        try {
            const r = await apiGetProjectJournal(projectId, page + 1)
            setItems(prev => [...prev, ...r.data.data])
            setPage(r.data.current_page)
            setLastPage(r.data.last_page)
        } catch {
            setError(true)
        } finally {
            setMore(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center py-10 text-muted-foreground"><Loader2 className="animate-spin" size={20} /></div>
    }

    if (error && items.length === 0) {
        return <p className="text-sm text-red-400 py-6 text-center">Не удалось загрузить журнал</p>
    }

    if (items.length === 0) {
        return <p className="text-sm text-muted-foreground py-6 text-center">Журнал пока пуст</p>
    }

    return (
        <div className="pb-4">
            <ul className="space-y-3">
                {items.map(a => (
                    <li key={a.id} className="flex gap-3">
                        <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${ACTION_DOT[a.action]}`} />
                        <div className="min-w-0 flex-1">
                            <div className="text-sm break-words">
                                <span className="font-medium">{describe(a)}</span>
                                {a.title && a.action !== 'imported' && a.action !== 'reordered' && (
                                    <span className="text-muted-foreground"> «{a.title}»</span>
                                )}
                            </div>
                            {a.action === 'updated' && a.changes && a.changes.length > 0 && (
                                <ul className="mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                                    {a.changes.map((c, i) => <li key={i} className="break-words">{changeText(c)}</li>)}
                                </ul>
                            )}
                            <div className="text-xs text-muted-foreground/70 mt-0.5">{formatDateTime(a.created_at)}</div>
                        </div>
                    </li>
                ))}
            </ul>
            {error && <p className="text-xs text-red-400 mt-3">Не удалось загрузить продолжение</p>}
            {page < lastPage && (
                <button
                    type="button"
                    onClick={loadMore}
                    disabled={more}
                    className="mt-4 text-sm text-sky-500 hover:text-sky-400 disabled:opacity-50 flex items-center gap-1.5"
                >
                    {more && <Loader2 size={14} className="animate-spin" />} Показать ещё
                </button>
            )}
        </div>
    )
}
