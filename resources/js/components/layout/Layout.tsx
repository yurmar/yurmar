import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTop from '@/components/ScrollToTop'
import { useEffect } from 'react'

export default function Layout() {
    const { pathname, hash } = useLocation()

    useEffect(() => {
        if (hash) {
            setTimeout(() => {
                document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }
    }, [pathname])

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <ScrollToTop />
        </div>
    )
}
