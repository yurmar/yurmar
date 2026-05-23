import React from "react"
import ReactDOM from "react-dom/client"
import { Provider } from "react-redux"
import { store } from "./store"
import { RouterProvider } from "react-router-dom"
import { router } from "./router"
import {ThemeInitializer} from "@/components/ThemeInitializer";

const container = document.getElementById("app")
if (container) {
    ReactDOM.createRoot(container).render(
        <React.StrictMode>
            <Provider store={store}>
                <ThemeInitializer />
                <RouterProvider router={router} />
            </Provider>
        </React.StrictMode>
    )
}