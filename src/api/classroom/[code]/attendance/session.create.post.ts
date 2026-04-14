import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";

import { attendanceSession, classroom, classroomMember } from "@/db/schema";
import { db } from "@/src/lib/db.ts";

type CreateAttendanceSessionBody = {
    durationMinutes?: number;
};

export default defineHandler(async (event) => {
    const code = event.context.params?.code?.trim().toUpperCase();
    const body = await readBody<CreateAttendanceSessionBody>(event);

    if (!code || code.length !== 6) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid 6 character classroom code is required",
        });
    }

    const durationMinutes = body?.durationMinutes ?? 10;
    if (durationMinutes < 1 || durationMinutes > 180) {
        throw HTTPError.status(400, "Bad Request", {
            message: "durationMinutes must be between 1 and 180",
        });
    }

    const targetClassroom = await db
        .select({
            code: classroom.code,
            creatorId: classroom.creatorId,
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

    if (classroomRecord.creatorId !== event.context.user.id) {
        throw HTTPError.status(403, "Forbidden", {
            message: "Only the classroom creator can start attendance",
        });
    }

    const creatorMembership = await db
        .select({ userId: classroomMember.userId })
        .from(classroomMember)
        .where(
            and(
                eq(classroomMember.classroomCode, code),
                eq(classroomMember.userId, event.context.user.id),
            ),
        )
        .limit(1);

    if (!creatorMembership[0]) {
        await db.insert(classroomMember).values({
            classroomCode: code,
            userId: event.context.user.id,
        });
    }

    const now = Date.now();
    const expiresAt = new Date(now + durationMinutes * 60_000);
    const sessionId = crypto.randomUUID();
    const token = crypto.randomUUID().replaceAll("-", "");

    await db.insert(attendanceSession).values({
        id: sessionId,
        classroomCode: code,
        createdByUserId: event.context.user.id,
        token,
        expiresAt,
    });

    return {
        attendanceSession: {
            id: sessionId,
            classroomCode: code,
            token,
            durationMinutes,
            expiresAt,
        },
        qrPayload: {
            token,
            classroomCode: code,
            endpoint: "/api/attendance/scan",
        },
    };
});
