import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

config({
    quiet: true,
});

const client = createClient({
    url: process.env.APP_DATABASE_URL ?? "file:./db/local.db",
});

const db = drizzle(client);

await migrate(db, {
    migrationsFolder: "./db/migrations",
});

console.log("Migrations complete");
