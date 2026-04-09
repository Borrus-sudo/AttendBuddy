export type ClassroomRole = "creator" | "member"

export type Classroom = {
    code: string
    name: string
    description: string | null
    creatorId: string
    isActive: boolean
    joinedAt?: string | number | Date
    role?: ClassroomRole
}

export type AttendanceSession = {
    id: string
    classroomCode: string
    token: string
    durationMinutes: number
    expiresAt: string
}

export type AttendanceOverviewStudent = {
    userId: string
    name: string
    email: string
    image: string | null
    joinedAt: string
    attendanceMarkedCount: number
    attendancePercentage: number
}

export type AttendanceOverview = {
    classroom: {
        code: string
        name: string
        description: string | null
        creatorId: string
        isActive: boolean
        createdAt?: string
    }
    stats: {
        memberCount: number
        totalSessions: number
        totalAttendanceMarks: number
    }
    students: AttendanceOverviewStudent[]
    recentSessions: Array<{
        id: string
        createdAt: string
        expiresAt: string
        isClosed: boolean
    }>
}

export type MyAttendanceHistoryItem = {
    attendanceSessionId: string
    sessionCreatedAt: string
    sessionExpiresAt: string
    markedAt: string | null
    status: "present" | "absent"
}

export type MyAttendanceSummary = {
    classroom: {
        code: string
        name: string
        description: string | null
        creatorId: string
        isActive: boolean
    }
    stats: {
        totalSessions: number
        attendedSessions: number
        attendancePercentage: number
    }
    history: MyAttendanceHistoryItem[]
}
