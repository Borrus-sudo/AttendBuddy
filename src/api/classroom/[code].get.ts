import { defineHandler } from "nitro";
import { HTTPError } from "h3";
import { db, schema } from "@/src/lib/db";
import { and, eq, getTableColumns, ne } from "drizzle-orm";
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

    const classroom = classrooms[0]!;
    const classroomOwnerId = classroom.creatorId;

    // find all the members of the classroom
    const members =
        userId == classroomOwnerId
            ? await db
                  .select(getTableColumns(schema.user))
                  .from(schema.user)
                  .innerJoin(
                      schema.classroomMember,
                      eq(schema.classroomMember.userId, schema.user.id),
                  )
                  .where(
                      and(
                          eq(schema.classroomMember.classroomCode, code),
                          ne(schema.user.id, classroomOwnerId),
                      ),
                  )
            : await db
                  .select()
                  .from(schema.user)
                  .where(eq(schema.user.id, classroomOwnerId));

    return {
        success: true,
        payload: {
            ...classroom,
            members,
        },
    };
});
