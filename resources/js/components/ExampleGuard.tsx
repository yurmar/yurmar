import { lazy, Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { apiCheckExampleAccess } from '@/api/examples'

const NotFound = lazy(() => import('@/pages/not-found'))

/** Закрывает прямые ссылки на демо деактивированных примеров от гостей. */
export default function ExampleGuard() {
    const { pathname } = useLocation()
    const [allowed, setAllowed] = useState<boolean | null>(null)

    useEffect(() => {
        setAllowed(null)
        apiCheckExampleAccess(pathname)
            .then(r => setAllowed(r.data.allowed))
            .catch(() => setAllowed(true))
    }, [pathname])

    if (allowed === null) return <div className="min-h-screen" />
    if (!allowed) return <Suspense fallback={<div className="min-h-screen" />}><NotFound /></Suspense>
    return <Outlet />
}
