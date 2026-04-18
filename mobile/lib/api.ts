import { API_BASE_URL, isWeb } from "@/lib/config";
import { getAuthCookie } from "@/lib/auth";
import type {
    AttendanceMemberStatus,
    AttendanceSessionDetailPayload,
    AttendanceSessionSummary,
    ClassroomMember,
    ClassroomDetailPayload,
    ClassroomSummary,
    MemberAttendanceAnalytics,
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

    if (!isWeb) {
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

async function tryRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T | null> {
    try {
        return await request<T>(path, options);
    } catch {
        return null;
    }
}

function toIso(value: string | number | Date | undefined): string {
    if (!value) {
        return new Date().toISOString();
    }
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
        ? new Date().toISOString()
        : date.toISOString();
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

export async function getClassroomSessions(
    classroomCode: string,
): Promise<AttendanceSessionSummary[]> {
    const response = await tryRequest<SuccessEnvelope<{ sessions: unknown[] }>>(
        `/api/session/classroom/${classroomCode}`,
    );

    if (!response?.payload?.sessions) {
        return [];
    }

    return response.payload.sessions.map((item) => {
        const data = item as Record<string, unknown>;
        return {
            id: String(data.id || ""),
            classroomCode,
            token: data.token ? String(data.token) : undefined,
            createdAt: toIso(data.createdAt as string | number | Date),
            expiresAt: toIso(data.expiresAt as string | number | Date),
            isClosed: Boolean(data.isClosed),
            presentCount: Number(data.presentCount || 0),
            totalCount: Number(data.totalCount || 0),
            status:
                data.status === "present" || data.status === "absent"
                    ? data.status
                    : "unknown",
        } satisfies AttendanceSessionSummary;
    });
}

export async function createAttendanceSession(input: {
    classroomCode: string;
    durationMinutes: number;
}): Promise<AttendanceSessionSummary> {
    const response = await request<
        SuccessEnvelope<{
            session: {
                id: string;
                token?: string;
                classroomCode: string;
                expiresAt: string;
            };
        }>
    >("/api/session/create", {
        method: "POST",
        body: input,
    });

    return {
        id: response.payload.session.id,
        classroomCode: response.payload.session.classroomCode,
        token: response.payload.session.token,
        createdAt: new Date().toISOString(),
        expiresAt: toIso(response.payload.session.expiresAt),
        isClosed: false,
        presentCount: 0,
        totalCount: 0,
        status: "unknown",
    };
}

export async function getAttendanceSessionDetail(
    classroomCode: string,
    sessionId: string,
): Promise<AttendanceSessionDetailPayload> {
    const response = await tryRequest<
        SuccessEnvelope<AttendanceSessionDetailPayload>
    >(`/api/session/${sessionId}?classroomCode=${classroomCode}`);

    if (response?.payload?.session?.id) {
        return response.payload;
    }

    const classroom = await getClassroomByCode(classroomCode);
    const members = classroom.payload.members.map((member) => ({
        userId: member.id,
        name: member.name,
        email: member.email,
        image: member.image,
        isPresent: false,
        markedAt: null,
    })) satisfies AttendanceMemberStatus[];

    return {
        session: {
            id: sessionId,
            classroomCode,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            isClosed: false,
            presentCount: 0,
            totalCount: members.length,
            status: "unknown",
        },
        members,
    };
}

export async function setAttendancePresence(input: {
    attendanceSessionId: string;
    studentUserId: string;
    isPresent: boolean;
}): Promise<void> {
    const modern = await tryRequest<SuccessEnvelope<{ message: string }>>(
        "/api/session/attendance",
        {
            method: "POST",
            body: input,
        },
    );

    if (modern) {
        return;
    }

    if (input.isPresent) {
        await request<SuccessEnvelope<{ message: string }>>(
            "/api/session/manual",
            {
                method: "POST",
                body: {
                    attendanceSessionId: input.attendanceSessionId,
                    studentUserId: input.studentUserId,
                },
            },
        );
        return;
    }

    throw new ApiError(
        "This backend does not support marking an existing record as absent yet.",
        400,
    );
}

export async function getMemberAttendanceAnalytics(
    classroomCode: string,
    memberId: string,
): Promise<MemberAttendanceAnalytics> {
    const response = await tryRequest<
        SuccessEnvelope<MemberAttendanceAnalytics>
    >(`/api/classroom/${classroomCode}/member/${memberId}/analytics`);

    if (response?.payload?.member?.id) {
        return response.payload;
    }

    const classroom = await getClassroomByCode(classroomCode);
    const member =
        classroom.payload.members.find((item) => item.id === memberId) ||
        ({
            id: memberId,
            name: "Unknown student",
            email: "",
            image: null,
        } satisfies ClassroomMember);

    return {
        member,
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        percentage: 0,
        recent: [],
    };
}

export function formatSessionLabel(isoDate: string): string {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) {
        return "Unknown date";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
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
