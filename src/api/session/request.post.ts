import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import { v4 as uuid } from "uuid";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Body = z.object({
    attendanceSessionId: z.string().min(1),
    classroomCode: z.string().min(1),
    message: z.string().min(5).max(1000),
});

export default defineHandler(async (event) => {
    const { id: studentUserId } = event.context.user;

    const payload = await readBody(event);
    const parsed = Body.safeParse(payload);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: parsed.error.message,
        });
    }

    const { attendanceSessionId, classroomCode, message } = parsed.data;

    const sessionRows = await db
        .select()
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.id, attendanceSessionId));

    if (sessionRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found.",
        });
    }

    const attendanceSession = sessionRows[0]!;

    if (attendanceSession.classroomCode !== classroomCode) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Session does not belong to the classroom.",
        });
    }

    const classroomRows = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, classroomCode));

    if (classroomRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found.",
        });
    }

    const classroom = classroomRows[0]!;
    if (classroom.creatorId === studentUserId) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Teachers cannot request attendance for themselves.",
        });
    }

    const membershipRows = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(schema.classroomMember.classroomCode, classroomCode),
                eq(schema.classroomMember.userId, studentUserId),
            ),
        );

    if (membershipRows.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom students can submit attendance requests.",
        });
    }

    const existingAttendanceRows = await db
        .select()
        .from(schema.attendanceRecord)
        .where(
            and(
                eq(
                    schema.attendanceRecord.attendanceSessionId,
                    attendanceSessionId,
                ),
                eq(schema.attendanceRecord.userId, studentUserId),
            ),
        );

    if (existingAttendanceRows.length > 0) {
        throw HTTPError.status(400, "Bad Request", {
            message: "You are already marked present for this session.",
        });
    }

    const existingRequestRows = await db
        .select()
        .from(schema.attendanceRequest)
        .where(
            and(
                eq(
                    schema.attendanceRequest.attendanceSessionId,
                    attendanceSessionId,
                ),
                eq(schema.attendanceRequest.studentUserId, studentUserId),
            ),
        );

    if (existingRequestRows.length > 0) {
        const existing = existingRequestRows[0]!;
        await db
            .update(schema.attendanceRequest)
            .set({
                message,
                status: "pending",
                reviewedByUserId: null,
                reviewNote: null,
                reviewedAt: null,
            })
            .where(eq(schema.attendanceRequest.id, existing.id));
    } else {
        await db.insert(schema.attendanceRequest).values({
            id: uuid(),
            attendanceSessionId,
            classroomCode,
            studentUserId,
            message,
            status: "pending",
        });
    }

    return {
        success: true,
        payload: {
            message: "Attendance request submitted.",
        },
    };
});
