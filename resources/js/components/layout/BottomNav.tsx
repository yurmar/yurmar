import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Mail, ListChecks, FileText } from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { smoothScrollTo } from '@/utils/scroll'

const ITEMS = [
    { label: 'Главная', to: '/', anchor: '#hero', icon: Home },
    { label: 'Примеры', to: '/examples', anchor: null, icon: LayoutGrid },
    { label: 'Контакты', to: '/#contacts', anchor: '#contacts', icon: Mail },
]

const AUTH_ITEMS = [
    { label: 'Задачи', to: '/todo', anchor: null, icon: ListChecks },
    { label: 'Заказы', to: '/orders', anchor: null, icon: FileText },
]

export default function BottomNav() {
    const location = useLocation()
    const isAuth = useSelector((s: RootState) => s.auth.isAuthenticated)

    const items = isAuth ? [...ITEMS, ...AUTH_ITEMS] : ITEMS

    const isActive = (item: typeof ITEMS[0]) => {
        if (item.to === '/') return location.pathname === '/' && location.hash !== '#contacts'
        if (item.anchor === '#contacts') return location.pathname === '/' && location.hash === '#contacts'
        return location.pathname.startsWith(item.to)
    }

    const handleClick = (item: typeof ITEMS[0]) => {
        if (item.anchor && location.pathname === '/') {
            const el = document.querySelector(item.anchor)
            if (el) smoothScrollTo(el)
        }
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bottom-nav pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-stretch justify-around">
                {items.map(item => {
                    const Icon = item.icon
                    const active = isActive(item)
                    return (
                        <Link
                            key={item.label}
                            to={item.to}
                            onClick={() => handleClick(item)}
                            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 min-h-14 transition-colors ${
                                active ? 'text-sky-400' : 'text-muted-foreground'
                            }`}
                        >
                            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
                            <span className="text-[10px] font-medium leading-none">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
