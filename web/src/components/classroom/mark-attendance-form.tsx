import { useState, type FormEvent } from "react"
import { CheckCheck, KeyRound } from "lucide-react"

import { markAttendanceByToken } from "../../lib/api"
import type { Classroom } from "../../types/classroom"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Spinner } from "../ui/spinner"
import { useToast } from "../ui/toaster"

type MarkAttendanceFormProps = {
    classroom: Classroom | null
    onMarked: (result: { alreadyMarked: boolean }) => void
}

export function MarkAttendanceForm({
    classroom,
    onMarked,
}: MarkAttendanceFormProps) {
    const { notify } = useToast()
    const [token, setToken] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!classroom || classroom.role === "creator") {
        return null
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)

        try {
            const result = await markAttendanceByToken(token.trim())
            onMarked({ alreadyMarked: result.alreadyMarked })
            setToken("")
        } catch (err) {
            notify({
                variant: "error",
                title: "Could not mark attendance",
                message: err instanceof Error ? err.message : "Please try again.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCheck className="h-5 w-5 text-emerald-300" />
                    Mark Attendance (Student)
                </CardTitle>
                <CardDescription>
                    Enter the attendance token shown by your teacher QR to mark
                    attendance for this classroom.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="attendance-token">Attendance Token</Label>
                        <Input
                            id="attendance-token"
                            value={token}
                            onChange={(event) => {
                                setToken(event.target.value)
                            }}
                            placeholder="Paste token from QR scanner"
                            minLength={16}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner /> : <KeyRound className="h-4 w-4" />}
                        {isSubmitting ? "Marking..." : "Mark Attendance"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
