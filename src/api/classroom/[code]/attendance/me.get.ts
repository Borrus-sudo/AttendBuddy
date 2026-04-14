import { and, desc, eq, sql } from "drizzle-orm";
import { HTTPError } from "h3";
import { defineHandler } from "nitro";

import {
    attendanceRecord,
    attendanceSession,
    classroom,
    classroomMember,
} from "@/db/schema";
import { db } from "@/src/lib/db.ts";

export default defineHandler(async (event) => {
    const code = event.context.params?.code?.trim().toUpperCase();

    if (!code || code.length !== 6) {
        throw HTTPError.status(400, "Bad Request", {
            message: "A valid 6 character classroom code is required",
        });
    }

    const targetClassroom = await db
        .select({
            code: classroom.code,
            name: classroom.name,
            description: classroom.description,
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

    const member = await db
        .select({ userId: classroomMember.userId })
        .from(classroomMember)
        .where(
            and(
                eq(classroomMember.classroomCode, code),
                eq(classroomMember.userId, event.context.user.id),
            ),
        )
        .limit(1);

    if (!member[0]) {
        throw HTTPError.status(403, "Forbidden", {
            message: "You are not a member of this classroom",
        });
    }

    const totalSessionsRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceSession)
        .where(eq(attendanceSession.classroomCode, code));

    const attendedSessionsRow = await db
        .select({ count: sql<number>`count(*)` })
        .from(attendanceRecord)
        .where(
            and(
                eq(attendanceRecord.classroomCode, code),
                eq(attendanceRecord.userId, event.context.user.id),
            ),
        );

    const totalSessions = totalSessionsRow[0]?.count ?? 0;
    const attendedSessions = attendedSessionsRow[0]?.count ?? 0;
    const attendancePercentage =
        totalSessions > 0
            ? Number(((attendedSessions / totalSessions) * 100).toFixed(1))
            : 0;

    const historyRows = await db
        .select({
            attendanceSessionId: attendanceSession.id,
            sessionCreatedAt: attendanceSession.createdAt,
            sessionExpiresAt: attendanceSession.expiresAt,
            markedAt: attendanceRecord.markedAt,
        })
        .from(attendanceSession)
        .leftJoin(
            attendanceRecord,
            and(
                eq(attendanceRecord.attendanceSessionId, attendanceSession.id),
                eq(attendanceRecord.userId, event.context.user.id),
            ),
        )
        .where(eq(attendanceSession.classroomCode, code))
        .orderBy(desc(attendanceSession.createdAt))
        .limit(20);

    const history = historyRows.map((row) => ({
        attendanceSessionId: row.attendanceSessionId,
        sessionCreatedAt: row.sessionCreatedAt,
        sessionExpiresAt: row.sessionExpiresAt,
        markedAt: row.markedAt,
        status: row.markedAt ? "present" : "absent",
    }));

    return {
        classroom: classroomRecord,
        stats: {
            totalSessions,
            attendedSessions,
            attendancePercentage,
        },
        history,
    };
});
