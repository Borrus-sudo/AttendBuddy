import { HTTPError } from "h3";
import { defineHandler } from "nitro";

export default defineHandler(async () => {
    throw HTTPError.status(400, "Bad Request", {
        message:
            "Student attendance now requires face verification. Use /api/session/verify flow.",
    });
});
