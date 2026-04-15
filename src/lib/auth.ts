import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { useRuntimeConfig } from "nitro/runtime-config";
import { db, schema } from "@/src/lib/db.ts";

const runtimeConfig = useRuntimeConfig();

type EmailMeta = {
    name: string;
    year: string;
    branch: string;
};

type VjtiEmailResult =
    | {
          ok: true;
          meta: EmailMeta;
      }
    | {
          ok: false;
      };

function isVjtiEmail(email: string): VjtiEmailResult {
    const normalizedEmail = email.trim().toLowerCase();

    const emailMatch = normalizedEmail.match(
        /^([a-z]+)_b([0-9]{2})@([a-z]{2})\.vjti\.ac\.in$/,
    );

    if (!emailMatch) {
        return { ok: false };
    }

    const name = emailMatch[1];
    const year = emailMatch[2];
    const branch = emailMatch[3];

    if (!name || !year || !branch) {
        return { ok: false };
    }
    // TODO: validate this from the vjti website!
    const allowedBranches = new Set([
        "ce",
        "me",
        "ee",
        "it",
        "cs",
        "ec",
        "ch",
        "pr",
        "cv",
    ]);

    if (!allowedBranches.has(branch)) {
        return { ok: false };
    }

    return {
        ok: true,
        meta: {
            name,
            year,
            branch,
        },
    };
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema,
    }),
    baseURL: runtimeConfig.backendUrl,
    trustedOrigins: [runtimeConfig.frontendUrl, runtimeConfig.backendUrl],
    basePath: "/api/auth",
    secret: runtimeConfig.betterAuthSecret,
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
