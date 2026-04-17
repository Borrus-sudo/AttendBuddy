import { defineHandler } from "nitro";
import { HTTPError } from "h3";
import { db, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import * as z from "zod";

const Params = z.object({
    code: z.string(),
});

export default defineHandler(async (event) => {
    const parsed = Params.safeParse(event.context.params);

    if (!parsed.success)
        throw HTTPError.status(400, "Bad Request", {
            message: "Classroom code is not valid vro!",
        });

    const { id: userId } = event.context.user;
    const { code } = parsed.data;

    const classrooms = await db
        .select()
        .from(schema.classroom)
        .where(eq(schema.classroom.code, code));

    if (classrooms.length == 0) {
        throw HTTPError.status(404, "Not Found", {
            message: "Classroom not found vro!",
        });
    }
    if (classrooms.length > 1) {
        throw new HTTPError("Classrooms with same id found!", {
            message: "[UNEXPECTED]: classrooms with the same id found",
        });
    }

    const classroom = classrooms[0]!; // This is already validated, so no worries
    const classroomOwnerId = classroom.creatorId;

    if (classroomOwnerId != userId) {
        throw HTTPError.status(401, "Not authorized", {
            message: "You haven't created the classroom vro!",
        });
    }

    await db.delete(schema.classroom).where(eq(schema.classroom.code, code));
    return {
        success: true,
        payload: "Operation done!",
    };
});
