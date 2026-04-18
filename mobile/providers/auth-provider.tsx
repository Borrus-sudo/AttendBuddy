import { createContext, useContext, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "expo-router";

import { useSession } from "@/lib/auth";
import type { AppUser } from "@/types/api";

type AuthContextType = {
    user: AppUser | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SessionLike = {
    user?: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    };
};

function toAppUser(data: SessionLike | null | undefined): AppUser | null {
    if (!data?.user) {
        return null;
    }

    return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        image: data.user.image ?? null,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data, isPending } = useSession();

    const value = useMemo<AuthContextType>(() => {
        const loading = isPending;
        const user = loading ? null : toAppUser((data as SessionLike) ?? null);
        return { user, loading };
    }, [data, isPending]);

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
}
