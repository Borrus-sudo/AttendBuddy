import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { API_BASE_URL, isWeb } from "@/lib/config";

const STORAGE_PREFIX = "attend-buddy";

const storageAdapter = {
    getItem(key: string): string | null {
        return isWeb ? localStorage.getItem(key) : SecureStore.getItem(key);
    },

    setItem(key: string, value: string): void {
        return isWeb
            ? localStorage.setItem(key, value)
            : SecureStore.setItem(key, value);
    },

    async deleteItemAsync(key: string): Promise<void> {
        if (isWeb) {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    },
};

export const authClient = createAuthClient({
    baseURL: API_BASE_URL,
    basePath: "/api/auth",
    plugins: [
        expoClient({
            scheme: "attend-buddy",
            storagePrefix: STORAGE_PREFIX,
            storage: storageAdapter,
        }),
    ],
});

export const { signIn, signOut, getSession, useSession, getCookie } =
    authClient;

export async function getAuthCookie(): Promise<string> {
    return authClient.getCookie();
}
