import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import { v4 as uuid } from "uuid";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Body = z.object({
    attendanceSessionId: z.string().min(1),
    studentUserId: z.string().min(1),
});

export default defineHandler(async (event) => {
    const { id: teacherUserId } = event.context.user;
    const payload = await readBody(event);
    const parsed = Body.safeParse(payload);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: parsed.error.message,
        });
    }

    const { attendanceSessionId, studentUserId } = parsed.data;

    const sessions = await db
        .select()
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.id, attendanceSessionId));

    if (sessions.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found.",
        });
    }

    const attendanceSession = sessions[0]!;

    if (attendanceSession.createdByUserId !== teacherUserId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only the session creator can manually mark attendance.",
        });
    }

    const studentMembership = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(
                    schema.classroomMember.classroomCode,
                    attendanceSession.classroomCode,
                ),
                eq(schema.classroomMember.userId, studentUserId),
            ),
        );

    if (studentMembership.length === 0) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Student is not a member of this classroom.",
        });
    }

    const attendanceRecordId = uuid();
    await db
        .insert(schema.attendanceRecord)
        .values({
            id: attendanceRecordId,
            attendanceSessionId: attendanceSession.id,
            classroomCode: attendanceSession.classroomCode,
            userId: studentUserId,
            markMethod: "teacher",
        })
        .onConflictDoNothing();

    return {
        success: true,
        payload: {
            message: "Attendance marked manually by teacher.",
            attendanceSessionId: attendanceSession.id,
            studentUserId,
        },
    };
});
