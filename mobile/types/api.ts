export type AppUser = {
    id: string;
    name: string;
    email: string;
    image: string | null;
};

export type SessionPayload = {
    user: AppUser;
    session: {
        id: string;
    };
};

export type ClassroomSummary = {
    code: string;
    name: string;
    description: string | null;
    creatorId: string;
    isActive: boolean;
    role?: "teacher" | "member" | "creator";
};

export type ClassroomRole = "teacher" | "student";

export type UserProfilePayload = AppUser & {
    classrooms: ClassroomSummary[];
};

export type ClassroomMember = {
    id: string;
    name: string;
    email: string;
    image: string | null;
};

export type ClassroomDetailPayload = {
    code: string;
    name: string;
    description: string | null;
    creatorId: string;
    isActive: boolean;
    members: ClassroomMember[];
};

export type AttendanceSessionSummary = {
    id: string;
    classroomCode: string;
    token?: string;
    createdByUserId?: string;
    createdAt: string;
    expiresAt: string;
    isClosed: boolean;
    presentCount: number;
    totalCount: number;
    status?: "present" | "absent" | "unknown";
};

export type AttendanceMemberStatus = {
    userId: string;
    name: string;
    email: string;
    image: string | null;
    isPresent: boolean;
    markedAt?: string | null;
};

export type AttendanceRequestStatus = "pending" | "approved" | "rejected";

export type AttendanceRequestItem = {
    id: string;
    attendanceSessionId: string;
    classroomCode: string;
    studentUserId: string;
    studentName: string;
    studentEmail: string;
    message: string;
    status: AttendanceRequestStatus;
    reviewNote: string | null;
    createdAt: string;
    reviewedAt: string | null;
};

export type AttendanceVerificationChallenge = {
    challengeId: string;
    challengeToken: string;
    expiresAt: string;
};

export type AttendanceSessionDetailPayload = {
    session: AttendanceSessionSummary;
    role: "teacher" | "student";
    currentUserId: string;
    members: AttendanceMemberStatus[];
    requests: AttendanceRequestItem[];
};

export type MemberAttendanceAnalytics = {
    member: ClassroomMember;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    recent: Array<{
        sessionId: string;
        createdAt: string;
        status: "present" | "absent";
    }>;
};

export type SuccessEnvelope<T> = {
    success: true;
    payload: T;
};
