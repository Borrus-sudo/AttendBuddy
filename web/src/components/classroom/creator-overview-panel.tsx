import { BookUser, CalendarRange, Users } from "lucide-react"

import type { AttendanceOverview } from "../../types/classroom"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

type CreatorOverviewPanelProps = {
    data: AttendanceOverview | null
    loading: boolean
}

export function CreatorOverviewPanel({
    data,
    loading,
}: CreatorOverviewPanelProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Class Roster & Attendance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                    Loading class analytics...
                </CardContent>
            </Card>
        )
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Class Roster & Attendance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-300">
                    Select a classroom you created to view student attendance.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Class Roster & Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <Users className="h-3.5 w-3.5" /> Members
                        </p>
                        <p className="text-xl font-semibold text-slate-100">
                            {data.stats.memberCount}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <CalendarRange className="h-3.5 w-3.5" /> Sessions
                        </p>
                        <p className="text-xl font-semibold text-slate-100">
                            {data.stats.totalSessions}
                        </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-[0.12em] text-slate-400">
                            <BookUser className="h-3.5 w-3.5" /> Marks
                        </p>
                        <p className="text-xl font-semibold text-slate-100">
                            {data.stats.totalAttendanceMarks}
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800">
                    <table className="w-full border-collapse text-sm">
                        <thead className="bg-[#121827] text-left text-slate-300">
                            <tr>
                                <th className="px-3 py-2 font-medium">Student</th>
                                <th className="px-3 py-2 font-medium">Joined</th>
                                <th className="px-3 py-2 font-medium">Present</th>
                                <th className="px-3 py-2 font-medium">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.map((student) => (
                                <tr
                                    key={student.userId}
                                    className="border-t border-slate-800 bg-[#0f131f]"
                                >
                                    <td className="px-3 py-2">
                                        <p className="font-medium text-slate-100">
                                            {student.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {student.email}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2 text-slate-300">
                                        {new Date(student.joinedAt).toLocaleDateString(
                                            "en-IN",
                                        )}
                                    </td>
                                    <td className="px-3 py-2 text-slate-100">
                                        {student.attendanceMarkedCount}
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className="rounded-md bg-cyan-500/15 px-2 py-1 text-xs font-semibold text-cyan-100">
                                            {student.attendancePercentage}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
