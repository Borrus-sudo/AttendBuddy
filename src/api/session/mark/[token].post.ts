import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import { v4 as uuid } from "uuid";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Params = z.object({
    token: z.string().min(1),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;

    const parsed = Params.safeParse(event.context.params);
    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance token is not valid.",
        });
    }

    const { token } = parsed.data;

    const sessions = await db
        .select()
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.token, token));

    if (sessions.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found.",
        });
    }

    const attendanceSession = sessions[0]!;

    const classrooms = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, attendanceSession.classroomCode));

    if (classrooms.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found.",
        });
    }

    const classroom = classrooms[0]!;

    if (classroom.creatorId === userId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Teachers cannot mark attendance by scanning QR codes.",
        });
    }

    if (attendanceSession.isClosed) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session is already closed.",
        });
    }

    if (attendanceSession.expiresAt.getTime() < Date.now()) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session has expired.",
        });
    }

    const classroomMembers = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(
                    schema.classroomMember.classroomCode,
                    attendanceSession.classroomCode,
                ),
                eq(schema.classroomMember.userId, userId),
            ),
        );

    if (classroomMembers.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom students can mark attendance.",
        });
    }

    const attendanceRecordId = uuid();
    await db
        .insert(schema.attendanceRecord)
        .values({
            id: attendanceRecordId,
            attendanceSessionId: attendanceSession.id,
            classroomCode: attendanceSession.classroomCode,
            userId,
            markMethod: "student",
        })
        .onConflictDoNothing();

    return {
        success: true,
        payload: {
            message: "Attendance marked.",
            attendanceSessionId: attendanceSession.id,
        },
    };
});
