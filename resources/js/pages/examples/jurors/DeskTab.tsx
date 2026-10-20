import { useMemo, useState } from 'react'
import { ClipboardList, FileSpreadsheet } from 'lucide-react'
import { KIND_LABEL, TYPE_LABEL, ageDays, areaName, fmtDate, openCount, paperComplete, platformName, type Submission } from './data'
import { BTN_GHOST, CARD, CHIP, Empty, FIELD, LABEL, Segmented, StatusBadge, type Ctx } from './ui'

type Queue = 'pending' | 'errors' | 'stale' | 'accepted' | 'rejected' | 'all'

const QUEUES: { id: Queue; label: string; test: (s: Submission) => boolean }[] = [
    { id: 'pending', label: 'Ждут решения', test: s => s.status === 'checked' },
    { id: 'errors', label: 'С открытыми ошибками', test: s => s.status === 'checked' && openCount(s, 'error') > 0 },
    { id: 'stale', label: 'Просрочены', test: s => s.status === 'checked' && ageDays(s.uploadedAt) > 7 },
    { id: 'accepted', label: 'Приняты', test: s => s.status === 'accepted' },
    { id: 'rejected', label: 'Отклонены', test: s => s.status === 'rejected' },
    { id: 'all', label: 'Все', test: () => true },
]

/** Рабочий стол проверяющего: единая очередь всех загрузок с фильтрами */
export default function DeskTab({ ctx }: { ctx: Ctx }) {
    const { db, go } = ctx
    const [queue, setQueue] = useState<Queue>('pending')
    const [areaId, setAreaId] = useState('')

    const items = useMemo(() => {
        const test = QUEUES.find(q => q.id === queue)!.test
        return db.submissions
            .filter(s => test(s) && (!areaId || s.areaId === Number(areaId)))
            .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt) || b.id - a.id)
    }, [db.submissions, queue, areaId])

    return (
        <div className="space-y-4">
            <div className={`${CARD} p-5`}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_300px]">
                    <div>
                        <span className={LABEL}>Очередь</span>
                        <Segmented<Queue> value={queue} options={QUEUES.map(q => ({ id: q.id, label: q.label }))} onChange={setQueue} />
                    </div>
                    <div>
                        <span className={LABEL}>Территориальная комиссия</span>
                        <select className={FIELD} value={areaId} onChange={e => setAreaId(e.target.value)}>
                            <option value="">Все комиссии</option>
                            {db.areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                </div>
                {queue === 'stale' && <p className="mt-3 text-xs text-muted-foreground">Просрочены — загрузки, которые ждут решения дольше 7 дней.</p>}
            </div>

            {items.length === 0 ? (
                <div className={CARD}><Empty icon={ClipboardList} text="В этой очереди загрузок нет" /></div>
            ) : (
                <div className="space-y-2">
                    {items.map(s => (
                        <div key={s.id} className={`${CARD} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}>
                            <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm font-medium">
                                    <FileSpreadsheet size={16} className="flex-shrink-0 text-muted-foreground" />
                                    <span className="truncate">{s.fileName}</span>
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {areaName(db, s.areaId)} · {platformName(db, s.platformId)} · {TYPE_LABEL[s.type]} · {KIND_LABEL[s.kind].toLowerCase()} · {s.year} · {fmtDate(s.uploadedAt)}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {s.status === 'checked' && (
                                        <>
                                            <span className={CHIP}>Открытых ошибок: {openCount(s, 'error')}</span>
                                            <span className={CHIP}>Вопросов: {openCount(s, 'question')}</span>
                                            <span className={CHIP}>Ждёт {ageDays(s.uploadedAt)} дн.</span>
                                        </>
                                    )}
                                    {(s.status === 'checked' || s.status === 'accepted') && <span className={CHIP}>{paperComplete(s.paper) ? 'Сверка оформлена' : 'Сверка не оформлена'}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusBadge status={s.status} />
                                <button type="button" className={BTN_GHOST} onClick={() => go('upload', s.id)}>Открыть</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
