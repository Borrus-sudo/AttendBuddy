import { AlertCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { Navigate } from "react-router-dom"

import { AttendancePanel } from "../components/classroom/attendance-panel"
import { ClassroomCreateForm } from "../components/classroom/classroom-create-form"
import { ClassroomFocusCard } from "../components/classroom/classroom-focus-card"
import { ClassroomJoinForm } from "../components/classroom/classroom-join-form"
import { MarkAttendanceForm } from "../components/classroom/mark-attendance-form"
import { CreatorOverviewPanel } from "../components/classroom/creator-overview-panel"
import { ClassroomSidebar } from "../components/classroom/classroom-sidebar"
import { MemberAttendancePanel } from "../components/classroom/member-attendance-panel"
import { Card, CardContent } from "../components/ui/card"
import { Dialog } from "../components/ui/dialog"
import { useToast } from "../components/ui/toaster"
import { useAttendance } from "../hooks/use-attendance"
import { useClassroomAnalytics } from "../hooks/use-classroom-analytics"
import { AppShell } from "../layout/app-shell"
import { signOut, useSession } from "../lib/auth-client"
import { useClassrooms } from "../hooks/use-classrooms"

export function DashboardRoute() {
    const { data: session, isPending } = useSession()
    const { notify } = useToast()
    const [selectedCode, setSelectedCode] = useState<string | null>(null)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [joinDialogOpen, setJoinDialogOpen] = useState(false)
    const {
        classrooms,
        isLoading,
        isSubmitting,
        activeCode,
        error,
        create,
        join,
        leave,
        remove,
    } = useClassrooms(Boolean(session))
    const {
        activeSession,
        loading: attendanceLoading,
        error: attendanceError,
        startSession,
        closeSession,
        clearSession,
    } = useAttendance()

    const selectedClassroom = useMemo(() => {
        if (!selectedCode && classrooms.length > 0) {
            return classrooms[0] || null
        }
        return classrooms.find((item) => item.code === selectedCode) || null
    }, [classrooms, selectedCode])

    const activeSessionMatchesSelection =
        activeSession && selectedClassroom
            ? activeSession.classroomCode === selectedClassroom.code
            : false

    const {
        loading: analyticsLoading,
        error: analyticsError,
        creatorOverview,
        myAttendance,
        refresh: refreshAnalytics,
    } = useClassroomAnalytics({
        classroomCode: selectedClassroom?.code || null,
        role: selectedClassroom?.role || null,
    })

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
                <p className="text-sm text-slate-300">Loading your workspace...</p>
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/" replace />
    }

    async function handleCreate(input: { name: string; description: string }) {
        try {
            await create(input)
            await refreshAnalytics()
            setCreateDialogOpen(false)
            notify({
                variant: "success",
                title: "Classroom created",
                message: `Created ${input.name} successfully.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not create classroom",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleJoin(code: string) {
        try {
            await join(code)
            setSelectedCode(code)
            await refreshAnalytics()
            setJoinDialogOpen(false)
            notify({
                variant: "success",
                title: "Joined classroom",
                message: `You joined classroom ${code}.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not join classroom",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleLeave(code: string) {
        try {
            await leave(code)
            await refreshAnalytics()
            notify({
                variant: "success",
                title: "Left classroom",
                message: `You left classroom ${code}.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not leave classroom",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleDelete(code: string) {
        try {
            await remove(code)
            if (selectedCode === code) {
                setSelectedCode(null)
                clearSession()
            }
            await refreshAnalytics()
            notify({
                variant: "success",
                title: "Classroom deleted",
                message: `Deleted classroom ${code}.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not delete classroom",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleStartAttendance(args: {
        classroomCode: string
        durationMinutes: number
    }) {
        try {
            await startSession(args)
            await refreshAnalytics()
            notify({
                variant: "success",
                title: "Attendance QR generated",
                message: `Session started for ${args.classroomCode}.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not start attendance",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleCloseAttendance(args: {
        classroomCode: string
        attendanceSessionId: string
    }) {
        try {
            await closeSession(args)
            await refreshAnalytics()
            notify({
                variant: "success",
                title: "Attendance session closed",
                message: `Session for ${args.classroomCode} closed successfully.`,
            })
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not close attendance",
                message:
                    err instanceof Error ? err.message : "Please try again.",
            })
        }
    }

    async function handleMarkAttendance(result: { alreadyMarked: boolean }) {
        await refreshAnalytics()

        if (result.alreadyMarked) {
            notify({
                variant: "success",
                title: "Attendance already marked",
                message: "You were already marked present for this session.",
            })
            return
        }

        notify({
            variant: "success",
            title: "Attendance marked",
            message: "You have been marked present successfully.",
        })
    }

    return (
        <>
            <AppShell
                userName={session.user.name}
                userEmail={session.user.email}
                onOpenCreate={() => {
                    setCreateDialogOpen(true)
                }}
                onOpenJoin={() => {
                    setJoinDialogOpen(true)
                }}
                onSignOut={async () => {
                    await signOut()
                }}
            >
                <div className="flex min-h-[calc(100vh-210px)] flex-col lg:flex-row">
                <ClassroomSidebar
                    classrooms={classrooms}
                    selectedCode={selectedClassroom?.code || null}
                    onSelect={(code) => {
                        setSelectedCode(code)
                        if (activeSession && activeSession.classroomCode !== code) {
                            clearSession()
                        }
                    }}
                />

                <div className="flex-1 p-4 lg:p-6">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
                        <div className="space-y-6">
                            <ClassroomFocusCard
                                classroom={selectedClassroom}
                                loadingCode={activeCode}
                                onLeave={handleLeave}
                                onDelete={handleDelete}
                            />
                        </div>

                        <div className="space-y-6">
                            {error ? (
                                <Card className="border-red-400/40 bg-red-950/20">
                                    <CardContent className="flex items-center gap-2 text-sm text-red-100">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </CardContent>
                                </Card>
                            ) : null}

                            {attendanceError ? (
                                <Card className="border-red-400/40 bg-red-950/20">
                                    <CardContent className="flex items-center gap-2 text-sm text-red-100">
                                        <AlertCircle className="h-4 w-4" />
                                        {attendanceError}
                                    </CardContent>
                                </Card>
                            ) : null}

                            {analyticsError ? (
                                <Card className="border-red-400/40 bg-red-950/20">
                                    <CardContent className="flex items-center gap-2 text-sm text-red-100">
                                        <AlertCircle className="h-4 w-4" />
                                        {analyticsError}
                                    </CardContent>
                                </Card>
                            ) : null}

                            <AttendancePanel
                                classroom={selectedClassroom}
                                activeSession={
                                    activeSessionMatchesSelection
                                        ? activeSession
                                    : null
                                }
                                onStartSession={handleStartAttendance}
                                onCloseSession={handleCloseAttendance}
                                loading={attendanceLoading}
                            />

                            <MarkAttendanceForm
                                classroom={selectedClassroom}
                                onMarked={handleMarkAttendance}
                            />

                            {selectedClassroom?.role === "creator" ? (
                                <CreatorOverviewPanel
                                    data={creatorOverview}
                                    loading={analyticsLoading}
                                />
                            ) : (
                                <MemberAttendancePanel
                                    data={myAttendance}
                                    loading={analyticsLoading}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </AppShell>

            <Dialog
                open={createDialogOpen}
                title="Create Classroom"
                description="Set up a new attendance classroom and share its code with students."
                onClose={() => {
                    setCreateDialogOpen(false)
                }}
            >
                <ClassroomCreateForm
                    onCreate={handleCreate}
                    isLoading={isSubmitting || isLoading}
                />
            </Dialog>

            <Dialog
                open={joinDialogOpen}
                title="Join Classroom"
                description="Enter the 6-character classroom code provided by your instructor."
                onClose={() => {
                    setJoinDialogOpen(false)
                }}
            >
                <ClassroomJoinForm
                    onJoin={handleJoin}
                    isLoading={isSubmitting || isLoading}
                />
            </Dialog>
        </>
    )
}
