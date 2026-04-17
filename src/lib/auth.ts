import { betterAuth } from "better-auth";
import { expo } from "@better-auth/expo";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { useRuntimeConfig } from "nitro/runtime-config";
import { db, schema } from "@/src/lib/db.ts";

const runtimeConfig = useRuntimeConfig();

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema,
    }),
    baseURL: runtimeConfig.backendUrl,
    trustedOrigins: [
        runtimeConfig.frontendUrl,
        runtimeConfig.backendUrl,
        "attend-buddy://",
        "attend-buddy://*",
        "exp://",
        "exp://**",
    ],
    basePath: "/api/auth",
    secret: runtimeConfig.betterAuthSecret,
    plugins: [expo()],
    socialProviders: {
        google: {
            clientId: runtimeConfig.googleClientId,
            clientSecret: runtimeConfig.googleClientSecret,
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    if (!user.emailVerified) {
                        return false;
                    }
                    return true;
                },
            },
        },
    },
});
