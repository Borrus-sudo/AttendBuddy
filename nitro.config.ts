import { defineConfig } from "nitro";

export default defineConfig({
    serverDir: "./src",
    errorHandler: "./src/error.ts",
    // Everything would be overridden by the env variables. See `.env.example`
    runtimeConfig: {
        databaseUrl: "",
        betterAuthSecret: "",
        googleClientId: "",
        googleClientSecret: "",
        frontendUrl: "",
        backendUrl: "",
        faceVerificationMinScore: "0.75",
        nitro: {
            envPrefix: "APP_",
        },
    },
    experimental: {
        openAPI: true,
    },
});
