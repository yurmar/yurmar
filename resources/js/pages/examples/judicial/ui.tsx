import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { DEADLINE_DOT, deadlineColor, type Db, type Status, STATUS_CLS, STATUS_LABEL } from './data'

export { BTN, BTN_DANGER_ICON, BTN_GHOST, BTN_ICON, CHIP, FIELD, Sheet } from '../polls/ui'
export { Badge, Chk, Empty, LABEL, CARD, Section, Segmented, TD, TR, Table } from '../jurors/ui'

export interface Ctx {
    db: Db
    setDb: (f: (d: Db) => Db) => void
    notify: (text: string) => void
    /** Открыть карточку дела (null — закрыть) */
    openCase: (id: number | null) => void
}

export const StatusBadge = ({ status }: { status: Status }) => (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_CLS[status]}`}>{STATUS_LABEL[status]}</span>
)

export function Dot({ date, done }: { date: string | null; done?: boolean }) {
    return <span className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${DEADLINE_DOT[deadlineColor(date, done)]}`} aria-hidden />
}

export function StatTile({ title, value, icon: Icon, tone = 'text-sky-500', onClick }: { title: string; value: ReactNode; icon: LucideIcon; tone?: string; onClick?: () => void }) {
    const Comp = onClick ? 'button' : 'div'
    return (
        <Comp
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            className={`card-block rounded-2xl p-4 text-left ${onClick ? 'transition-colors hover:bg-foreground/5' : ''}`}
        >
            <div className="flex items-start gap-2">
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${tone}`} />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
            </div>
            <p className="mt-2 text-xl font-semibold">{value}</p>
        </Comp>
    )
}

/** Контрол «метка + элемент» для форм */
export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
    return (
        <label className={`block ${className}`}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            {children}
        </label>
    )
}
