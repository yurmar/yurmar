import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { smoothScrollTo } from '@/utils/scroll'

export default function ScrollToTop() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const scrollUp = () => smoothScrollTo(0)

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    onClick={scrollUp}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-[100] w-11 h-11 rounded-full
                        bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30
                        flex items-center justify-center transition-colors"
                    aria-label="Наверх"
                >
                    <ArrowUp size={18} />
                </motion.button>
            )}
        </AnimatePresence>
    )
}
