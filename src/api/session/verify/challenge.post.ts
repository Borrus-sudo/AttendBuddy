import { HTTPError, readBody } from "h3";
import { and, eq, isNull } from "drizzle-orm";
import { defineHandler } from "nitro";
import { randomUUID } from "node:crypto";
import * as z from "zod";

import { hashVerificationToken } from "@/src/lib/attendance-verify";
import { db, schema } from "@/src/lib/db";

const Body = z.object({
    attendanceCode: z.string().min(1),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;
    const payload = await readBody(event);
    const parsed = Body.safeParse(payload);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: parsed.error.message,
        });
    }

    const { attendanceCode } = parsed.data;

    const sessionRows = await db
        .select()
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.token, attendanceCode));

    if (sessionRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found.",
        });
    }

    const attendanceSession = sessionRows[0]!;

    const classroomRows = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, attendanceSession.classroomCode));

    if (classroomRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found.",
        });
    }

    const classroom = classroomRows[0]!;
    if (classroom.creatorId === userId) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Teachers cannot verify attendance as students.",
        });
    }

    const membershipRows = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(schema.classroomMember.classroomCode, classroom.code),
                eq(schema.classroomMember.userId, userId),
            ),
        );

    if (membershipRows.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom students can verify attendance.",
        });
    }

    await db
        .delete(schema.attendanceVerificationChallenge)
        .where(
            and(
                eq(schema.attendanceVerificationChallenge.userId, userId),
                isNull(schema.attendanceVerificationChallenge.usedAt),
            ),
        );

    const challengeId = randomUUID();
    const challengeToken = randomUUID();
    const tokenHash = hashVerificationToken(challengeToken);
    const expiresAt = new Date(Date.now() + 60_000);

    await db.insert(schema.attendanceVerificationChallenge).values({
        id: challengeId,
        attendanceSessionId: attendanceSession.id,
        classroomCode: attendanceSession.classroomCode,
        userId,
        tokenHash,
        expiresAt,
    });

    return {
        success: true,
        payload: {
            challengeId,
            challengeToken,
            expiresAt,
        },
    };
});
