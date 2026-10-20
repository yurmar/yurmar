import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Db, SubStatus } from './data'

export { BTN, BTN_DANGER_ICON, BTN_GHOST, BTN_ICON, CHIP, FIELD, Sheet } from '../polls/ui'

export interface Ctx {
    db: Db
    setDb: (f: (d: Db) => Db) => void
    notify: (text: string) => void
    /** Переход на вкладку; для «Загрузки и проверки» — с выбранной загрузкой */
    go: (tab: 'upload' | 'desk' | 'candidates', submissionId?: number) => void
}

export const LABEL = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground'
export const CARD = 'card-block rounded-2xl'

export const STATUS_BADGE: Record<SubStatus, { label: string; cls: string }> = {
    checked: { label: 'Проверена', cls: 'bg-sky-500/15 text-sky-500 dark:text-sky-400' },
    accepted: { label: 'Принята', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
    rejected: { label: 'Отклонена', cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400' },
    failed: { label: 'Ошибка файла', cls: 'bg-rose-500/15 text-rose-500 dark:text-rose-400' },
}

export function Badge({ cls, children }: { cls: string; children: ReactNode }) {
    return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${cls}`}>{children}</span>
}

export const StatusBadge = ({ status }: { status: SubStatus }) => <Badge cls={STATUS_BADGE[status].cls}>{STATUS_BADGE[status].label}</Badge>

export function CandidateBadge({ status }: { status: 'active' | 'removed' }) {
    return status === 'active'
        ? <Badge cls="bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">Действует</Badge>
        : <Badge cls="bg-amber-500/15 text-amber-500 dark:text-amber-400">Исключён</Badge>
}

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
    return (
        <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-foreground/5 p-1">
            {options.map(o => (
                <button
                    key={o.id}
                    type="button"
                    onClick={() => onChange(o.id)}
                    className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                        value === o.id ? 'bg-sky-500/20 text-sky-500 dark:text-sky-400' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    )
}

export function Empty({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Icon size={32} className="text-sky-500" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}

export function Chk({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
    return (
        <label className={`flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer hover:bg-foreground/5'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0" checked={checked} disabled={disabled} onChange={e => onChange(e.target.checked)} />
            <span>{label}</span>
        </label>
    )
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-foreground/5">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {head.map(h => <th key={h} className="whitespace-nowrap px-3 py-2">{h}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">{children}</tbody>
            </table>
        </div>
    )
}

export const TD = 'px-3 py-2'
export const TR = 'odd:bg-foreground/[0.03] hover:bg-foreground/[0.06]'

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <div className={`${CARD} p-5 sm:p-6`}>
            <h2 className="text-lg font-semibold">{title}</h2>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            <div className="mt-4">{children}</div>
        </div>
    )
}
