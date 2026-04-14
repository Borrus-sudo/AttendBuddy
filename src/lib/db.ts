import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { useRuntimeConfig } from "nitro/runtime-config";

import * as schema from "@/db/schema";

const runtimeConfig = useRuntimeConfig();

const client = createClient({
    url: runtimeConfig.databaseUrl || "file:./db/local.db",
    authToken: runtimeConfig.databaseAuthToken || undefined,
});

export const db = drizzle(client, { schema });
