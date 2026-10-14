export type NotebookTab = 'notes' | 'projects'

interface Props {
    tab: NotebookTab
    onChange: (tab: NotebookTab) => void
}

const TABS: { value: NotebookTab; label: string }[] = [
    { value: 'notes', label: 'Записи' },
    { value: 'projects', label: 'Проекты' },
]

export default function NotebookTabs({ tab, onChange }: Props) {
    return (
        <div className="inline-flex p-0.5 rounded-lg bg-sky-500/10 border border-sky-500/20" role="tablist">
            {TABS.map(t => (
                <button
                    key={t.value}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.value}
                    onClick={() => onChange(t.value)}
                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                        tab === t.value
                            ? 'bg-sky-500 text-white'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    )
}
