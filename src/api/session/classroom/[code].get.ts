import { HTTPError } from "h3";
import { and, desc, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Params = z.object({
    code: z.string().min(1),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;
    const parsed = Params.safeParse(event.context.params);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom code is required.",
        });
    }

    const { code: classroomCode } = parsed.data;

    const classrooms = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, classroomCode));

    if (classrooms.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found.",
        });
    }

    const classroom = classrooms[0]!;

    const memberships = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(schema.classroomMember.classroomCode, classroomCode),
                eq(schema.classroomMember.userId, userId),
            ),
        );

    if (classroom.creatorId !== userId && memberships.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "You are not a member of this classroom.",
        });
    }

    const members = await db
        .select({ userId: schema.classroomMember.userId })
        .from(schema.classroomMember)
        .where(eq(schema.classroomMember.classroomCode, classroomCode));

    const memberCount = members.length;

    const sessions = await db
        .select()
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.classroomCode, classroomCode))
        .orderBy(desc(schema.attendanceSession.createdAt));

    const records = await db
        .select({
            attendanceSessionId: schema.attendanceRecord.attendanceSessionId,
            userId: schema.attendanceRecord.userId,
        })
        .from(schema.attendanceRecord)
        .where(eq(schema.attendanceRecord.classroomCode, classroomCode));

    const presentCountBySession = new Map<string, number>();
    const presentByCurrentUserSession = new Set<string>();

    for (const record of records) {
        const key = record.attendanceSessionId;
        presentCountBySession.set(
            key,
            (presentCountBySession.get(key) ?? 0) + 1,
        );

        if (record.userId === userId) {
            presentByCurrentUserSession.add(key);
        }
    }

    const now = Date.now();

    return {
        success: true,
        payload: {
            sessions: sessions.map((session) => {
                const presentCount = presentCountBySession.get(session.id) ?? 0;
                const currentUserPresent = presentByCurrentUserSession.has(
                    session.id,
                );
                const hasExpired = session.expiresAt.getTime() < now;

                const status = currentUserPresent
                    ? "present"
                    : session.isClosed || hasExpired
                      ? "absent"
                      : "unknown";

                return {
                    id: session.id,
                    classroomCode: session.classroomCode,
                    token: session.token,
                    createdByUserId: session.createdByUserId,
                    createdAt: session.createdAt,
                    expiresAt: session.expiresAt,
                    isClosed: session.isClosed,
                    presentCount,
                    totalCount: memberCount,
                    status,
                };
            }),
        },
    };
});
