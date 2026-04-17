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

export type SuccessEnvelope<T> = {
    success: true;
    payload: T;
};
