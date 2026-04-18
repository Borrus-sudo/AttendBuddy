import { HTTPError } from "h3";
import { and, desc, eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Params = z.object({
    code: z.string().min(1),
    id: z.string().min(1),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;
    const parsed = Params.safeParse(event.context.params);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Invalid classroom or member id.",
        });
    }

    const { code: classroomCode, id: memberUserId } = parsed.data;

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

    if (classroom.creatorId !== userId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom teachers can access member analytics.",
        });
    }

    const memberRows = await db
        .select({
            id: schema.user.id,
            name: schema.user.name,
            email: schema.user.email,
            image: schema.user.image,
        })
        .from(schema.classroomMember)
        .innerJoin(
            schema.user,
            eq(schema.classroomMember.userId, schema.user.id),
        )
        .where(
            and(
                eq(schema.classroomMember.classroomCode, classroomCode),
                eq(schema.classroomMember.userId, memberUserId),
            ),
        );

    if (memberRows.length === 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom member not found.",
        });
    }

    const member = memberRows[0]!;

    const sessions = await db
        .select({
            id: schema.attendanceSession.id,
            createdAt: schema.attendanceSession.createdAt,
        })
        .from(schema.attendanceSession)
        .where(eq(schema.attendanceSession.classroomCode, classroomCode))
        .orderBy(desc(schema.attendanceSession.createdAt));

    const records = await db
        .select({
            attendanceSessionId: schema.attendanceRecord.attendanceSessionId,
        })
        .from(schema.attendanceRecord)
        .where(
            and(
                eq(schema.attendanceRecord.classroomCode, classroomCode),
                eq(schema.attendanceRecord.userId, memberUserId),
            ),
        );

    const presentSessionIds = new Set<string>();
    for (const record of records) {
        presentSessionIds.add(record.attendanceSessionId);
    }

    const totalSessions = sessions.length;
    const presentCount = presentSessionIds.size;
    const absentCount = Math.max(0, totalSessions - presentCount);
    const percentage =
        totalSessions > 0
            ? Math.round((presentCount / totalSessions) * 100)
            : 0;

    const recent = sessions.slice(0, 20).map((session) => ({
        sessionId: session.id,
        createdAt: session.createdAt,
        status: presentSessionIds.has(session.id) ? "present" : "absent",
    }));

    return {
        success: true,
        payload: {
            member,
            totalSessions,
            presentCount,
            absentCount,
            percentage,
            recent,
        },
    };
});
