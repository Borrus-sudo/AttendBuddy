import { and, desc, eq } from "drizzle-orm"
import { defineHandler } from "nitro"

import { classroom, classroomMember } from "@/db/schema"
import { db } from "@/src/lib/db.ts"

export default defineHandler(async (event) => {
    const rows = await db
        .select({
            code: classroom.code,
            name: classroom.name,
            description: classroom.description,
            creatorId: classroom.creatorId,
            isActive: classroom.isActive,
            joinedAt: classroomMember.joinedAt,
        })
        .from(classroomMember)
        .innerJoin(
            classroom,
            and(
                eq(classroomMember.classroomCode, classroom.code),
                eq(classroom.isActive, true),
            ),
        )
        .where(eq(classroomMember.userId, event.context.user.id))
        .orderBy(desc(classroomMember.joinedAt))

    const classrooms = rows.map((row) => ({
        ...row,
        role: row.creatorId === event.context.user.id ? "creator" : "member",
    }))

    return { classrooms }
})
