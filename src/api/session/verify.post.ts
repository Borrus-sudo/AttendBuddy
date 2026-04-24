import { HTTPError, readBody } from "h3";
import { and, eq, gte, isNull } from "drizzle-orm";
import { defineHandler } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";
import { randomUUID } from "node:crypto";
import * as z from "zod";
import { verifySelfieAgainstReference } from "@/src/lib/attendance-verify";
import { db, schema } from "@/src/lib/db";
import { verifyLocationCoordinates } from "@/src/lib/location";

const Body = z.object({
    attendanceCode: z.string().min(1),
    selfieBase64: z.string().min(100),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export default defineHandler(async (event) => {
    const runtimeConfig = useRuntimeConfig();
    const { id: userId } = event.context.user;

    const payload = await readBody(event);
    const parsed = Body.safeParse(payload);

    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: parsed.error.message,
        });
    }

    const { attendanceCode, selfieBase64, latitude, longitude } = parsed.data;

    const locationCheck = verifyLocationCoordinates(latitude, longitude);
    if (!locationCheck.isValid) {
        throw HTTPError.status(400, "Bad Request", {
            message: locationCheck.message,
        });
    }

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

    if (attendanceSession.isClosed) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session is already closed.",
        });
    }

    if (attendanceSession.expiresAt.getTime() < Date.now()) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Attendance session has expired.",
        });
    }

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
                eq(
                    schema.classroomMember.classroomCode,
                    attendanceSession.classroomCode,
                ),
                eq(schema.classroomMember.userId, userId),
            ),
        );

    if (membershipRows.length === 0) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Only classroom students can verify attendance.",
        });
    }

    const userRows = await db
        .select({ image: schema.user.image })
        .from(schema.user)
        .where(eq(schema.user.id, userId));

    const userImage = userRows[0]?.image ?? null;

    const verification = await verifySelfieAgainstReference({
        selfieBase64,
        referenceImageUrl: userImage,
        minScore: Number(runtimeConfig.faceVerificationMinScore || "0.75"),
    });

    await db.insert(schema.attendanceVerificationAttempt).values({
        id: randomUUID(),
        attendanceSessionId: attendanceSession.id,
        classroomCode: attendanceSession.classroomCode,
        userId,
        isSuccess: verification.ok,
        confidence: Math.round(verification.confidence * 100),
        failureReason: verification.reason ?? null,
    });

    if (!verification.ok) {
        throw HTTPError.status(400, "Bad Request", {
            message:
                verification.reason ||
                "Face verification failed. Please try again.",
        });
    }

    await db
        .insert(schema.attendanceRecord)
        .values({
            id: randomUUID(),
            attendanceSessionId: attendanceSession.id,
            classroomCode: attendanceSession.classroomCode,
            userId,
            markMethod: "student",
        })
        .onConflictDoNothing();

    return {
        success: true,
        payload: {
            message: "Attendance marked after face verification.",
            confidence: verification.confidence,
            attendanceSessionId: attendanceSession.id,
        },
    };
});
