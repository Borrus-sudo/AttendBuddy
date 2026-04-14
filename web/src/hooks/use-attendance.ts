import { useState } from "react";

import { closeAttendanceSession, createAttendanceSession } from "../lib/api";
import type { AttendanceSession } from "../types/classroom";

type UseAttendanceReturn = {
    activeSession: AttendanceSession | null;
    loading: boolean;
    error: string | null;
    startSession: (args: {
        classroomCode: string;
        durationMinutes: number;
    }) => Promise<void>;
    closeSession: (args: {
        classroomCode: string;
        attendanceSessionId: string;
    }) => Promise<void>;
    clearSession: () => void;
};

export function useAttendance(): UseAttendanceReturn {
    const [activeSession, setActiveSession] =
        useState<AttendanceSession | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function startSession(args: {
        classroomCode: string;
        durationMinutes: number;
    }) {
        setLoading(true);
        setError(null);
        try {
            const data = await createAttendanceSession(args);
            setActiveSession(data.attendanceSession);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Could not start attendance session";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    async function closeSession(args: {
        classroomCode: string;
        attendanceSessionId: string;
    }) {
        setLoading(true);
        setError(null);
        try {
            await closeAttendanceSession(args);
            setActiveSession(null);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Could not close attendance session";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    function clearSession() {
        setActiveSession(null);
    }

    return {
        activeSession,
        loading,
        error,
        startSession,
        closeSession,
        clearSession,
    };
}
