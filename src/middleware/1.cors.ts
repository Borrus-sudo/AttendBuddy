import { handleCors } from "h3"
import { defineHandler } from "nitro"

const allowedOrigins = ["http://localhost:3000"]

export default defineHandler((event) => {
    if (!event.url.pathname.startsWith("/api/")) {
        return
    }

    const res = handleCors(event, {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        maxAge: "86400",
        preflight: {
            statusCode: 204,
        },
    })
    if (res !== false) {
        return res
    }
    return
})
