import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <p className="text-8xl font-bold text-sky-400/30 mb-4">404</p>
                <h1 className="text-3xl font-bold mb-2">Страница не найдена</h1>
                <p className="text-muted-foreground mb-8">Такой страницы не существует</p>
                <Link to="/">
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm"
                    >
                        <Home size={16} /> На главную
                    </motion.button>
                </Link>
            </motion.div>
        </div>
    )
}
