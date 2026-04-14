import type { ReactNode } from "react";
import { BookMarked, LogOut, Plus, UserPlus } from "lucide-react";

import { Button } from "../components/ui/button";

type AppShellProps = {
    userName: string;
    userEmail: string;
    onSignOut: () => Promise<void>;
    onOpenCreate: () => void;
    onOpenJoin: () => void;
    children: ReactNode;
};

export function AppShell({
    userName,
    userEmail,
    onSignOut,
    onOpenCreate,
    onOpenJoin,
    children,
}: AppShellProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,78,59,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(7,89,133,0.14),transparent_35%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,rgba(148,163,184,0.04)_24px),linear-gradient(90deg,transparent_23px,rgba(148,163,184,0.04)_24px)] bg-[size:24px_24px] opacity-25" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8">
                <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-[#0a0c14] p-4 shadow-[0_18px_48px_-20px_rgba(2,6,23,0.95)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <BookMarked className="h-4 w-4 text-emerald-300" />
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
                                AttendBuddy
                            </p>
                        </div>
                        <h1 className="text-xl font-semibold text-white sm:text-2xl">
                            College Attendance Console
                        </h1>
                        <p className="text-sm text-slate-400/90">
                            {userName} ({userEmail})
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" onClick={onOpenCreate}>
                            <Plus className="h-4 w-4" />
                            Create Classroom
                        </Button>
                        <Button variant="outline" onClick={onOpenJoin}>
                            <UserPlus className="h-4 w-4" />
                            Join Classroom
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                void onSignOut();
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </Button>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-800 bg-[#080a10] shadow-[0_24px_56px_-30px_rgba(2,6,23,1)] backdrop-blur">
                    {children}
                </section>
            </div>
        </div>
    );
}
