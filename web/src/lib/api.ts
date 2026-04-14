import type {
    AttendanceOverview,
    AttendanceSession,
    Classroom,
    MyAttendanceSummary,
} from "../types/classroom";

const apiBaseUrl =
    import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:5000";

type HttpMethod = "GET" | "POST" | "DELETE";

type ApiOptions = {
    method?: HttpMethod;
    body?: unknown;
};

async function apiRequest<T>(
    path: string,
    options: ApiOptions = {},
): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method: options.method || "GET",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const errorData = (await response.json()) as {
                message?: string;
                statusMessage?: string;
                data?: { message?: string };
            };
            message =
                errorData.data?.message ||
                errorData.message ||
                errorData.statusMessage ||
                message;
        } catch {
            // Keep fallback message when response is not JSON.
        }

        throw new Error(message);
    }

    return (await response.json()) as T;
}

export async function listClassrooms(): Promise<Classroom[]> {
    const data = await apiRequest<{ classrooms: Classroom[] }>(
        "/api/classroom/list",
    );
    return data.classrooms;
}

export async function createClassroom(input: {
    name: string;
    description?: string;
}): Promise<Classroom> {
    const data = await apiRequest<{ classroom: Classroom }>(
        "/api/classroom/create",
        {
            method: "POST",
            body: input,
        },
    );

    return data.classroom;
}

export async function joinClassroom(code: string): Promise<Classroom> {
    const data = await apiRequest<{ classroom: Classroom }>(
        "/api/classroom/join",
        {
            method: "POST",
            body: { code },
        },
    );

    return data.classroom;
}

export async function leaveClassroom(code: string): Promise<void> {
    await apiRequest<{ left: boolean }>("/api/classroom/leave", {
        method: "POST",
        body: { code },
    });
}

export async function deleteClassroom(code: string): Promise<void> {
    await apiRequest<{ deleted: boolean }>(`/api/classroom/${code}`, {
        method: "DELETE",
    });
}

export async function createAttendanceSession(input: {
    classroomCode: string;
    durationMinutes: number;
}): Promise<{
    attendanceSession: AttendanceSession;
    qrPayload: {
        token: string;
        classroomCode: string;
        endpoint: string;
    };
}> {
    return apiRequest<{
        attendanceSession: AttendanceSession;
        qrPayload: {
            token: string;
            classroomCode: string;
            endpoint: string;
        };
    }>(`/api/classroom/${input.classroomCode}/attendance/session.create`, {
        method: "POST",
        body: {
            durationMinutes: input.durationMinutes,
        },
    });
}

export async function closeAttendanceSession(input: {
    classroomCode: string;
    attendanceSessionId: string;
}): Promise<void> {
    await apiRequest<{ closed: boolean }>(
        `/api/classroom/${input.classroomCode}/attendance/session/${input.attendanceSessionId}/close`,
        {
            method: "POST",
        },
    );
}

export async function getClassroomAttendanceOverview(
    classroomCode: string,
): Promise<AttendanceOverview> {
    return apiRequest<AttendanceOverview>(
        `/api/classroom/${classroomCode}/attendance/overview`,
    );
}

export async function getMyClassroomAttendance(
    classroomCode: string,
): Promise<MyAttendanceSummary> {
    return apiRequest<MyAttendanceSummary>(
        `/api/classroom/${classroomCode}/attendance/me`,
    );
}

export async function markAttendanceByToken(token: string): Promise<{
    marked: boolean;
    alreadyMarked: boolean;
    attendanceSessionId: string;
    classroomCode: string;
}> {
    return apiRequest<{
        marked: boolean;
        alreadyMarked: boolean;
        attendanceSessionId: string;
        classroomCode: string;
    }>("/api/attendance/scan", {
        method: "POST",
        body: { token },
    });
}
