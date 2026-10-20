import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, ChartColumn, ClipboardList, FolderKanban, Gavel, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ORG_NAME, makeSeed, type Db } from './data'
import type { Ctx } from './ui'
import CasesTab from './CasesTab'
import CaseDetail from './CaseDetail'
import DashboardTab from './DashboardTab'
import ProjectsTab from './ProjectsTab'
import TasksTab from './TasksTab'
import CalendarTab from './CalendarTab'

type TabId = 'cases' | 'dashboard' | 'projects' | 'tasks' | 'calendar'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: 'cases', label: 'Дела', icon: Gavel },
    { id: 'dashboard', label: 'Дашборд', icon: ChartColumn },
    { id: 'projects', label: 'Проекты', icon: FolderKanban },
    { id: 'tasks', label: 'Задачи', icon: ClipboardList },
    { id: 'calendar', label: 'Календарь', icon: CalendarDays },
]

export default function JudicialExample() {
    const [db, setDbState] = useState<Db>(makeSeed)
    const [params, setParams] = useSearchParams()
    const [toast, setToast] = useState('')

    const requested = params.get('tab')
    const tab: TabId = TABS.some(t => t.id === requested) ? (requested as TabId) : 'cases'
    const caseId = Number(params.get('case')) || null

    const selectTab = useCallback((id: TabId) => {
        const next = new URLSearchParams(params)
        next.set('tab', id)
        next.delete('case')
        setParams(next, { replace: true })
    }, [params, setParams])

    const openCase = useCallback((id: number | null) => {
        const next = new URLSearchParams(params)
        if (id) { next.set('tab', 'cases'); next.set('case', String(id)) } else next.delete('case')
        setParams(next)
        window.scrollTo({ top: 0 })
    }, [params, setParams])

    const notify = useCallback((text: string) => {
        setToast(text)
        window.setTimeout(() => setToast(''), 3200)
    }, [])

    const ctx: Ctx = { db, setDb: f => setDbState(f), notify, openCase }

    return (
        <div className="min-h-screen bg-background pt-16">
            <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
                <Link to="/examples" className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <ArrowLeft size={14} /> Все примеры
                </Link>

                <section
                    className="relative mt-4 overflow-hidden rounded-2xl px-6 py-8 text-white sm:px-12"
                    style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #3b2a6b 100%)' }}
                >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-violet-300">
                        <Scale size={14} /> Юридический департамент
                    </span>
                    <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">Судебные дела</h1>
                    <div className="mt-4 h-px w-16 bg-violet-400" />
                    <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        Учёт судебных споров компаний холдинга: карточки дел с инстанциями, заседаниями, участниками и финансами,
                        сроки и поручения, проекты, календарь и сводный дашборд.
                    </p>
                    <p className="mt-3 text-xs text-white/40">{ORG_NAME} · демо-данные вымышлены, изменения живут до перезагрузки страницы</p>
                </section>

                {!caseId && (
                    <div className="mt-6 flex flex-wrap gap-1.5" role="tablist">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                role="tab"
                                aria-selected={t.id === tab}
                                onClick={() => selectTab(t.id)}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                                    t.id === tab ? 'bg-violet-500/20 text-violet-500 dark:text-violet-400' : 'border border-border bg-foreground/5 text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-6" role="tabpanel">
                    {caseId ? <CaseDetail ctx={ctx} caseId={caseId} /> : (
                        <>
                            {tab === 'cases' && <CasesTab ctx={ctx} />}
                            {tab === 'dashboard' && <DashboardTab ctx={ctx} />}
                            {tab === 'projects' && <ProjectsTab ctx={ctx} />}
                            {tab === 'tasks' && <TasksTab ctx={ctx} />}
                            {tab === 'calendar' && <CalendarTab ctx={ctx} />}
                        </>
                    )}
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
