import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Check, ClipboardCopy, FileText, Loader2, X } from 'lucide-react'
import {
    apiImportInto,
    apiImportPreview,
    apiImportPreviewInto,
    apiImportProject,
    ImportPreview,
    NotebookProject,
} from '@/api/notebookProjects'
import importDoc from '../../../../docs/notebook-project-plan-import.md?raw'
import { priorityMeta, statusMeta } from './projectMeta'

interface Props {
    open: boolean
    onClose: () => void
    onImported: (project: NotebookProject) => void
    /** Если задан — план добавляется в этот проект, иначе создаётся новый. */
    projectId?: number
}

// Единый источник промпта — docs/notebook-project-plan-import.md (первый блок ```text).
const PROMPT = /```text\n([\s\S]*?)\n```/.exec(importDoc)?.[1] ?? ''

const errorMessage = (e: unknown) => {
    const data = (e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response?.data
    return data?.errors ? Object.values(data.errors)[0][0] : data?.message ?? 'Не удалось обработать файл'
}

export default function ImportProjectModal({ open, onClose, onImported, projectId }: Props) {
    const [markdown, setMarkdown] = useState('')
    const [fileName, setFileName] = useState('')
    const [preview, setPreview] = useState<ImportPreview | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [promptOpen, setPromptOpen] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setMarkdown('')
            setFileName('')
            setPreview(null)
            setError('')
            setPromptOpen(false)
        }
    }, [open])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [onClose])

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(PROMPT)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch { /* буфер обмена недоступен */ }
    }

    const readFile = async (file: File) => {
        setError('')
        if (file.size > 1024 * 1024) {
            setError('Файл больше 1 МБ')
            return
        }
        setFileName(file.name)
        setMarkdown(await file.text())
    }

    const runPreview = async () => {
        setLoading(true)
        setError('')
        try {
            const r = projectId !== undefined
                ? await apiImportPreviewInto(projectId, markdown)
                : await apiImportPreview({ markdown })
            setPreview(r.data)
        } catch (e) {
            setError(errorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    const runImport = async () => {
        setLoading(true)
        setError('')
        try {
            const r = projectId !== undefined
                ? await apiImportInto(projectId, markdown)
                : await apiImportProject(markdown)
            onImported({ ...r.data.project })
            onClose()
        } catch (e) {
            setError(errorMessage(e))
        } finally {
            setLoading(false)
        }
    }

    const tasksPerMilestone = useMemo(
        () => (preview?.milestones ?? []).map(m => ({ title: m.title, count: m.tasks.length, status: m.status })),
        [preview],
    )

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    data-no-ptr
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                    <motion.div
                        className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0d1a30] shadow-2xl"
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    >
                        <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-white">
                                {projectId !== undefined ? 'Импорт плана из MD' : 'Импорт проекта из MD'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10" aria-label="Закрыть">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-5 pb-2 overflow-y-auto custom-scroll space-y-4">
                            {!preview ? (
                                <>
                                    <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.05] p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPromptOpen(v => !v)}
                                                className="text-sm font-medium text-sky-400 hover:text-sky-300 text-left"
                                            >
                                                Промпт для ИИ — составить план по спеке
                                            </button>
                                            <button
                                                type="button"
                                                onClick={copyPrompt}
                                                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-sky-500 text-white text-xs font-medium whitespace-nowrap hover:bg-sky-600"
                                            >
                                                {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                                                {copied ? 'Скопировано' : 'Скопировать'}
                                            </button>
                                        </div>
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            Отдайте ИИ этот промпт и спеку проекта — он вернёт .md-файл, который можно загрузить ниже.
                                        </p>
                                        {promptOpen && (
                                            <pre className="mt-3 max-h-56 overflow-auto custom-scroll rounded-lg bg-black/30 p-3 text-xs text-gray-300 whitespace-pre-wrap">
                                                {PROMPT}
                                            </pre>
                                        )}
                                    </div>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => inputRef.current?.click()}
                                            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-sky-500/40 text-sky-400 text-sm font-medium whitespace-nowrap hover:bg-sky-500/10"
                                        >
                                            <FileText size={16} /> {fileName ? fileName : 'Выбрать .md-файл'}
                                        </button>
                                        <input
                                            ref={inputRef}
                                            type="file"
                                            accept=".md,.markdown,.txt,text/markdown,text/plain"
                                            className="hidden"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                e.target.value = ''
                                                if (file) void readFile(file)
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Или вставьте текст плана</label>
                                        <textarea
                                            value={markdown}
                                            onChange={e => { setMarkdown(e.target.value); setFileName('') }}
                                            rows={8}
                                            placeholder={'---\nname: Название проекта\n---\n\n## Этап 1\n- [ ] Задача'}
                                            className="w-full input-field rounded-lg px-3 py-2 text-base sm:text-sm font-mono resize-y"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    {projectId !== undefined && (
                                        <p className="text-xs text-gray-400">
                                            Этапы, задачи и ссылки будут добавлены к текущему плану. Свойства проекта из файла
                                            заполнят только пустые поля, заполненное не изменится.
                                        </p>
                                    )}
                                    <div className="rounded-xl border border-sky-500/20 p-3">
                                        <div className="text-base font-semibold text-white">{preview.project.name}</div>
                                        <div className="mt-1 text-xs text-gray-400">
                                            {statusMeta(preview.project.status).label} · приоритет: {priorityMeta(preview.project.priority).label}
                                            {preview.project.start_date && ` · с ${preview.project.start_date}`}
                                            {preview.project.deadline && ` · до ${preview.project.deadline}`}
                                        </div>
                                        {preview.project.description && (
                                            <p className="mt-2 text-sm text-gray-300">{preview.project.description}</p>
                                        )}
                                        {preview.project.technologies && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {preview.project.technologies.map(t => (
                                                    <span key={t} className="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-xs text-gray-200">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-center">
                                        {[
                                            ['Этапов', preview.totals.milestones],
                                            ['Задач', preview.totals.tasks],
                                            ['Ссылок', preview.totals.links],
                                        ].map(([label, value]) => (
                                            <div key={label as string} className="rounded-lg bg-white/5 py-2">
                                                <div className="text-lg font-semibold text-white">{value}</div>
                                                <div className="text-xs text-gray-400">{label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {tasksPerMilestone.length > 0 && (
                                        <ul className="space-y-1">
                                            {tasksPerMilestone.map((m, i) => (
                                                <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-sm text-gray-200">
                                                    <span className="truncate">{m.title}</span>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{m.count} задач</span>
                                                </li>
                                            ))}
                                            {preview.unassigned.length > 0 && (
                                                <li className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-2.5 py-1.5 text-sm text-gray-200">
                                                    <span>Без этапа</span>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{preview.unassigned.length} задач</span>
                                                </li>
                                            )}
                                        </ul>
                                    )}

                                    {preview.warnings.length > 0 && (
                                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
                                                <AlertTriangle size={14} /> Предупреждения ({preview.warnings.length})
                                            </div>
                                            <ul className="mt-1.5 space-y-1 text-xs text-gray-300 list-disc pl-4">
                                                {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && <p className="text-sm text-red-400">{error}</p>}
                        </div>

                        <div className="flex justify-end gap-2 p-5 pt-3 flex-shrink-0">
                            {preview ? (
                                <>
                                    <button type="button" onClick={() => setPreview(null)} className="h-9 px-4 rounded-lg text-sm text-gray-300 hover:bg-white/10 whitespace-nowrap">
                                        Назад
                                    </button>
                                    <button
                                        type="button"
                                        onClick={runImport}
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 disabled:opacity-60"
                                    >
                                        {loading && <Loader2 size={14} className="animate-spin" />} Импортировать
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg text-sm text-gray-300 hover:bg-white/10 whitespace-nowrap">
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={runPreview}
                                        disabled={loading || markdown.trim() === ''}
                                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-sky-500 text-white text-sm font-medium whitespace-nowrap hover:bg-sky-600 disabled:opacity-50"
                                    >
                                        {loading && <Loader2 size={14} className="animate-spin" />} Проверить
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
