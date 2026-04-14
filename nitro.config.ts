import { defineConfig } from "nitro";

export default defineConfig({
    serverDir: "./src",
    errorHandler: "./src/error.ts",
    // Everything would be overridden by the env variables. See `.env.example`
    runtimeConfig: {
        databaseUrl: "",
        databaseAuthToken: "",
        betterAuthSecret: "",
        betterAuthUrl: "",
        googleClientId: "",
        googleClientSecret: "",
        frontendUrl: "",
        backendUrl: "",
        nitro: {
            envPrefix: "APP_",
        },
    },
});
