import { HTTPError } from "h3";
import { and, eq, ne } from "drizzle-orm";
import { defineHandler } from "nitro";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const Params = z.object({
    id: z.string().min(1),
});

const OptionalQuery = z.object({
    classroomCode: z.string().min(1).optional(),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;

    const parsedParams = Params.safeParse(event.context.params);
    if (!parsedParams.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Session id is required.",
        });
    }

    const { id: attendanceSessionId } = parsedParams.data;

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

    const queryParsed = OptionalQuery.safeParse(event.context.query);

    const queryClassroomCode = queryParsed.success
        ? queryParsed.data.classroomCode
        : undefined;

    const classroomCode =
        typeof queryClassroomCode === "string" && queryClassroomCode.length > 0
            ? queryClassroomCode
            : attendanceSession.classroomCode;

    if (attendanceSession.classroomCode !== classroomCode) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Session does not belong to the requested classroom.",
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

    const membershipRows = await db
        .select()
        .from(schema.classroomMember)
        .where(
            and(
                eq(schema.classroomMember.classroomCode, classroomCode),
                eq(schema.classroomMember.userId, userId),
            ),
        );

    if (classroom.creatorId !== userId && membershipRows.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "You are not a member of this classroom.",
        });
    }

    const members = await db
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
                ne(schema.user.id, attendanceSession.createdByUserId),
            ),
        );

    const attendanceRecords = await db
        .select({
            userId: schema.attendanceRecord.userId,
            markedAt: schema.attendanceRecord.markedAt,
        })
        .from(schema.attendanceRecord)
        .where(
            eq(
                schema.attendanceRecord.attendanceSessionId,
                attendanceSessionId,
            ),
        );

    const attendanceByUser = new Map<string, Date>();
    for (const record of attendanceRecords) {
        attendanceByUser.set(record.userId, record.markedAt);
    }

    const role = attendanceSession.createdByUserId === userId ? "teacher" : "student";

    const membersWithStatus = members.map((member) => {
        const markedAt = attendanceByUser.get(member.id);
        return {
            userId: member.id,
            name: member.name,
            email: member.email,
            image: member.image,
            isPresent: !!markedAt,
            markedAt: markedAt ?? null,
        };
    });

    const responseMembers =
        role === "teacher"
            ? membersWithStatus
            : membersWithStatus.filter((member) => member.userId === userId);

    const presentCount = attendanceRecords.length;
    const totalCount = members.length;
    const hasExpired = attendanceSession.expiresAt.getTime() < Date.now();
    const currentUserRecord = attendanceByUser.get(userId);

    const status = currentUserRecord
        ? "present"
        : attendanceSession.isClosed || hasExpired
          ? "absent"
          : "unknown";

    return {
        success: true,
        payload: {
            session: {
                id: attendanceSession.id,
                classroomCode: attendanceSession.classroomCode,
                createdByUserId: attendanceSession.createdByUserId,
                token: attendanceSession.token,
                createdAt: attendanceSession.createdAt,
                expiresAt: attendanceSession.expiresAt,
                isClosed: attendanceSession.isClosed,
                presentCount,
                totalCount,
                status,
            },
            role,
            currentUserId: userId,
            members: responseMembers,
        },
    };
});
