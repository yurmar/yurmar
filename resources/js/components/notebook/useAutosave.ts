import { useCallback, useEffect, useRef, useState } from 'react'

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'error'

export const AUTOSAVE_DELAY = 700

interface Options<T> {
    save: (patch: Partial<T>) => Promise<unknown>
    delay?: number
}

/**
 * Автосохранение «как в заметках»: debounce 700 мс, накопление изменённых полей,
 * состояния idle → saving → saved. В отличие от заметок, несохранённое
 * сбрасывается на сервер при размонтировании и перед закрытием вкладки.
 */
export function useAutosave<T extends object>({ save, delay = AUTOSAVE_DELAY }: Options<T>) {
    const [saveState, setSaveState] = useState<AutosaveState>('idle')
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    const saveRef = useRef(save)
    const pending = useRef<Partial<T>>({})
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const chain = useRef<Promise<void>>(Promise.resolve())
    const mounted = useRef(true)

    useEffect(() => { saveRef.current = save }, [save])

    const hasPending = () => Object.keys(pending.current).length > 0

    const run = useCallback((): Promise<void> => {
        if (timer.current) {
            clearTimeout(timer.current)
            timer.current = null
        }
        chain.current = chain.current.then(async () => {
            if (!hasPending()) return
            const patch = pending.current
            pending.current = {}
            try {
                await saveRef.current(patch)
                if (!mounted.current) return
                setFieldErrors({})
                setSaveState(hasPending() ? 'saving' : 'saved')
            } catch (e: unknown) {
                // Возвращаем неотправленное под более свежие правки: ввод не теряется.
                pending.current = { ...patch, ...pending.current }
                if (!mounted.current) return
                const errors = (e as { response?: { data?: { errors?: Record<string, string[]> } } })
                    .response?.data?.errors
                setFieldErrors(
                    errors ? Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]])) : {}
                )
                setSaveState('error')
            }
        })
        return chain.current
    }, [])

    const schedule = useCallback((patch: Partial<T>) => {
        pending.current = { ...pending.current, ...patch }
        setSaveState('saving')
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => { void run() }, delay)
    }, [delay, run])

    const flush = useCallback(() => run(), [run])

    useEffect(() => {
        mounted.current = true
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasPending()) return
            void run()
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload)
            if (hasPending()) void run()
            mounted.current = false
        }
    }, [run])

    return { saveState, fieldErrors, schedule, flush }
}
