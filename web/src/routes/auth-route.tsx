import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import { GoogleSignInCard } from "../components/auth/google-sign-in-card";
import { getSession, signIn, useSession } from "../lib/auth-client";

export function AuthRoute() {
    const { data: session, isPending } = useSession();
    const [isRedirecting, setIsRedirecting] = useState(false);

    const hasOAuthParams = useMemo(() => {
        const search = window.location.search;
        return (
            search.includes("code=") ||
            search.includes("state=") ||
            search.includes("error=")
        );
    }, []);

    useEffect(() => {
        if (session || isPending || !hasOAuthParams) {
            return;
        }

        (async () => {
            try {
                await getSession();
            } catch {
                // No session yet, keep on auth screen.
            }
            history.replaceState({}, document.title, window.location.pathname);
        })();
    }, [hasOAuthParams, isPending, session]);

    async function handleGoogleSignIn() {
        setIsRedirecting(true);
        await signIn.social({
            provider: "google",
            callbackURL: `${window.location.origin}/app`,
        });
    }

    if (isPending) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
                <p className="text-sm text-slate-300">
                    Checking your session...
                </p>
            </div>
        );
    }

    if (session) {
        return <Navigate to="/app" replace />;
    }

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_45%)]" />
            <div className="relative w-full">
                <GoogleSignInCard
                    onSignIn={handleGoogleSignIn}
                    isLoading={isRedirecting}
                />
            </div>
        </div>
    );
}
