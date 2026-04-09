import { HTTPError, readBody } from "h3"
import { and, eq } from "drizzle-orm"
import { defineHandler } from "nitro"

import { classroom, classroomMember } from "@/db/schema"
import { db } from "@/src/lib/db.ts"

type LeaveClassroomBody = {
    code?: string
}

export default defineHandler(async (event) => {
    const body = await readBody<LeaveClassroomBody>(event)
    const code = body?.code?.trim().toUpperCase()

    if (!code || code.length !== 6) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid 6 character classroom code is required",
        })
    }

    const targetClassroom = await db
        .select({
            code: classroom.code,
            creatorId: classroom.creatorId,
        })
        .from(classroom)
        .where(eq(classroom.code, code))
        .limit(1)

    const classroomRecord = targetClassroom[0]
    if (!classroomRecord) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found",
        })
    }

    if (classroomRecord.creatorId === event.context.user.id) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Creator cannot leave their own classroom",
        })
    }

    const existingMembership = await db
        .select({
            classroomCode: classroomMember.classroomCode,
        })
        .from(classroomMember)
        .where(
            and(
                eq(classroomMember.classroomCode, code),
                eq(classroomMember.userId, event.context.user.id),
            ),
        )
        .limit(1)

    if (!existingMembership[0]) {
        throw HTTPError.status(404, "Not Found", {
            message: "You are not a member of this classroom",
        })
    }

    await db
        .delete(classroomMember)
        .where(
            and(
                eq(classroomMember.classroomCode, code),
                eq(classroomMember.userId, event.context.user.id),
            ),
        )

    return {
        left: true,
        code,
    }
})
