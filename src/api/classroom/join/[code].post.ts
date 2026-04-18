import { defineHandler } from "nitro";
import { HTTPError } from "nitro";
import * as z from "zod";
import { db, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";

const Params = z.object({
    code: z.string(),
});

export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;
    const parsed = Params.safeParse(event.context.params);
    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom code is not valid vro!",
        });
    }
    const { code: classroomCode } = parsed.data;
    const classrooms = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, classroomCode));
    if (classrooms.length == 0) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom code is not valid vro!",
        });
    }
    if (classrooms.length > 1) {
        throw new HTTPError("Classrooms with same id found!", {
            message: "[UNEXPECTED]: classrooms with the same id found",
        });
    }

    await db
        .insert(schema.classroomMember)
        .values({
            classroomCode: classroomCode,
            userId: userId,
        })
        .onConflictDoNothing();

    return {
        done: true,
        payload: {
            message: `Added to the classroom ${classroomCode}`,
        },
    };
});
