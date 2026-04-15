import { defineHandler } from "nitro";
import { HTTPError } from "h3";
import { db, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import * as z from "zod";

const Params = z.object({
    id: z.string().nonempty().min(5), // TODO: improve this?
});

export default defineHandler(async (event) => {
    const parsed = Params.safeParse(event.context.params);
    if (!parsed.success) {
        throw HTTPError.status(400, "Bad Request", {
            message: "Id needs to be a string",
        });
    }
    const { id: requestedId } = parsed.data;
    const { id: userId } = event.context.user;
    if (userId != requestedId) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "Yes, we do server side validation vro!",
        });
    }
    await db.delete(schema.user).where(eq(schema.user.id, userId));
    return {
        success: true,
    };
});
