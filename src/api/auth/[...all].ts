import { defineHandler } from "nitro";

import { auth } from "@/src/lib/auth";

export default defineHandler((event) => {
    return auth.handler(event.req);
});
