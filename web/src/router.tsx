import { createBrowserRouter } from "react-router-dom"

import { AuthRoute } from "./routes/auth-route"
import { DashboardRoute } from "./routes/dashboard-route"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AuthRoute />,
    },
    {
        path: "/app",
        element: <DashboardRoute />,
    },
])
