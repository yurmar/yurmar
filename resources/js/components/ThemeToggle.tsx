import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { toggleTheme } from "@/store/slice/themeSlice"

export function ThemeToggle() {
    const dark = useSelector((state: RootState) => state.theme.dark)
    const dispatch = useDispatch()

    return (
        <Button
            className="bg-glass rounded-4xl w-8 h-8 md:w-10 md:h-10"
            variant="ghost"
            size="icon"
            aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
            onClick={() => dispatch(toggleTheme())}
        >
            {dark ? <Sun /> : <Moon className="text-gray-600" />}
        </Button>
    )
}
