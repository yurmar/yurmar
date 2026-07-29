import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="border-t border-white/10 py-8 px-4">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">Yur<span className="text-sky-400">Mar</span></span>
                    <span>© 2013–{new Date().getFullYear()}</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/" className="hover:text-sky-400 transition-colors">Главная</Link>
                    {/* <Link to="/portfolio" className="hover:text-sky-400 transition-colors">Портфолио</Link> */}
                    <a href="mailto:yurmardev@yandex.ru" className="hover:text-sky-400 transition-colors">Email</a>
                </div>
            </div>
        </footer>
    )
}
