import { useEffect, useRef, useState } from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'

const THRESHOLD = 70
const MAX_PULL = 90
const RUBBERBAND_CONSTANT = 0.55

/** Прогрессивное сопротивление: тянуть тем тяжелее, чем ближе к MAX_PULL, без жёсткого упора. */
function rubberband(diff: number): number {
    return (diff * MAX_PULL * RUBBERBAND_CONSTANT) / (MAX_PULL + RUBBERBAND_CONSTANT * diff)
}

function isStandalone() {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    )
}

export default function PullToRefresh() {
    const [pull, setPull] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const startY = useRef<number | null>(null)
    const active = useRef(false)

    useEffect(() => {
        if (!isStandalone()) return

        const onTouchStart = (e: TouchEvent) => {
            if (window.scrollY > 0 || refreshing) return
            if ((e.target as HTMLElement).closest('[data-no-ptr]')) return
            startY.current = e.touches[0].clientY
            active.current = true
        }

        const onTouchMove = (e: TouchEvent) => {
            if (!active.current || startY.current === null) return
            if (window.scrollY > 0) {
                active.current = false
                setPull(0)
                return
            }
            const diff = e.touches[0].clientY - startY.current
            if (diff <= 0) {
                // Дрожание пальца у самого начала жеста — не прерывать трекинг,
                // просто увести индикатор к 0 и ждать, вдруг палец снова потянет вниз.
                setPull(0)
                return
            }
            e.preventDefault()
            setPull(rubberband(diff))
        }

        const onTouchEnd = () => {
            if (!active.current) return
            active.current = false
            startY.current = null
            setPull(current => {
                if (current >= THRESHOLD) {
                    setRefreshing(true)
                    window.location.reload()
                    return current
                }
                return 0
            })
        }

        window.addEventListener('touchstart', onTouchStart, { passive: true })
        window.addEventListener('touchmove', onTouchMove, { passive: false })
        window.addEventListener('touchend', onTouchEnd, { passive: true })
        return () => {
            window.removeEventListener('touchstart', onTouchStart)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onTouchEnd)
        }
    }, [refreshing])

    if (!isStandalone()) return null

    const progress = Math.min(pull / THRESHOLD, 1)
    const visible = pull > 0 || refreshing

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[300] flex justify-center pointer-events-none transition-[transform,opacity] duration-200 ease-out"
            style={{ transform: `translateY(${refreshing ? 16 : pull - 40}px)`, opacity: visible ? 1 : 0 }}
        >
            <div className="mt-3 w-9 h-9 rounded-full bg-[#0d1a30] border border-white/10 shadow-lg flex items-center justify-center">
                {refreshing ? (
                    <Loader2 size={18} className="text-sky-400 animate-spin" />
                ) : (
                    <ArrowDown size={18} className="text-sky-400" style={{ transform: `rotate(${progress * 180}deg)` }} />
                )}
            </div>
        </div>
    )
}
