import { useEffect, useRef, useState } from 'react'
import { Check, Pencil, Trash2 } from 'lucide-react'
import { BTN_DANGER_ICON, BTN_GHOST } from '../polls/ui'
import type { Polygon } from './data'
import { loadYmaps } from './ymapsLoader'
import type { YGeoObject, YMap } from './lib/ymaps'

const POLY_OPTS = { fillColor: '#3b82f6', strokeColor: '#3b82f6', strokeWidth: 2, fillOpacity: 0.35 }

/** Мини-карта в форме: перетаскиваемая метка здания + рисование контура территории */
export default function PolygonEditorMap({ lat, lng, polygon, onCenterChange, onPolygonChange }: {
    lat: number; lng: number; polygon: Polygon | null
    onCenterChange: (lat: number, lng: number) => void
    onPolygonChange: (polygon: Polygon | null) => void
}) {
    const elRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<YMap | null>(null)
    const markRef = useRef<YGeoObject<[number, number]> | null>(null)
    const polyRef = useRef<YGeoObject<[number, number][][]> | null>(null)
    const [ready, setReady] = useState(false)
    const [drawing, setDrawing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const stop = loadYmaps(() => {
            if (!elRef.current || mapRef.current || !window.ymaps) return
            mapRef.current = new window.ymaps.Map(elRef.current, { center: [lat, lng], zoom: 16, controls: ['zoomControl'] })
            setReady(true)
        }, setError)
        return () => { stop(); mapRef.current?.destroy(); mapRef.current = null; markRef.current = null; polyRef.current = null }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const map = mapRef.current, ymaps = window.ymaps
        if (!ready || !map || !ymaps) return
        if (!markRef.current) {
            const mark = new ymaps.Placemark([lat, lng], {}, { draggable: true, preset: 'islands#blueDotIcon' })
            mark.events.add('dragend', () => {
                const c = mark.geometry.getCoordinates()
                onCenterChange(c[0], c[1])
            })
            map.geoObjects.add(mark)
            markRef.current = mark
        } else {
            markRef.current.geometry.setCoordinates([lat, lng])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, lat, lng])

    const attach = (poly: YGeoObject<[number, number][][]>) => {
        poly.geometry.events.add('change', () => {
            const c = poly.geometry.getCoordinates()
            if (c[0] && c[0].length >= 3) onPolygonChange(c[0] as Polygon)
        })
    }

    // существующий контур рисуется один раз при открытии; дальше геометрией управляет редактор Яндекса
    useEffect(() => {
        const map = mapRef.current, ymaps = window.ymaps
        if (!ready || !map || !ymaps || polyRef.current || !polygon || polygon.length < 3) return
        const poly = new ymaps.Polygon([polygon], {}, POLY_OPTS)
        map.geoObjects.add(poly)
        attach(poly)
        poly.editor.startEditing()
        polyRef.current = poly
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, polygon])

    const startDrawing = () => {
        const map = mapRef.current, ymaps = window.ymaps
        if (!map || !ymaps) return
        if (polyRef.current) map.geoObjects.remove(polyRef.current)
        const poly = new ymaps.Polygon([], {}, POLY_OPTS)
        map.geoObjects.add(poly)
        polyRef.current = poly
        attach(poly)
        poly.editor.startDrawing()
        setDrawing(true)
    }

    const finishDrawing = () => {
        polyRef.current?.editor.stopDrawing()
        polyRef.current?.editor.startEditing()
        setDrawing(false)
    }

    const clearPolygon = () => {
        if (polyRef.current && mapRef.current) mapRef.current.geoObjects.remove(polyRef.current)
        polyRef.current = null
        setDrawing(false)
        onPolygonChange(null)
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-foreground/5 px-3 py-2">
                <p className="min-w-[160px] flex-1 text-xs text-muted-foreground">
                    Перетащите метку — расположение здания. Кнопкой справа — контур территории.
                </p>
                {drawing ? (
                    <button type="button" className={BTN_GHOST} onClick={finishDrawing}><Check size={14} /> Готово</button>
                ) : (
                    <button type="button" className={BTN_GHOST} onClick={startDrawing}>
                        <Pencil size={14} /> {polygon ? 'Перерисовать контур' : 'Нарисовать контур'}
                    </button>
                )}
                {polygon && !drawing && (
                    <button type="button" className={BTN_DANGER_ICON} onClick={clearPolygon} aria-label="Очистить контур"><Trash2 size={14} /></button>
                )}
            </div>
            {error
                ? <div className="flex h-64 items-center justify-center text-sm text-rose-500">{error}</div>
                : <div ref={elRef} className="w-full" style={{ height: 280 }} />}
        </div>
    )
}
