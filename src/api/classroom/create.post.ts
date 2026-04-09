import { HTTPError, readBody } from "h3"
import { eq } from "drizzle-orm"
import { defineHandler } from "nitro"

import { classroom, classroomMember } from "@/db/schema"
import { db } from "@/src/lib/db.ts"

type CreateClassroomBody = {
    name?: string
    description?: string
}

const classroomCodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateClassroomCode(): string {
    return Array.from({ length: 6 }, () => {
        const randomIndex = Math.floor(Math.random() * classroomCodeChars.length)
        return classroomCodeChars[randomIndex] ?? "A"
    }).join("")
}

export default defineHandler(async (event) => {
    const body = await readBody<CreateClassroomBody>(event)
    const name = body?.name?.trim()
    const description = body?.description?.trim()

    if (!name) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom name is required",
        })
    }

    if (name.length > 120) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom name must be 120 characters or fewer",
        })
    }

    if (description && description.length > 1000) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Description must be 1000 characters or fewer",
        })
    }

    let code = ""

    for (let attempt = 0; attempt < 12; attempt += 1) {
        const generatedCode = generateClassroomCode()
        const existing = await db
            .select({ code: classroom.code })
            .from(classroom)
            .where(eq(classroom.code, generatedCode))
            .limit(1)

        if (existing.length > 0) {
            continue
        }

        await db.insert(classroom).values({
            code: generatedCode,
            creatorId: event.context.user.id,
            name,
            description: description || null,
        })

        await db.insert(classroomMember).values({
            classroomCode: generatedCode,
            userId: event.context.user.id,
        })

        code = generatedCode
        break
    }

    if (!code) {
        throw HTTPError.status(500, "Internal Server Error", {
            message: "Could not generate a unique classroom code",
        })
    }

    return {
        classroom: {
            code,
            name,
            description: description || null,
            creatorId: event.context.user.id,
        },
    }
})
