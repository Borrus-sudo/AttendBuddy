import { CheckCircle2, Clock3, Percent } from "lucide-react"

import type { MyAttendanceSummary } from "../../types/classroom"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

type MemberAttendancePanelProps = {
    data: MyAttendanceSummary | null
    loading: boolean
}

export function MemberAttendancePanel({
    data,
    loading,
}: MemberAttendancePanelProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Attendance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                    Loading your attendance stats...
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>My Attendance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                    Select a joined classroom to view your attendance details.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <Clock3 className="h-3.5 w-3.5" /> Total Sessions
                        </p>
                        <p className="text-xl font-semibold text-slate-100">
                            {data.stats.totalSessions}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Present
                        </p>
                        <p className="text-xl font-semibold text-slate-100">
                            {data.stats.attendedSessions}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <Percent className="h-3.5 w-3.5" /> Attendance
                        </p>
                        <p className="text-xl font-semibold text-cyan-100">
                            {data.stats.attendancePercentage}%
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {data.history.map((entry) => (
                        <div
                            key={entry.attendanceSessionId}
                            className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#0f131f] px-3 py-2"
                        >
                            <div>
                                <p className="text-sm font-medium text-slate-100">
                                    Session on{" "}
                                    {new Date(entry.sessionCreatedAt).toLocaleString(
                                        "en-IN",
                                    )}
                                </p>
                                <p className="text-xs text-slate-400">
                                    Closed by {new Date(entry.sessionExpiresAt).toLocaleTimeString("en-IN")}
                                </p>
                            </div>
                            <span
                                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                                    entry.status === "present"
                                        ? "bg-emerald-500/20 text-emerald-100"
                                        : "bg-rose-500/20 text-rose-100"
                                }`}
                            >
                                {entry.status === "present" ? "Present" : "Absent"}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
