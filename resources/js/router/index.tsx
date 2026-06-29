import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/home'

const Login = lazy(() => import('@/pages/login'))
// const Portfolio = lazy(() => import('@/pages/portfolio'))
const About = lazy(() => import('@/pages/about'))
const Contacts = lazy(() => import('@/pages/contacts'))
const Notebook = lazy(() => import('@/pages/notebook'))
const Orders = lazy(() => import('@/pages/orders'))
const Examples = lazy(() => import('@/pages/examples'))
const PhoneBook = lazy(() => import('@/pages/examples/phoneBook'))
const NotFound = lazy(() => import('@/pages/not-found'))

const fallback = <div className="min-h-screen" />

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'login', element: <Suspense fallback={fallback}><Login /></Suspense> },
            // { path: 'portfolio', element: <Suspense fallback={fallback}><Portfolio /></Suspense> },
            { path: 'about', element: <Suspense fallback={fallback}><About /></Suspense> },
            { path: 'contacts', element: <Suspense fallback={fallback}><Contacts /></Suspense> },
            { path: 'notebook', element: <Suspense fallback={fallback}><Notebook /></Suspense> },
            { path: 'orders', element: <Suspense fallback={fallback}><Orders /></Suspense> },
            { path: 'examples/phone-book', element: <Suspense fallback={fallback}><PhoneBook /></Suspense> },
            { path: 'examples', element: <Suspense fallback={fallback}><Examples /></Suspense> },
            { path: 'examples/:folderId', element: <Suspense fallback={fallback}><Examples /></Suspense> },
            { path: '*', element: <Suspense fallback={fallback}><NotFound /></Suspense> },
        ],
    },
])
