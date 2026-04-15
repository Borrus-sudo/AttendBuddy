import { defineHandler } from "nitro";
import { HTTPError } from "h3";
import { db, schema } from "@/src/lib/db";
import { eq, getTableColumns } from "drizzle-orm";
import * as z from "zod";

const Params = z.object({
    id: z.string().nonempty().min(5), // TODO: improve this?
});

// TODO: reduce db round trips?
export default defineHandler(async (event) => {
    const parsed = Params.safeParse(event.context.params);
    if (!parsed.success)
        throw HTTPError.status(400, "Bad Request", {
            message: "Id is not valid vro!",
        });

    const { id: userId } = event.context.user;
    const { id: requestedId } = parsed.data;
    if (userId != requestedId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Yes, we do server side validation vro!",
        });
    }
    const data = await db
        .selectDistinct() // redundant, buy why not
        .from(schema.user)
        .where(eq(schema.user.id, requestedId));

    // redundant, but why not
    if (data.length == 0) {
        throw HTTPError.status(404, "User not found", {
            message: `[UNEXPECTED]: ${requestedId} not found in the db vro.`,
        });
    }

    const userInfo = data[0]!;

    const classrooms = await db
        .selectDistinct(getTableColumns(schema.classroom))
        .from(schema.classroom)
        .innerJoin(
            schema.classroomMember,
            eq(schema.classroomMember.classroomCode, schema.classroom.code),
        )
        .where(eq(schema.classroomMember.userId, userInfo.id));

    return {
        success: true,
        payload: {
            ...userInfo,
            classrooms: classrooms.map((classroom) => ({
                ...classroom,
                role: classroom.creatorId == userInfo.id ? "teacher" : "member",
            })),
        },
    };
});
