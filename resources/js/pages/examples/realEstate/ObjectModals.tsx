import { useState } from 'react'
import { Building, CalendarDays, Download, FileText, MapPin, Pencil, Ruler, ShieldCheck, Trash2 } from 'lucide-react'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, CHIP, FIELD, Sheet } from '../polls/ui'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PolygonEditorMap from './PolygonEditorMap'
import {
    STATUSES, STATUS_BADGE, STATUS_LABEL, fmtDateTime, type ImportRecord, type ObjectForm, type PropertyObject, type Status,
} from './data'

const LABEL = 'mb-1 block text-xs font-medium text-muted-foreground'
const SECTION = 'text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground'

function Chip({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
    return <span className={CHIP}><Icon size={14} className="text-muted-foreground" />{label}</span>
}

export function downloadMet(r: ImportRecord) {
    const url = URL.createObjectURL(new Blob([r.met_content], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = r.met_filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

function ImportBlock({ title, data }: { title: string; data: ImportRecord }) {
    return (
        <div className="rounded-xl bg-foreground/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{title}</p>
                <button type="button" className={`${BTN_GHOST} !px-3 !py-1.5 text-xs`} onClick={() => downloadMet(data)}><Download size={14} /> .met</button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
                <span>Система координат: {data.coord_system}</span>
                <span>Точек: {data.points.length}</span>
                <span>Кто загрузил: {data.created_by_name}</span>
                <span>Дата: {fmtDateTime(data.created_at)}</span>
            </div>
            {data.source_filename && (
                <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground"><FileText size={14} />{data.source_filename}</p>
            )}
            {data.points.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto rounded-md border border-border">
                    <table className="min-w-full divide-y divide-border text-xs">
                        <thead className="bg-foreground/5"><tr>{['№', 'X', 'Y'].map(h => <th key={h} className="px-2 py-1 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead>
                        <tbody className="divide-y divide-border">
                            {data.points.map((p, i) => <tr key={i}><td className="px-2 py-1">{p.num}</td><td className="px-2 py-1">{p.x}</td><td className="px-2 py-1">{p.y}</td></tr>)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function DetailModal({ obj, egrn, cadastre, onClose, onEdit, onDelete }: {
    obj: PropertyObject; egrn: ImportRecord | null; cadastre: ImportRecord | null
    onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
    const [confirming, setConfirming] = useState(false)
    return (
        <>
            <Sheet
                onClose={onClose}
                title={<div><h3 className="text-lg font-semibold leading-tight">{obj.name}</h3><p className="mt-1 text-sm text-muted-foreground">{obj.address}</p></div>}
                footer={(
                    <>
                        <button type="button" className={BTN_DANGER_ICON} onClick={() => setConfirming(true)} aria-label="Удалить"><Trash2 size={16} /></button>
                        <button type="button" className={BTN} onClick={onEdit}><Pencil size={16} /> Редактировать</button>
                    </>
                )}
            >
                <div className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[obj.status]}`}>{STATUS_LABEL[obj.status]}</span>
                        {obj.cadastral_number && <Chip icon={ShieldCheck} label={`Кадастровый №: ${obj.cadastral_number}`} />}
                        {obj.area != null && <Chip icon={Ruler} label={`${obj.area} м²`} />}
                        {obj.land_area != null && <Chip icon={MapPin} label={`Участок: ${obj.land_area} м²`} />}
                        {obj.year_built != null && <Chip icon={CalendarDays} label={`${obj.year_built} г. постройки`} />}
                        {obj.floors != null && <Chip icon={Building} label={`${obj.floors} эт.`} />}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div><p className={SECTION}>Назначение</p><p className="mt-1 text-sm">{obj.purpose || '—'}</p></div>
                        <div><p className={SECTION}>Собственник</p><p className="mt-1 text-sm">{obj.owner || '—'}</p></div>
                        <div className="sm:col-span-2"><p className={SECTION}>Ответственный</p><p className="mt-1 text-sm">{obj.responsible_org || '—'}</p></div>
                    </div>
                    {obj.description && <div><p className={SECTION}>Описание</p><p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{obj.description}</p></div>}
                    <div className="rounded-xl bg-foreground/5 px-3 py-2.5 text-xs text-muted-foreground">
                        {obj.polygon ? 'Контур территории обозначен на карте' : 'Контур территории пока не задан'}
                    </div>
                    {(egrn || cadastre) && (
                        <div className="space-y-2">
                            <p className={SECTION}>Данные импорта из PDF</p>
                            {egrn && <ImportBlock title="Выписка из ЕГРН" data={egrn} />}
                            {cadastre && <ImportBlock title="Схема расположения ЗУ на КПТ" data={cadastre} />}
                        </div>
                    )}
                </div>
            </Sheet>
            <ConfirmModal
                open={confirming}
                title={`Удаление «${obj.name}»`}
                message="Будет удалён объект вместе с его контуром на карте."
                onConfirm={() => { setConfirming(false); onDelete() }}
                onClose={() => setConfirming(false)}
            />
        </>
    )
}

const toNum = (v: string): number | null => {
    if (v.trim() === '') return null
    const n = Number(v.replace(',', '.'))
    return Number.isNaN(n) ? null : n
}

export function FormModal({ initial, isEdit, onClose, onSave }: {
    initial: ObjectForm; isEdit: boolean; onClose: () => void; onSave: (f: ObjectForm) => void
}) {
    const [form, setForm] = useState<ObjectForm>(initial)
    const [error, setError] = useState('')
    const set = <K extends keyof ObjectForm>(k: K, v: ObjectForm[K]) => setForm(f => ({ ...f, [k]: v }))
    const str = (k: 'cadastral_number' | 'purpose' | 'owner' | 'responsible_org') => ({
        className: FIELD, value: form[k] ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value || null),
    })
    const numField = (k: 'area' | 'land_area' | 'year_built' | 'floors', label: string, mode: 'decimal' | 'numeric') => (
        <div>
            <label className={LABEL}>{label}</label>
            <input className={FIELD} inputMode={mode} value={form[k] ?? ''} onChange={e => set(k, toNum(e.target.value))} />
        </div>
    )

    const submit = () => {
        if (!form.name.trim() || !form.address.trim()) { setError('Укажите наименование и адрес'); return }
        onSave({ ...form, name: form.name.trim(), address: form.address.trim() })
    }

    return (
        <Sheet
            onClose={onClose}
            title={<h3 className="text-lg font-semibold">{isEdit ? 'Редактирование объекта' : 'Новый объект'}</h3>}
            footer={(
                <>
                    <button type="button" className={BTN_GHOST} onClick={onClose}>Отмена</button>
                    <button type="button" className={BTN} onClick={submit}>Сохранить</button>
                </>
            )}
        >
            <div className="space-y-4">
                <div><label className={LABEL}>Наименование</label><input className={FIELD} value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label className={LABEL}>Адрес</label><input className={FIELD} value={form.address} onChange={e => set('address', e.target.value)} /></div>
                <div>
                    <label className={LABEL}>Расположение и контур территории</label>
                    <PolygonEditorMap
                        lat={form.lat} lng={form.lng} polygon={form.polygon}
                        onCenterChange={(lat, lng) => setForm(f => ({ ...f, lat, lng }))}
                        onPolygonChange={polygon => set('polygon', polygon)}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                        Координаты: {form.lat.toFixed(6)}, {form.lng.toFixed(6)}
                        {form.polygon ? ` · контур: ${form.polygon.length} точек` : ' · контур не задан'}
                    </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>Кадастровый номер</label><input {...str('cadastral_number')} placeholder="38:36:000000:0000" /></div>
                    <div>
                        <label className={LABEL}>Статус</label>
                        <select className={FIELD} value={form.status} onChange={e => set('status', e.target.value as Status)}>
                            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {numField('area', 'Площадь, м²', 'decimal')}
                    {numField('land_area', 'Участок, м²', 'decimal')}
                    {numField('year_built', 'Год постройки', 'numeric')}
                    {numField('floors', 'Этажность', 'numeric')}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div><label className={LABEL}>Назначение</label><input {...str('purpose')} placeholder="Торговое здание" /></div>
                    <div><label className={LABEL}>Собственник</label><input {...str('owner')} /></div>
                    <div className="sm:col-span-2"><label className={LABEL}>Ответственный</label><input {...str('responsible_org')} placeholder="Например, Отдел недвижимости" /></div>
                </div>
                <div>
                    <label className={LABEL}>Описание</label>
                    <textarea rows={3} className={`${FIELD} resize-none`} value={form.description ?? ''} onChange={e => set('description', e.target.value || null)} />
                </div>
                {error && <p className="text-sm text-rose-500">{error}</p>}
            </div>
        </Sheet>
    )
}
