import { useState } from 'react'
import { FileDown, FileSpreadsheet, FileText, Presentation, type LucideIcon } from 'lucide-react'
import { BTN, BTN_GHOST, Sheet } from './ui'

export type ExportFormat = 'excel' | 'pdf' | 'pptx'

const FORMATS: Record<ExportFormat, { label: string; file: string; icon: LucideIcon }> = {
    excel: { label: 'Excel', file: 'Excel (.xlsx)', icon: FileSpreadsheet },
    pdf: { label: 'PDF', file: 'PDF', icon: FileText },
    pptx: { label: 'PowerPoint', file: 'PowerPoint (.pptx)', icon: Presentation },
}

/** Кнопки экспорта: в демо вместо скачивания показывают пояснение */
export default function ExportButtons({ formats, what }: { formats: ExportFormat[]; what: string }) {
    const [active, setActive] = useState<ExportFormat | null>(null)

    return (
        <>
            {formats.map(f => {
                const Icon = FORMATS[f].icon
                return (
                    <button key={f} type="button" className={BTN_GHOST} onClick={() => setActive(f)}>
                        <Icon size={15} /> {FORMATS[f].label}
                    </button>
                )
            })}
            {active && (
                <Sheet
                    title={<h2 className="flex items-center gap-2 text-lg font-semibold"><FileDown size={18} className="text-violet-500" />Экспорт в {FORMATS[active].label}</h2>}
                    onClose={() => setActive(null)}
                    footer={<button type="button" className={BTN} onClick={() => setActive(null)}>Понятно</button>}
                >
                    <div className="space-y-3 text-sm leading-relaxed">
                        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                            Это тестовая площадка: файл здесь не создаётся и не скачивается.
                        </p>
                        <p>В боевой системе по нажатию на эту кнопку будет сформирован файл формата {FORMATS[active].file} ({what}) и автоматически скачан на ваше устройство.</p>
                    </div>
                </Sheet>
            )}
        </>
    )
}
