import { defineHandler } from "nitro";

export default defineHandler(async (event) => {
    return {
        message: "Hello from API!",
        user: event.context.user,
    };
});
