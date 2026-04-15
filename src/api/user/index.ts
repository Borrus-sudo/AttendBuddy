import { defineHandler } from "nitro";

export default defineHandler((event) => {
    event.context.params;
    return {
        success: true,
        payload: {
            message: "Hey there, hope you are not trying to hack us!?",
        },
    };
});
