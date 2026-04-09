import { handleCors } from "h3"
import { defineHandler } from "nitro"

const allowedOrigins = ["http://localhost:3000"]

export default defineHandler((event) => {
    const res = handleCors(event, {
        origin: allowedOrigins,
        credentials: true,
        // allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        preflight: {
            statusCode: 204,
        },
    })
    if (res !== false) {
        return res
    }
    return
})
