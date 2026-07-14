import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import PullToRefresh from './PullToRefresh'
import ScrollToTop from '@/components/ScrollToTop'
import { useEffect } from 'react'
import { smoothScrollTo } from '@/utils/scroll'

export default function Layout() {
    const { pathname, hash } = useLocation()

    useEffect(() => {
        if (hash) {
            setTimeout(() => {
                const el = document.querySelector(hash)
                if (el) smoothScrollTo(el)
            }, 100)
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
        }
    }, [pathname])

    return (
        <div className="flex flex-col min-h-screen pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
            <PullToRefresh />
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
            <ScrollToTop />
            <BottomNav />
        </div>
    )
}
