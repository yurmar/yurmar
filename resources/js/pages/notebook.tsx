import { motion } from 'framer-motion'
import { BookOpen } from 'lucide-react'

export default function Notebook() {
    return (
        <div className="pt-20 min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="text-sky-400" size={28} />
                </div>
                <h1 className="text-4xl font-bold mb-3">Блокнот</h1>
                <p className="text-muted-foreground text-lg">Скоро будет информация</p>
            </motion.div>
        </div>
    )
}
