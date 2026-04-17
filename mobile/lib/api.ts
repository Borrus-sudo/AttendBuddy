import { API_BASE_URL } from "@/lib/config";
import { getAuthCookie } from "@/lib/auth";
import { Platform } from "react-native";
import type {
    ClassroomDetailPayload,
    ClassroomSummary,
    SuccessEnvelope,
    UserProfilePayload,
} from "@/types/api";

export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

type RequestMethod = "GET" | "POST" | "DELETE";

type RequestOptions = {
    method?: RequestMethod;
    body?: Record<string, unknown>;
};

async function request<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    let credentials: RequestCredentials = "include";

    if (Platform.OS !== "web") {
        const cookie = await getAuthCookie();
        if (cookie) {
            headers.Cookie = cookie;
        }
        credentials = "omit";
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers,
        credentials,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const errorBody = (await response.json()) as {
                payload?: { message?: string };
                message?: string;
            };
            message =
                errorBody.payload?.message || errorBody.message || message;
        } catch {
            // Keep fallback message when response is not JSON.
        }

        throw new ApiError(message, response.status);
    }

    return (await response.json()) as T;
}

export async function getUserProfile(
    userId: string,
): Promise<SuccessEnvelope<UserProfilePayload>> {
    return request<SuccessEnvelope<UserProfilePayload>>(`/api/user/${userId}`);
}

export async function getClassroomByCode(
    code: string,
): Promise<SuccessEnvelope<ClassroomDetailPayload>> {
    return request<SuccessEnvelope<ClassroomDetailPayload>>(
        `/api/classroom/${code}`,
    );
}

export async function createClassroom(input: {
    name: string;
    description: string;
}): Promise<void> {
    await request<SuccessEnvelope<{ message: string }>>(
        "/api/classroom/create",
        {
            method: "POST",
            body: input,
        },
    );
}

export async function joinClassroom(code: string): Promise<void> {
    await request("/api/classroom/join/" + code, {
        method: "POST",
    });
}

export async function deleteClassroom(code: string): Promise<void> {
    await request("/api/classroom/" + code, {
        method: "DELETE",
    });
}

export function isClassroomTeacher(
    classroom: ClassroomSummary,
    userId: string,
): boolean {
    const role =
        classroom.role ||
        (classroom.creatorId === userId ? "teacher" : "member");
    return role === "teacher" || role === "creator";
}
