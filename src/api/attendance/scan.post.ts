import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";
import { defineHandler } from "nitro";

import {
    attendanceRecord,
    attendanceSession,
    classroomMember,
} from "@/db/schema";
import { db } from "@/src/lib/db.ts";

type ScanAttendanceBody = {
    token?: string;
};

export default defineHandler(async (event) => {
    const body = await readBody<ScanAttendanceBody>(event);
    const token = body?.token?.trim();

    if (!token || token.length < 16) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid attendance token is required",
        });
    }

    const sessionRow = await db
        .select({
            id: attendanceSession.id,
            classroomCode: attendanceSession.classroomCode,
            expiresAt: attendanceSession.expiresAt,
            isClosed: attendanceSession.isClosed,
        })
        .from(attendanceSession)
        .where(eq(attendanceSession.token, token))
        .limit(1);

    const attendanceSessionRecord = sessionRow[0];
    if (!attendanceSessionRecord) {
        throw HTTPError.status(404, "Not Found", {
            message: "Attendance session not found",
        });
    }

    if (attendanceSessionRecord.isClosed) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session is closed",
        });
    }

    if (attendanceSessionRecord.expiresAt.getTime() < Date.now()) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session has expired",
        });
    }

    const member = await db
        .select({ userId: classroomMember.userId })
        .from(classroomMember)
        .where(
            and(
                eq(
                    classroomMember.classroomCode,
                    attendanceSessionRecord.classroomCode,
                ),
                eq(classroomMember.userId, event.context.user.id),
            ),
        )
        .limit(1);

    if (!member[0]) {
        throw HTTPError.status(403, "Forbidden", {
            message: "You are not a member of this classroom",
        });
    }

    const existingRecord = await db
        .select({ id: attendanceRecord.id })
        .from(attendanceRecord)
        .where(
            and(
                eq(
                    attendanceRecord.attendanceSessionId,
                    attendanceSessionRecord.id,
                ),
                eq(attendanceRecord.userId, event.context.user.id),
            ),
        )
        .limit(1);

    if (existingRecord[0]) {
        return {
            marked: true,
            alreadyMarked: true,
            attendanceSessionId: attendanceSessionRecord.id,
            classroomCode: attendanceSessionRecord.classroomCode,
        };
    }

    await db.insert(attendanceRecord).values({
        id: crypto.randomUUID(),
        attendanceSessionId: attendanceSessionRecord.id,
        classroomCode: attendanceSessionRecord.classroomCode,
        userId: event.context.user.id,
        markMethod: "qr",
    });

    return {
        marked: true,
        alreadyMarked: false,
        attendanceSessionId: attendanceSessionRecord.id,
        classroomCode: attendanceSessionRecord.classroomCode,
    };
});
