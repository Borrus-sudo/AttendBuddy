import { defineHandler } from "nitro";

export default defineHandler(() => {
    return {
        text: "Hello World!",
    };
});
