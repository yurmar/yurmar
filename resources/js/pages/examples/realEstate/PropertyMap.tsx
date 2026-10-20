import { useEffect, useRef, useState } from 'react'
import { DEFAULT_CENTER, STATUSES, STATUS_FILL, STATUS_LABEL, type PropertyObject, type Status } from './data'
import { loadYmaps } from './ymapsLoader'
import type { YGeoObject, YMap } from './lib/ymaps'

const PRESET: Record<Status, string> = {
    in_use: 'islands#blueDotIcon',
    reconstruction: 'islands#orangeDotIcon',
    vacant: 'islands#grayDotIcon',
}
const SELECTED_COLOR = '#e11d48'

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

/** Карта объектов: метки и полигоны контуров, цвет по статусу */
export default function PropertyMap({ objects, selectedId, onSelect }: {
    objects: PropertyObject[]; selectedId: number | null; onSelect: (id: number) => void
}) {
    const elRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<YMap | null>(null)
    const marksRef = useRef<Map<number, YGeoObject<[number, number]>>>(new Map())
    const onSelectRef = useRef(onSelect)
    onSelectRef.current = onSelect
    const [ready, setReady] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const stop = loadYmaps(() => {
            if (!elRef.current || mapRef.current || !window.ymaps) return
            mapRef.current = new window.ymaps.Map(elRef.current, {
                center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], zoom: 12, controls: ['zoomControl', 'fullscreenControl'],
            })
            setReady(true)
        }, setError)
        return () => { stop(); mapRef.current?.destroy(); mapRef.current = null }
    }, [])

    useEffect(() => {
        const map = mapRef.current
        const ymaps = window.ymaps
        if (!ready || !map || !ymaps) return
        map.geoObjects.removeAll()
        marksRef.current.clear()
        objects.forEach(o => {
            const sel = o.id === selectedId
            if (o.polygon && o.polygon.length >= 3) {
                const color = sel ? SELECTED_COLOR : STATUS_FILL[o.status]
                const poly = new ymaps.Polygon([o.polygon], {}, {
                    fillColor: color, fillOpacity: sel ? 0.45 : 0.3, strokeColor: color, strokeWidth: sel ? 3 : 2, strokeOpacity: 0.8,
                })
                poly.events.add('click', () => onSelectRef.current(o.id))
                map.geoObjects.add(poly)
            }
            const mark = new ymaps.Placemark([o.lat, o.lng], {
                balloonContentHeader: esc(o.name),
                balloonContentBody: `<div style="font-size:12px;line-height:1.6">${esc(o.address)}`
                    + (o.area ? `<br/><b>Площадь:</b> ${o.area} м²` : '')
                    + (o.year_built ? `<br/><b>Год постройки:</b> ${o.year_built}` : '')
                    + (o.cadastral_number ? `<br/><b>Кадастровый №:</b> ${esc(o.cadastral_number)}` : '') + '</div>',
                hintContent: esc(o.name),
            }, { preset: sel ? 'islands#redIcon' : PRESET[o.status] })
            mark.events.add('click', () => onSelectRef.current(o.id))
            map.geoObjects.add(mark)
            marksRef.current.set(o.id, mark)
        })
        if (objects.length > 0 && selectedId == null) {
            map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
        }
    }, [ready, objects, selectedId])

    useEffect(() => {
        const map = mapRef.current
        if (!ready || !map || selectedId == null) return
        const o = objects.find(x => x.id === selectedId)
        if (!o) return
        map.setCenter([o.lat, o.lng], Math.max(map.getZoom(), 16), { duration: 300 })
        marksRef.current.get(selectedId)?.balloon.open()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, ready])

    return (
        <div id="real-estate-map" className="card-block scroll-mt-20 overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border px-4 py-3 text-xs">
                <span className="text-sm font-semibold">Карта объектов</span>
                {STATUSES.map(s => (
                    <span key={s} className="flex items-center gap-1.5">
                        <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ background: STATUS_FILL[s] }} />{STATUS_LABEL[s]}
                    </span>
                ))}
            </div>
            {error
                ? <div className="flex h-[440px] items-center justify-center text-sm text-rose-500">{error}</div>
                : <div ref={elRef} className="w-full" style={{ height: 480 }} />}
        </div>
    )
}
