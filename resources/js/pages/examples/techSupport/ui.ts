import { STATUS_DONE, STATUS_IN_WORK, STATUS_NEW, STATUS_REJECTED } from './data'

export const STATUS_BADGE: Record<number, { label: string; cls: string }> = {
    [STATUS_NEW]: { label: 'Новая', cls: 'bg-rose-500/15 text-rose-500 dark:text-rose-400' },
    [STATUS_IN_WORK]: { label: 'В работе', cls: 'bg-sky-500/15 text-sky-500 dark:text-sky-400' },
    [STATUS_REJECTED]: { label: 'Отклонена', cls: 'bg-amber-500/15 text-amber-500 dark:text-amber-400' },
    [STATUS_DONE]: { label: 'Выполнена', cls: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400' },
}
