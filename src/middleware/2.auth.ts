import { HTTPError } from "h3";
import { defineHandler } from "nitro";

import { auth } from "@/src/lib/auth";

declare module "h3" {
    interface H3EventContext {
        user: NonNullable<
            Awaited<ReturnType<typeof auth.api.getSession>>
        >["user"];
        session: NonNullable<
            Awaited<ReturnType<typeof auth.api.getSession>>
        >["session"];
    }
}

export default defineHandler(async (event) => {
    const path = event.url.pathname;

    // if (event.req.method === "OPTIONS") {
    //     return;
    // }

    if (!path.startsWith("/api/") || path.startsWith("/api/auth")) {
        return;
    }

    const session = await auth.api.getSession({
        headers: event.req.headers,
    });

    if (!session || !session.user || !session.session) {
        throw HTTPError.status(401, "Unauthorized", {
            message: "You must be signed in to access this endpoint.",
        });
    }

    event.context.user = session.user;
    event.context.session = session.session;
});
