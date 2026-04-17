import { HTTPError } from "h3";
import { consola } from "consola";
import type { NitroErrorHandler } from "nitro/types";

const onError: NitroErrorHandler = (error, event) => {
    const requestPath = event?.req.url
        ? new URL(event.req.url).pathname
        : "unknown";
    const method = event?.req.method ?? "UNKNOWN";

    if (HTTPError.isError(error)) {
        consola.error({
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
                headers: {
                    "content-type": "application/json",
                },
            },
        );
    }

    consola.error({
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
            headers: {
                "content-type": "application/json",
            },
        },
    );
};

export default onError;
