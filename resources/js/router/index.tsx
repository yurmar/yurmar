import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import Home from '@/pages/home'
import Login from '@/pages/login'
// import Portfolio from '@/pages/portfolio'
import About from '@/pages/about'
import Contacts from '@/pages/contacts'
import Notebook from '@/pages/notebook'
import Orders from '@/pages/orders'
import NotFound from '@/pages/not-found'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: 'login', element: <Login /> },
            // { path: 'portfolio', element: <Portfolio /> },
            { path: 'about', element: <About /> },
            { path: 'contacts', element: <Contacts /> },
            { path: 'notebook', element: <Notebook /> },
            { path: 'orders', element: <Orders /> },
            { path: '*', element: <NotFound /> },
        ],
    },
])
