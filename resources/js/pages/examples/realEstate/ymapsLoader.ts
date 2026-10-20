// Единая загрузка Yandex Maps JS API 2.1: скрипт подключается на страницу один раз (id="ymaps-script").
import './lib/ymaps'

const KEY = import.meta.env.VITE_YANDEX_MAPS_KEY as string | undefined

export function loadYmaps(onReady: () => void, onError: (msg: string) => void): () => void {
    let cancelled = false
    const ready = () => { if (!cancelled) window.ymaps?.ready(() => { if (!cancelled) onReady() }) }

    if (window.ymaps) {
        ready()
        return () => { cancelled = true }
    }
    const existing = document.getElementById('ymaps-script') as HTMLScriptElement | null
    if (existing) {
        existing.addEventListener('load', ready)
        return () => { cancelled = true; existing.removeEventListener('load', ready) }
    }
    const s = document.createElement('script')
    s.id = 'ymaps-script'
    s.src = `https://api-maps.yandex.ru/2.1/?apikey=${KEY ?? ''}&lang=ru_RU`
    s.onload = ready
    s.onerror = () => { if (!cancelled) onError('Не удалось загрузить Яндекс.Карты') }
    document.head.appendChild(s)
    return () => { cancelled = true }
}
