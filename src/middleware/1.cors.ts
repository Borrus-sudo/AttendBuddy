import { handleCors } from "h3";
import { defineHandler } from "nitro";
import { useRuntimeConfig } from "nitro/runtime-config";

export default defineHandler((event) => {
    const runtimeConfig = useRuntimeConfig();
    const allowedOrigins = [
        runtimeConfig.frontendUrl,
        runtimeConfig.backendUrl,
    ];

    const res = handleCors(event, {
        origin(origin) {
            if (
                origin.startsWith("exp://") ||
                origin.startsWith("attend-buddy://")
            ) {
                return true;
            }
            // if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            // return true;
            // }
            console.log(origin);
            console.log(allowedOrigins.includes(origin));
            return allowedOrigins.includes(origin);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Cookie",
            "expo-origin",
            "x-skip-oauth-proxy",
        ],
        maxAge: "86400",
        preflight: {
            statusCode: 204,
        },
    });
    if (res !== false) {
        return res;
    }
    return;
});
