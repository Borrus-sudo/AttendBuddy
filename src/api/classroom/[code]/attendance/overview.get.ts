import { and, desc, eq, sql } from "drizzle-orm";
import { HTTPError } from "h3";
import { defineHandler } from "nitro";

import {
    attendanceRecord,
    attendanceSession,
    classroom,
    classroomMember,
    user,
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
            createdAt: classroom.createdAt,
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
            message: "Only classroom creators can view this overview",
        });
    }

    const memberRows = await db
        .select({
            userId: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            joinedAt: classroomMember.joinedAt,
        })
        .from(classroomMember)
        .innerJoin(user, eq(classroomMember.userId, user.id))
        .where(eq(classroomMember.classroomCode, code))
        .orderBy(user.name);

    const attendanceTotals = await db
        .select({
            userId: attendanceRecord.userId,
            marksCount: sql<number>`count(*)`,
        })
        .from(attendanceRecord)
        .where(eq(attendanceRecord.classroomCode, code))
        .groupBy(attendanceRecord.userId);

    const totalSessionsRow = await db
        .select({
            count: sql<number>`count(*)`,
        })
        .from(attendanceSession)
        .where(eq(attendanceSession.classroomCode, code));

    const totalSessions = totalSessionsRow[0]?.count ?? 0;
    const attendanceByUserId = new Map(
        attendanceTotals.map((row) => [row.userId, row.marksCount]),
    );

    const studentRows = memberRows.filter(
        (member) => member.userId !== classroomRecord.creatorId,
    );

    const students = studentRows.map((member) => {
        const attendanceMarkedCount =
            attendanceByUserId.get(member.userId) ?? 0;
        const attendancePercentage =
            totalSessions > 0
                ? Number(
                      ((attendanceMarkedCount / totalSessions) * 100).toFixed(
                          1,
                      ),
                  )
                : 0;

        return {
            ...member,
            attendanceMarkedCount,
            attendancePercentage,
        };
    });

    const recentSessions = await db
        .select({
            id: attendanceSession.id,
            createdAt: attendanceSession.createdAt,
            expiresAt: attendanceSession.expiresAt,
            isClosed: attendanceSession.isClosed,
        })
        .from(attendanceSession)
        .where(eq(attendanceSession.classroomCode, code))
        .orderBy(desc(attendanceSession.createdAt))
        .limit(15);

    const totalAttendanceMarks = students.reduce(
        (sum, student) => sum + student.attendanceMarkedCount,
        0,
    );

    return {
        classroom: classroomRecord,
        stats: {
            memberCount: students.length,
            totalSessions,
            totalAttendanceMarks,
        },
        students,
        recentSessions,
    };
});
