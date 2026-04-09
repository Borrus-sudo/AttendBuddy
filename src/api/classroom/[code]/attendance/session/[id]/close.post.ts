import { HTTPError } from "h3"
import { and, eq } from "drizzle-orm"
import { defineHandler } from "nitro"

import { attendanceSession, classroom } from "@/db/schema"
import { db } from "@/src/lib/db.ts"

export default defineHandler(async (event) => {
    const classroomCode = event.context.params?.code?.trim().toUpperCase()
    const sessionId = event.context.params?.id?.trim()

    if (!classroomCode || classroomCode.length !== 6 || !sessionId) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Valid classroom code and session id are required",
        })
    }

    const targetClassroom = await db
        .select({ creatorId: classroom.creatorId, code: classroom.code })
        .from(classroom)
        .where(eq(classroom.code, classroomCode))
        .limit(1)

    const classroomRecord = targetClassroom[0]
    if (!classroomRecord) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found",
        })
    }

    if (classroomRecord.creatorId !== event.context.user.id) {
        throw HTTPError.status(403, "Forbidden", {
            message: "Only the classroom creator can close attendance",
        })
    }

    const targetSession = await db
        .select({ id: attendanceSession.id })
        .from(attendanceSession)
        .where(
            and(
                eq(attendanceSession.id, sessionId),
                eq(attendanceSession.classroomCode, classroomCode),
            ),
        )
        .limit(1)

    if (!targetSession[0]) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found",
        })
    }

    await db
        .update(attendanceSession)
        .set({ isClosed: true })
        .where(eq(attendanceSession.id, sessionId))

    return {
        closed: true,
        attendanceSessionId: sessionId,
        classroomCode,
    }
})
