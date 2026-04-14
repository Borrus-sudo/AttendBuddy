import { defineHandler } from "nitro";
import { consola } from "consola";

export default defineHandler(async (event) => {
    consola.info(JSON.stringify(event.context.user, null, 2));
    return {
        name: event.context.user?.name,
    };
});
