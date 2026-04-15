import { defineHandler } from "nitro";
import { HTTPError, readBody } from "h3";
import { db, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import * as z from "zod";
import { v4 as uuid } from "uuid";

const Params = z.object({
    name: z.string().nonempty(),
    description: z.string(),
});

async function getUniqueUUID() {
    do {
        let code = uuid();
        const pres =
            (
                await db
                    .select({ code: schema.classroom.code })
                    .from(schema.classroom)
                    .where(eq(schema.classroom.code, code))
            ).length != 0;
        if (pres) continue;
        return code;
    } while (true);
}
export default defineHandler(async (event) => {
    const { id: userId } = event.context.user;
    const payload = await readBody(event); //Confirm: This only reads JSON mimes?
    const parsed = await Params.safeParse(payload);
    if (!parsed.success) {
        throw HTTPError.status(400, "Not authorized", {
            message: parsed.error.message, //TODO: improve this
        });
    }
    const classroom = {
        code: await getUniqueUUID(),
        creatorId: userId,
        name: parsed.data.name,
        description: parsed.data.description,
    };
    await db.insert(schema.classroom).values(classroom).onConflictDoNothing();
    return {
        success: true,
        payload: {
            message: `Created classroom ${classroom.code}`,
        },
    };
});
