import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Brand from '@/components/Brand'

export default function Footer() {
    return (
        <footer className="border-t border-white/10 py-8 px-4">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Brand className="text-foreground" />
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
