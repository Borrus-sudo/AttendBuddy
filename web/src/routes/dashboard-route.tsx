import { AlertCircle } from "lucide-react"
import { Navigate } from "react-router-dom"

import { ClassroomCreateForm } from "../components/classroom/classroom-create-form"
import { ClassroomJoinForm } from "../components/classroom/classroom-join-form"
import { ClassroomList } from "../components/classroom/classroom-list"
import { Card, CardContent } from "../components/ui/card"
import { useToast } from "../components/ui/toaster"
import { AppShell } from "../layout/app-shell"
import { signOut, useSession } from "../lib/auth-client"
import { useClassrooms } from "../hooks/use-classrooms"

export function DashboardRoute() {
    const { data: session, isPending } = useSession()
    const { notify } = useToast()
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

    return (
        <AppShell
            userName={session.user.name}
            userEmail={session.user.email}
            onSignOut={async () => {
                await signOut()
            }}
        >
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                    <ClassroomCreateForm
                        onCreate={handleCreate}
                        isLoading={isSubmitting || isLoading}
                    />
                    <ClassroomJoinForm
                        onJoin={handleJoin}
                        isLoading={isSubmitting || isLoading}
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

                    <ClassroomList
                        classrooms={classrooms}
                        onLeave={handleLeave}
                        onDelete={handleDelete}
                        loadingCode={activeCode}
                    />
                </div>
            </div>
        </AppShell>
    )
}
