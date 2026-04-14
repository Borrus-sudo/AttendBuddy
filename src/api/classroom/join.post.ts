import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";

import { classroom, classroomMember } from "@/db/schema";
import { db } from "@/src/lib/db.ts";

type JoinClassroomBody = {
    code?: string;
};

export default defineHandler(async (event) => {
    const body = await readBody<JoinClassroomBody>(event);
    const code = body?.code?.trim().toUpperCase();

    if (!code || code.length !== 6) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid 6 character classroom code is required",
        });
    }

    const targetClassroom = await db
        .select({
            code: classroom.code,
            name: classroom.name,
            isActive: classroom.isActive,
        })
        .from(classroom)
        .where(eq(classroom.code, code))
        .limit(1);

    const classroomRecord = targetClassroom[0];
    if (!classroomRecord || !classroomRecord.isActive) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found",
        });
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
        .limit(1);

    if (existingMembership.length === 0) {
        await db.insert(classroomMember).values({
            classroomCode: code,
            userId: event.context.user.id,
        });
    }

    return {
        classroom: {
            code: classroomRecord.code,
            name: classroomRecord.name,
        },
        joined: existingMembership.length === 0,
    };
});
