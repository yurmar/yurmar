import { useState, useEffect } from 'react'
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import { smoothScrollTo } from '@/utils/scroll'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogIn, LogOut, FileText, ListChecks } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { logout } from '@/store/slice/authSlice'

const NAV = [
    { label: 'Главная', to: '/', anchor: '#hero' },
    // { label: 'Портфолио', to: '/portfolio', anchor: null },
    { label: 'Примеры', to: '/examples', anchor: null },
    { label: 'Блокнот', to: '/notebook', anchor: null },
    { label: 'Обо мне', to: '/#about', anchor: '#about' },
    { label: 'Контакты', to: '/#contacts', anchor: '#contacts' },
]

export default function Header() {
    const [open, setOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', fn, { passive: true })
        return () => window.removeEventListener('scroll', fn)
    }, [])

    useEffect(() => { setOpen(false) }, [location])

    const handleNavClick = (item: typeof NAV[0]) => {
        if (item.anchor && location.pathname === '/') {
            const el = document.querySelector(item.anchor)
            if (el) smoothScrollTo(el)
        }
        setOpen(false)
    }

    const handleLogout = () => dispatch(logout())

    return (
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'header-scrolled' : 'header-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl overflow-hidden border border-sky-400/30">
                        <img src="/images/logo.png" alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <span className="font-bold text-lg text-gray-600 tracking-tight group-hover:text-sky-400 transition-colors">
                        Yur<span className="text-sky-400">Mar</span>
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-1">
                    {NAV.map(item => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            onClick={() => handleNavClick(item)}
                            className={({ isActive }) =>
                                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'text-sky-400 bg-sky-500/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`
                            }
                            end={item.to === '/'}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    {isAuth ? (
                        <div className="hidden md:flex items-center gap-2">
                            <Link
                                to="/todo"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 transition-colors"
                            >
                                <ListChecks size={13} /> Задачи
                            </Link>
                            <Link
                                to="/orders"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 transition-colors"
                            >
                                <FileText size={13} /> Заказы
                            </Link>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
                            >
                                <LogOut size={13} /> Выйти
                            </motion.button>
                        </div>
                    ) : (
                        <Link to="/login" className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sky-400 hover:bg-sky-500/10 border border-sky-500/20 transition-colors">
                            <LogIn size={13} /> Войти
                        </Link>
                    )}

                    {/* Burger */}
                    <button
                        onClick={() => setOpen(!open)}
                        aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                        aria-expanded={open}
                        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-white/10 bg-[#050d1f]/95 backdrop-blur-xl overflow-hidden"
                    >
                        <div className="px-4 py-4 space-y-1">
                            {NAV.map(item => (
                                <NavLink
                                    key={item.label}
                                    to={item.to}
                                    onClick={() => handleNavClick(item)}
                                    className={({ isActive }) =>
                                        `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                            isActive ? 'text-sky-400 bg-sky-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                        }`
                                    }
                                    end={item.to === '/'}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                            <div className="pt-2 border-t border-white/10">
                                {isAuth ? (
                                    <>
                                        <Link to="/todo" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sky-400 hover:bg-sky-500/10">
                                            <ListChecks size={14} /> Задачи
                                        </Link>
                                        <Link to="/orders" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sky-400 hover:bg-sky-500/10">
                                            <FileText size={14} /> Заказы
                                        </Link>
                                        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 w-full">
                                            <LogOut size={14} /> Выйти
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-sky-400 hover:bg-sky-500/10">
                                        <LogIn size={14} /> Войти
                                    </Link>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    )
}