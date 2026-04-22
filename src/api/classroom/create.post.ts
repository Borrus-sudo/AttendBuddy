import { defineHandler } from "nitro";
import { HTTPError, readBody } from "h3";
import { db, schema } from "@/src/lib/db";
import { eq } from "drizzle-orm";
import * as z from "zod";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CLASSROOM_CODE_LENGTH = 6;

const Params = z.object({
    name: z.string().nonempty(),
    description: z.string(),
});

function randomCode(length: number): string {
    let code = "";
    for (let index = 0; index < length; index += 1) {
        const nextIndex = Math.floor(Math.random() * CODE_ALPHABET.length);
        code += CODE_ALPHABET[nextIndex]!;
    }
    return code;
}

async function getUniqueClassroomCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = randomCode(CLASSROOM_CODE_LENGTH);
        const existing = await db
            .select({ code: schema.classroom.code })
            .from(schema.classroom)
            .where(eq(schema.classroom.code, code));

        if (existing.length === 0) {
            return code;
        }
    }

    throw HTTPError.status(500, "Internal Server Error", {
        message: "Failed to generate a unique classroom code.",
    });
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
        code: await getUniqueClassroomCode(),
        creatorId: userId,
        name: parsed.data.name,
        description: parsed.data.description,
    };

    await db.transaction(async (tx) => {
        await tx
            .insert(schema.classroom)
            .values(classroom)
            .onConflictDoNothing();

        await tx
            .insert(schema.classroomMember)
            .values({
                classroomCode: classroom.code,
                userId,
            })
            .onConflictDoNothing();
    });

    return {
        success: true,
        payload: {
            message: `Created classroom ${classroom.code}`,
        },
    };
});
