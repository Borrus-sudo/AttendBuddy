import { HTTPError, readBody } from "h3";
import { eq } from "drizzle-orm";
import { defineHandler } from "nitro";
import { v4 as uuid } from "uuid";
import * as z from "zod";

import { db, schema } from "@/src/lib/db";

const SESSION_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SESSION_CODE_LENGTH = 8;

function randomSessionCode(length: number): string {
    let code = "";
    for (let index = 0; index < length; index += 1) {
        const nextIndex = Math.floor(
            Math.random() * SESSION_CODE_ALPHABET.length,
        );
        code += SESSION_CODE_ALPHABET[nextIndex]!;
    }
    return code;
}

async function getUniqueSessionCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const token = randomSessionCode(SESSION_CODE_LENGTH);
        const existing = await db
            .select({ token: schema.attendanceSession.token })
            .from(schema.attendanceSession)
            .where(eq(schema.attendanceSession.token, token));

        if (existing.length === 0) {
            return token;
        }
    }

    throw HTTPError.status(500, "Internal Server Error", {
        message: "Failed to generate a unique attendance code.",
    });
}

const Body = z.object({
    classroomCode: z.string().min(1),
    durationMinutes: z
        .number()
        .int()
        .min(1)
        .max(24 * 60),
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

    const { classroomCode, durationMinutes } = parsed.data;

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
    if (classroom.creatorId !== userId) {
        throw HTTPError.status(401, "Unauthorized", {
            message:
                "Only the classroom teacher can create attendance sessions.",
        });
    }

    const now = Date.now();
    const expiresAt = new Date(now + durationMinutes * 60 * 1000);
    const attendanceSessionId = uuid();
    const attendanceToken = await getUniqueSessionCode();

    await db.insert(schema.attendanceSession).values({
        id: attendanceSessionId,
        classroomCode,
        createdByUserId: userId,
        token: attendanceToken,
        expiresAt,
    });

    return {
        success: true,
        payload: {
            message: "Attendance session created.",
            session: {
                id: attendanceSessionId,
                token: attendanceToken,
                classroomCode,
                expiresAt,
            },
        },
    };
});
