import { Link, useLocation } from 'react-router-dom'

const PAGES = [
    { path: '/examples/hall-of-honor', label: 'Реестр' },
    { path: '/examples/hall-of-honor/filters', label: 'Фильтры' },
    { path: '/examples/hall-of-honor/report', label: 'Аналитика' },
]

export function HonorNav() {
    const { pathname } = useLocation()
    return (
        <div className="flex flex-wrap gap-2 mb-6">
            {PAGES.map(p => {
                const active = pathname === p.path
                return (
                    <Link
                        key={p.path}
                        to={p.path}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border"
                        style={active
                            ? { background: 'var(--honor-ink)', color: '#fff', borderColor: 'var(--honor-ink)' }
                            : { borderColor: 'transparent' }}
                    >
                        <span className={active ? '' : 'text-muted-foreground hover:text-foreground'}>{p.label}</span>
                    </Link>
                )
            })}
        </div>
    )
}
