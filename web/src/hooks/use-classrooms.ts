import { useCallback, useEffect, useState } from "react";

import {
    createClassroom,
    deleteClassroom,
    joinClassroom,
    leaveClassroom,
    listClassrooms,
} from "../lib/api";
import type { Classroom } from "../types/classroom";

type UseClassroomsReturn = {
    classrooms: Classroom[];
    isLoading: boolean;
    isSubmitting: boolean;
    activeCode: string | undefined;
    error: string | null;
    create: (input: { name: string; description: string }) => Promise<void>;
    join: (code: string) => Promise<void>;
    leave: (code: string) => Promise<void>;
    remove: (code: string) => Promise<void>;
    refresh: () => Promise<void>;
};

export function useClassrooms(enabled = true): UseClassroomsReturn {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeCode, setActiveCode] = useState<string>();
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        if (!enabled) {
            setClassrooms([]);
            return;
        }

        setError(null);
        const data = await listClassrooms();
        setClassrooms(data);
    }, [enabled]);

    useEffect(() => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }

        (async () => {
            try {
                await refresh();
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "Failed to load classrooms";
                setError(message);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [enabled, refresh]);

    async function create(input: { name: string; description: string }) {
        setIsSubmitting(true);
        setError(null);
        try {
            await createClassroom(input);
            await refresh();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to create classroom";
            setError(message);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function join(code: string) {
        setIsSubmitting(true);
        setError(null);
        try {
            await joinClassroom(code);
            await refresh();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Failed to join classroom";
            setError(message);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    }

    async function leave(code: string) {
        setActiveCode(code);
        setError(null);
        try {
            await leaveClassroom(code);
            await refresh();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to leave classroom";
            setError(message);
            throw err;
        } finally {
            setActiveCode(undefined);
        }
    }

    async function remove(code: string) {
        setActiveCode(code);
        setError(null);
        try {
            await deleteClassroom(code);
            await refresh();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "Failed to delete classroom";
            setError(message);
            throw err;
        } finally {
            setActiveCode(undefined);
        }
    }

    return {
        classrooms,
        isLoading,
        isSubmitting,
        activeCode,
        error,
        create,
        join,
        leave,
        remove,
        refresh,
    };
}
