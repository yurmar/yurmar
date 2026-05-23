import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setDark } from "@/store/slice/themeSlice"

export function ThemeInitializer() {
    const dispatch = useDispatch()

    useEffect(() => {
        // Сначала смотрим localStorage
        const stored = localStorage.getItem("theme")

        if (stored === "dark") {
            dispatch(setDark(true))
        } else if (stored === "light") {
            dispatch(setDark(false))
        } else {
            // Если в storage ничего нет — смотрим system preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
            dispatch(setDark(prefersDark))
        }
    }, [dispatch])

    return null // компонент ничего не рендерит
}
