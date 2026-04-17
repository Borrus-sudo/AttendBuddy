import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({
    path: ".env.local",
});

export default defineConfig({
    dialect: "sqlite",
    schema: "./db/schema.ts",
    out: "./db/migrations",
    dbCredentials: {
        url: process.env.APP_DATABASE_URL!,
    },
});
