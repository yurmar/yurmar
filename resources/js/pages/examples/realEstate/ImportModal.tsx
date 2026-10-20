import { useState } from 'react'
import { AlertTriangle, FileUp, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { BTN, BTN_DANGER_ICON, BTN_GHOST, FIELD, Sheet } from '../polls/ui'
import type { EgrnContour, EgrnPoint } from './lib/egrnPdfParse'
import { metContent, metFileName, nextId, nowStamp, type ImportRecord } from './data'

export type ImportMode = 'egrn' | 'cadastre'

export interface ImportResult { number: string | null; zone: number; points: EgrnPoint[] }

const LABEL = 'mb-1 block text-xs font-medium text-muted-foreground'

const TEXT = {
    egrn: {
        title: 'Импорт выписки из ЕГРН',
        pick: 'Выберите PDF-файл выписки',
        hint: 'Раздел «Описание местоположения земельного участка» — координаты характерных точек границы, МСК-38',
        numberLabel: 'Кадастровый номер',
        placeholder: '38:36:000099:200',
        sample: '/examples/real-estate/test-vypiska-egrn.pdf',
    },
    cadastre: {
        title: 'Импорт схемы расположения ЗУ',
        pick: 'Выберите PDF схемы расположения ЗУ',
        hint: '«Схема расположения земельного участка на кадастровом плане территории» — координаты характерных точек границы, МСК-38',
        numberLabel: 'Условный номер ЗУ',
        placeholder: '38:36:000099:ЗУ1',
        sample: '/examples/real-estate/test-skhema-uchastka.pdf',
    },
} as const

function downloadText(filename: string, content: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export default function ImportModal({ mode, onClose, onSave, onDone }: {
    mode: ImportMode
    onClose: () => void
    onSave: (record: ImportRecord) => void
    onDone: (result: ImportResult) => void
}) {
    const t = TEXT[mode]
    const [step, setStep] = useState<'select' | 'processing' | 'review'>('select')
    const [stageText, setStageText] = useState('')
    const [progress, setProgress] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [sourceFilename, setSourceFilename] = useState<string | null>(null)
    const [contours, setContours] = useState<EgrnContour[]>([])
    const [active, setActive] = useState(0)
    const [zone, setZone] = useState(3)
    const [area, setArea] = useState<number | null>(null)

    const current: EgrnContour = contours[active] ?? { cadastralNumber: null, points: [] }
    const points = current.points
    const updateCurrent = (fn: (c: EgrnContour) => EgrnContour) =>
        setContours(prev => prev.map((c, i) => (i === active ? fn(c) : c)))
    const setNumber = (v: string) => updateCurrent(c => ({ ...c, cadastralNumber: v }))
    const setPoints = (fn: (p: EgrnPoint[]) => EgrnPoint[]) => updateCurrent(c => ({ ...c, points: fn(c.points) }))

    const handleFile = async (file: File) => {
        setError(null)
        setSourceFilename(file.name)
        setStep('processing')
        try {
            // тяжёлые библиотеки (pdf.js, OCR) грузятся только при импорте
            if (mode === 'cadastre') {
                setStageText('Разбираем PDF…')
                const { parseSchemePdf } = await import('./lib/schemePdfParse')
                const parsed = await parseSchemePdf(file)
                setContours([{ cadastralNumber: parsed.conditionalNumber, points: parsed.points }])
                setArea(parsed.area)
                setZone(parsed.zone ?? 3)
            } else {
                const lib = await import('./lib/egrnPdfParse')
                setStageText('Читаем текст PDF…')
                setProgress(0)
                let parsed = await lib.parseEgrnTextLayer(file)
                if (!parsed) {
                    setStageText('Рендерим страницу PDF…')
                    const canvas = await lib.renderPdfPageToCanvas(file)
                    setStageText('Распознаём текст (OCR)…')
                    const ocr = await lib.ocrPage(canvas, p => setProgress(p))
                    setStageText('Разбираем координаты…')
                    parsed = lib.parseEgrnOcrText(ocr)
                }
                setContours(parsed.contours.length > 0 ? parsed.contours : [{ cadastralNumber: parsed.cadastralNumber, points: parsed.points }])
                setZone(parsed.zone ?? 3)
            }
            setActive(0)
            setStep('review')
        } catch (e) {
            setError((e as Error).message || 'Не удалось обработать PDF')
            setStep('select')
        }
    }

    const setPoint = (idx: number, key: keyof EgrnPoint, value: string) =>
        setPoints(prev => prev.map((p, i) => (i === idx
            ? { ...p, [key]: key === 'num' ? value : (parseFloat(value.replace(',', '.')) || 0) }
            : p)))

    const confirm = () => {
        setError(null)
        const bad = contours.findIndex(c => c.points.length < 3)
        if (bad >= 0) { setActive(bad); setError('Нужно минимум 3 точки контура'); return }
        for (const c of contours) {
            const content = metContent(c.points)
            const filename = metFileName(c.cadastralNumber || null)
            onSave({
                id: nextId(), cadastral_number: c.cadastralNumber || null, coord_system: `МСК-38, зона ${zone}`, zone,
                points: c.points, source_filename: sourceFilename, met_filename: filename, met_content: content,
                created_by_name: 'Орлова Мария', created_at: nowStamp(),
            })
            downloadText(filename, content)
        }
        onDone({ number: contours[0].cadastralNumber || null, zone, points: contours[0].points })
        onClose()
    }

    return (
        <Sheet
            onClose={onClose}
            title={<h3 className="text-lg font-semibold">{t.title}</h3>}
            footer={step === 'review' && (
                <>
                    <button type="button" className={BTN_GHOST} onClick={onClose}>Отмена</button>
                    <button type="button" className={BTN} onClick={confirm}><Save size={16} /> Подтвердить и сохранить</button>
                </>
            )}
        >
            {step === 'select' && (
                <div>
                    <label
                        htmlFor={`${mode}-pdf-input`}
                        className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-foreground/5 px-6 py-12 text-center transition-colors hover:bg-foreground/10"
                    >
                        <FileUp size={22} className="text-sky-500" />
                        <span className="font-medium">{t.pick}</span>
                        <span className="text-xs text-muted-foreground">{t.hint}</span>
                    </label>
                    <input id={`${mode}-pdf-input`} type="file" accept="application/pdf" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                    <p className="mt-3 text-xs text-muted-foreground">
                        Нет файла? Скачайте <a className="text-sky-500 underline" href={t.sample} download>тестовый PDF</a> (вымышленные данные) и загрузите его сюда.
                    </p>
                    {error && <p className="mt-3 flex items-center gap-2 text-sm text-rose-500"><AlertTriangle size={16} className="flex-shrink-0" />{error}</p>}
                </div>
            )}

            {step === 'processing' && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <Loader2 size={32} className="animate-spin text-sky-500" />
                    <p className="font-medium">{stageText}</p>
                    {progress > 0 && (
                        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-foreground/10">
                            <div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground">Разбор выполняется прямо в браузере, файл никуда не отправляется</p>
                </div>
            )}

            {step === 'review' && (
                <div className="space-y-4">
                    <p className="flex items-start gap-2 rounded-xl bg-foreground/5 px-3 py-2 text-xs text-muted-foreground">
                        <AlertTriangle size={16} className="flex-shrink-0 text-amber-500" />
                        Координаты распознаны автоматически — сверьте их с PDF перед сохранением.
                    </p>

                    {contours.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                            {contours.map((c, i) => (
                                <button key={i} type="button" onClick={() => setActive(i)}
                                    className={`${BTN_GHOST} !px-3 !py-1.5 text-xs ${i === active ? '!border-sky-500/50 !bg-sky-500/15' : ''}`}>
                                    {i === 0 ? 'Участок' : 'Часть'} · {c.cadastralNumber || 'без номера'} ({c.points.length})
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={`grid grid-cols-1 gap-4 ${mode === 'cadastre' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                        <div>
                            <label className={LABEL}>{t.numberLabel}</label>
                            <input className={FIELD} placeholder={t.placeholder} value={current.cadastralNumber ?? ''} onChange={e => setNumber(e.target.value)} />
                        </div>
                        <div>
                            <label className={LABEL}>Зона МСК-38</label>
                            <input className={FIELD} inputMode="numeric" value={zone} onChange={e => setZone(parseInt(e.target.value, 10) || 3)} />
                        </div>
                        {mode === 'cadastre' && (
                            <div>
                                <label className={LABEL}>Площадь, кв.м.</label>
                                <input className={FIELD} inputMode="decimal" value={area ?? ''}
                                    onChange={e => setArea(parseFloat(e.target.value.replace(',', '.')) || null)} />
                            </div>
                        )}
                    </div>

                    <div>
                        <div className="mb-1.5 flex items-center justify-between">
                            <label className={`${LABEL} !mb-0`}>Характерные точки границы (X, Y — метры, МСК-38)</label>
                            <button type="button" className={`${BTN_GHOST} !px-3 !py-1.5 text-xs`}
                                onClick={() => setPoints(prev => [...prev, { num: String(prev.length + 1), x: 0, y: 0 }])}>
                                <Plus size={14} /> Точка
                            </button>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-foreground/5">
                                    <tr>{['№', 'X', 'Y', ''].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {points.map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-1.5"><input className={`${FIELD} !w-16`} value={p.num} onChange={e => setPoint(i, 'num', e.target.value)} /></td>
                                            <td className="px-3 py-1.5"><input className={`${FIELD} !w-32`} value={p.x} onChange={e => setPoint(i, 'x', e.target.value)} /></td>
                                            <td className="px-3 py-1.5"><input className={`${FIELD} !w-32`} value={p.y} onChange={e => setPoint(i, 'y', e.target.value)} /></td>
                                            <td className="px-3 py-1.5 text-right">
                                                <button type="button" className={BTN_DANGER_ICON} aria-label="Удалить точку"
                                                    onClick={() => setPoints(prev => prev.filter((_, j) => j !== i))}><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {points.length === 0 && (
                                        <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">Точки не распознаны — добавьте вручную</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {error && <p className="flex items-center gap-2 text-sm text-rose-500"><AlertTriangle size={16} className="flex-shrink-0" />{error}</p>}
                </div>
            )}
        </Sheet>
    )
}
