import { useCallback, useEffect, useState } from "react";

import {
    getClassroomAttendanceOverview,
    getMyClassroomAttendance,
} from "../lib/api";
import type {
    AttendanceOverview,
    MyAttendanceSummary,
} from "../types/classroom";

type UseClassroomAnalyticsReturn = {
    loading: boolean;
    error: string | null;
    creatorOverview: AttendanceOverview | null;
    myAttendance: MyAttendanceSummary | null;
    refresh: () => Promise<void>;
};

type UseClassroomAnalyticsArgs = {
    classroomCode: string | null;
    role: "creator" | "member" | null;
};

export function useClassroomAnalytics({
    classroomCode,
    role,
}: UseClassroomAnalyticsArgs): UseClassroomAnalyticsReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [creatorOverview, setCreatorOverview] =
        useState<AttendanceOverview | null>(null);
    const [myAttendance, setMyAttendance] =
        useState<MyAttendanceSummary | null>(null);

    const refresh = useCallback(async () => {
        if (!classroomCode || !role) {
            setCreatorOverview(null);
            setMyAttendance(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (role === "creator") {
                const overview =
                    await getClassroomAttendanceOverview(classroomCode);
                setCreatorOverview(overview);
                setMyAttendance(null);
            } else {
                const mySummary = await getMyClassroomAttendance(classroomCode);
                setMyAttendance(mySummary);
                setCreatorOverview(null);
            }
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to load classroom attendance analytics";
            setError(message);
            setCreatorOverview(null);
            setMyAttendance(null);
        } finally {
            setLoading(false);
        }
    }, [classroomCode, role]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        loading,
        error,
        creatorOverview,
        myAttendance,
        refresh,
    };
}
