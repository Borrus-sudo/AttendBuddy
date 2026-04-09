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
