import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart3, ClipboardList, LayoutDashboard, Link2, ListChecks, Settings2, Upload, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ORG_NAME, makeSeed, type Db } from './data'
import type { Ctx } from './ui'
import OverviewTab from './OverviewTab'
import DeskTab from './DeskTab'
import UploadTab from './UploadTab'
import CandidatesTab from './CandidatesTab'
import LinksTab from './LinksTab'
import ReportsTab from './ReportsTab'
import ReferenceTab from './ReferenceTab'

type TabId = 'overview' | 'desk' | 'upload' | 'candidates' | 'links' | 'reports' | 'reference'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
    { id: 'desk', label: 'Рабочий стол', icon: ClipboardList },
    { id: 'upload', label: 'Загрузка и проверка', icon: Upload },
    { id: 'candidates', label: 'Актуальные списки', icon: ListChecks },
    { id: 'links', label: 'Связи', icon: Link2 },
    { id: 'reports', label: 'Отчёты', icon: BarChart3 },
    { id: 'reference', label: 'Справочники', icon: Settings2 },
]

export default function JurorsExample() {
    const [db, setDbState] = useState<Db>(makeSeed)
    const [params, setParams] = useSearchParams()
    const [toast, setToast] = useState('')

    const requested = params.get('tab')
    const tab: TabId = TABS.some(t => t.id === requested) ? (requested as TabId) : 'overview'
    const submissionParam = Number(params.get('submissionId')) || null

    const selectTab = useCallback((id: TabId, submissionId?: number) => {
        const next = new URLSearchParams(params)
        next.set('tab', id)
        if (submissionId) next.set('submissionId', String(submissionId))
        else next.delete('submissionId')
        setParams(next, { replace: true })
    }, [params, setParams])

    const notify = useCallback((text: string) => {
        setToast(text)
        window.setTimeout(() => setToast(''), 3200)
    }, [])

    const ctx: Ctx = { db, setDb: f => setDbState(f), notify, go: (t, id) => selectTab(t, id) }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0c4a6e 100%)' }}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
                        <UsersRound size={14} /> Третейское разбирательство
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Присяжные заседатели</h1>
                    <div className="mt-4 h-px w-16 bg-sky-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Единая база кандидатов в присяжные заседатели: загрузка списков и изменений от территориальных комиссий,
                        автоматическая проверка, актуальные списки и история каждой записи.
                    </p>
                    <p className="mt-3 text-xs text-white/40">{ORG_NAME} · демо-данные вымышлены, изменения живут до перезагрузки страницы</p>
                </section>

                <div className="mt-6 flex flex-wrap gap-1.5" role="tablist">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={t.id === tab}
                            onClick={() => selectTab(t.id)}
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                t.id === tab ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'border border-border bg-foreground/5 text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            <t.icon size={14} /> {t.label}
                        </button>
                    ))}
                </div>

                <div className="mt-6" role="tabpanel">
                    {tab === 'overview' && <OverviewTab ctx={ctx} />}
                    {tab === 'desk' && <DeskTab ctx={ctx} />}
                    {tab === 'upload' && <UploadTab key={submissionParam ?? 0} ctx={ctx} initialSubmissionId={submissionParam} />}
                    {tab === 'candidates' && <CandidatesTab ctx={ctx} />}
                    {tab === 'links' && <LinksTab ctx={ctx} />}
                    {tab === 'reports' && <ReportsTab ctx={ctx} />}
                    {tab === 'reference' && <ReferenceTab ctx={ctx} />}
                </div>
            </div>

            {toast && (
                <div role="status" className="fixed bottom-6 left-1/2 z-[130] -translate-x-1/2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm shadow-xl">
                    {toast}
                </div>
            )}
        </div>
    )
}
