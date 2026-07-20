import { Moon, Sun } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useDispatch, useSelector } from "react-redux"
import { RootState } from "@/store"
import { toggleTheme } from "@/store/slice/themeSlice"

export function ThemeToggle() {
    const dark = useSelector((state: RootState) => state.theme.dark)
    const dispatch = useDispatch()

    return (
        <Button
            className="bg-glass rounded-4xl w-8 h-8 md:w-10 md:h-10 relative overflow-hidden"
            variant="ghost"
            size="icon"
            aria-label={dark ? 'Светлая тема' : 'Тёмная тема'}
            onClick={() => dispatch(toggleTheme())}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={dark ? 'sun' : 'moon'}
                    initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-center"
                >
                    {dark ? <Sun /> : <Moon className="text-gray-600" />}
                </motion.span>
            </AnimatePresence>
        </Button>
    )
}
