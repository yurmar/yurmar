import { createBrowserRouter } from "react-router-dom"
import Layout from "../components/layout/Layout"
import Home from "../pages/home"
import Notebook from "../pages/notebook"
import NotFound from "../pages/not-found"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <Home /> },
            { path: "notebook", element: <Notebook /> },
            { path: "*", element: <NotFound /> },
        ],
    },
])
