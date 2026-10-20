import { FileSpreadsheet, Landmark } from 'lucide-react'
import { KIND_LABEL, fmtDate, platformName, quotaOf } from './data'
import { BTN_GHOST, CARD, CHIP, StatusBadge, type Ctx } from './ui'

export default function OverviewTab({ ctx }: { ctx: Ctx }) {
    const { db, go } = ctx

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {db.areas.map(a => {
                const mine = db.submissions.filter(s => s.areaId === a.id).sort((x, y) => y.uploadedAt.localeCompare(x.uploadedAt) || y.id - x.id)
                const last = mine[0]
                const plan = quotaOf(db, a.id, 'main')
                return (
                    <div key={a.id} className={`${CARD} flex flex-col gap-3 p-5`}>
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-bold leading-tight">{a.name}</h3>
                            {last && <StatusBadge status={last.status} />}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            <span className={CHIP}><Landmark size={14} className="text-muted-foreground" /> {platformName(db, a.platformId)}</span>
                            <span className={CHIP}>План: {plan}</span>
                        </div>
                        {last ? (
                            <div className="space-y-1.5 text-sm">
                                <p className="flex items-center gap-2">
                                    <FileSpreadsheet size={16} className="flex-shrink-0 text-muted-foreground" />
                                    <span>{last.type === 'list' ? 'Список' : 'Изменения'} · {KIND_LABEL[last.kind].toLowerCase()} · {last.year}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">Загружено {fmtDate(last.uploadedAt)} · всего загрузок: {mine.length}</p>
                                {last.status === 'failed' && last.error && <p className="text-xs text-rose-500">{last.error}</p>}
                                {last.status !== 'failed' && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        <span className={CHIP}>Ошибок: {last.findings.filter(f => f.severity === 'error').length}</span>
                                        <span className={CHIP}>Вопросов: {last.findings.filter(f => f.severity === 'question').length}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Файлы ещё не загружались</p>
                        )}
                        <div className="mt-auto pt-1">
                            <button type="button" className={BTN_GHOST} onClick={() => go('upload', last?.id)}>Открыть загрузки</button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
