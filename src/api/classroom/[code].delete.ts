import { HTTPError } from "h3"
import { eq } from "drizzle-orm"
import { defineHandler } from "nitro"

import { classroom } from "@/db/schema"
import { db } from "@/src/lib/db.ts"

export default defineHandler(async (event) => {
    const code = event.context.params?.code?.trim().toUpperCase()

    if (!code || code.length !== 6) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid 6 character classroom code is required",
        })
    }

    const existingClassroom = await db
        .select({
            code: classroom.code,
            creatorId: classroom.creatorId,
        })
        .from(classroom)
        .where(eq(classroom.code, code))
        .limit(1)

    const classroomRecord = existingClassroom[0]
    if (!classroomRecord) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found",
        })
    }

    if (classroomRecord.creatorId !== event.context.user.id) {
        throw HTTPError.status(403, "Forbidden", {
            message: "Only the classroom creator can delete this classroom",
        })
    }

    await db.delete(classroom).where(eq(classroom.code, code))

    return {
        deleted: true,
        code,
    }
})
