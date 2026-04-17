import { createContext, useContext } from "react";

import { useSession } from "@/lib/auth";
import type { AppUser } from "@/types/api";

const AuthContext = createContext<AppUser | null | undefined>(undefined);

function toAppUser(data: unknown): AppUser | null {
    if (!data || typeof data !== "object") {
        return null;
    }

    const sessionData = data as {
        user?: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
        };
    };

    if (!sessionData.user) {
        return null;
    }

    return {
        id: sessionData.user.id,
        name: sessionData.user.name,
        email: sessionData.user.email,
        image: sessionData.user.image ?? null,
    };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data, isPending } = useSession();

    const user = isPending ? undefined : toAppUser(data);

    return (
        <AuthContext.Provider value={user}>{children}</AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
