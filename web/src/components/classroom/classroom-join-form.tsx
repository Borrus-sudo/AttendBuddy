import { useState, type FormEvent } from "react"

import { Button } from "../ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Spinner } from "../ui/spinner"

type ClassroomJoinFormProps = {
    onJoin: (code: string) => Promise<void>
    isLoading: boolean
}

export function ClassroomJoinForm({ onJoin, isLoading }: ClassroomJoinFormProps) {
    const [code, setCode] = useState("")

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        await onJoin(code.trim().toUpperCase())
        setCode("")
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Join Classroom</CardTitle>
                <CardDescription>
                    Enter a 6-character class code shared by your instructor.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="join-code">Classroom Code</Label>
                        <Input
                            id="join-code"
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value.toUpperCase())
                            }}
                            placeholder="A1B2C3"
                            required
                            minLength={6}
                            maxLength={6}
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? <Spinner /> : null}
                        {isLoading ? "Joining..." : "Join Classroom"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
