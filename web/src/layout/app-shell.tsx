import type { ReactNode } from "react"
import { LogOut } from "lucide-react"

import { Button } from "../components/ui/button"

type AppShellProps = {
    userName: string
    userEmail: string
    onSignOut: () => Promise<void>
    children: ReactNode
}

export function AppShell({
    userName,
    userEmail,
    onSignOut,
    children,
}: AppShellProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-10%] h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
                <div className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(20,184,166,0.16),transparent_35%)]" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
                <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200">
                            AttendBuddy
                        </p>
                        <h1 className="text-xl font-semibold text-white">
                            Classroom Attendance Hub
                        </h1>
                        <p className="text-sm text-slate-300">
                            {userName} ({userEmail})
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => {
                            void onSignOut()
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </Button>
                </header>

                {children}
            </div>
        </div>
    )
}
