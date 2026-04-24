import { HTTPError } from "h3";
import { consola } from "consola";
import type { NitroErrorHandler } from "nitro/types";
import { useRuntimeConfig } from "nitro/runtime-config";

const onError: NitroErrorHandler = (error, event) => {
    const requestPath = new URL(event.req.url).pathname;
    const method = event.req.method;
    const runtimeConfig = useRuntimeConfig();

    const allowedOrigins = [
        runtimeConfig.frontendUrl,
        runtimeConfig.backendUrl,
    ];

    const origin = event.req.headers.get("origin");
    let allowOrigin = "";
    if (
        origin &&
        (allowedOrigins.includes(origin) ||
            origin.startsWith("exp://") ||
            origin.startsWith("attend-buddy://"))
    ) {
        allowOrigin = origin;
    }

    const corsHeaders: Record<string, string> = {
        "content-type": "application/json",
        "access-control-allow-credentials": "true",
    };
    if (allowOrigin) {
        corsHeaders["access-control-allow-origin"] = allowOrigin;
    }

    if (HTTPError.isError(error)) {
        console.log({
            status: error.status,
            statusText: error.statusText,
            method,
            path: requestPath,
            message: error.message,
        });
        return new Response(
            JSON.stringify({
                success: false,
                payload: {
                    error: error.statusText ?? "Error",
                    message: error.message || "Request failed",
                },
            }),
            {
                status: error.status,
                headers: corsHeaders,
            },
        );
    }
    console.log({
        method,
        path: requestPath,
        error,
    });

    return new Response(
        JSON.stringify({
            success: false,
            payload: {
                error: "Internal Server Error",
                message: "Something went wrong",
            },
        }),
        {
            status: 500,
            headers: corsHeaders,
        },
    );
};

export default onError;
