import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider, useDispatch } from 'react-redux'
import { store, AppDispatch } from './store'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ThemeInitializer } from '@/components/ThemeInitializer'
import { initAuth } from '@/store/slice/authSlice'

function AppInit() {
    const dispatch = useDispatch<AppDispatch>()
    useEffect(() => { dispatch(initAuth()) }, [dispatch])
    return null
}

const container = document.getElementById('app')
if (container) {
    ReactDOM.createRoot(container).render(
        <React.StrictMode>
            <Provider store={store}>
                <ThemeInitializer />
                <AppInit />
                <RouterProvider router={router} />
            </Provider>
        </React.StrictMode>
    )
}
