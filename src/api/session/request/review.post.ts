import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import { v4 as uuid } from "uuid";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Body = z.object({
    requestId: z.string().min(1),
    action: z.enum(["approve", "reject"]),
    reviewNote: z.string().max(1000).optional(),
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

    const { requestId, action, reviewNote } = parsed.data;

    const requestRows = await db
        .select()
        .from(schema.attendanceRequest)
        .where(eq(schema.attendanceRequest.id, requestId));

    if (requestRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance request not found.",
        });
    }

    const attendanceRequest = requestRows[0]!;

    const classroomRows = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, attendanceRequest.classroomCode));

    if (classroomRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found.",
        });
    }

    const classroom = classroomRows[0]!;

    if (classroom.creatorId !== teacherUserId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom teachers can review attendance requests.",
        });
    }

    if (action === "approve") {
        const attendanceRows = await db
            .select()
            .from(schema.attendanceRecord)
            .where(
                and(
                    eq(
                        schema.attendanceRecord.attendanceSessionId,
                        attendanceRequest.attendanceSessionId,
                    ),
                    eq(
                        schema.attendanceRecord.userId,
                        attendanceRequest.studentUserId,
                    ),
                ),
            );

        if (attendanceRows.length === 0) {
            await db.insert(schema.attendanceRecord).values({
                id: uuid(),
                attendanceSessionId: attendanceRequest.attendanceSessionId,
                classroomCode: attendanceRequest.classroomCode,
                userId: attendanceRequest.studentUserId,
                markMethod: "teacher",
            });
        }
    }

    await db
        .update(schema.attendanceRequest)
        .set({
            status: action === "approve" ? "approved" : "rejected",
            reviewedByUserId: teacherUserId,
            reviewNote: reviewNote ?? null,
            reviewedAt: new Date(),
        })
        .where(eq(schema.attendanceRequest.id, requestId));

    return {
        success: true,
        payload: {
            message:
                action === "approve"
                    ? "Attendance request approved."
                    : "Attendance request rejected.",
        },
    };
});
