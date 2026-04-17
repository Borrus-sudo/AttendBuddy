import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { API_BASE_URL } from "@/lib/config";

const STORAGE_PREFIX = "attend-buddy";
const COOKIE_STORAGE_KEY = `${STORAGE_PREFIX}_cookie`;
const SESSION_STORAGE_KEY = `${STORAGE_PREFIX}_session_data`;

const storageCache = new Map<string, string>();
let hasHydratedStorage = false;
let hydrationPromise: Promise<void> | null = null;

function normalizeSecureStoreKey(key: string): string {
    return key.replace(/:/g, "_");
}

async function readStorageItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
        return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(normalizeSecureStoreKey(key));
}

async function writeStorageItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
        await AsyncStorage.setItem(key, value);
        return;
    }

    await SecureStore.setItemAsync(normalizeSecureStoreKey(key), value);
}

async function hydrateAuthStorage(): Promise<void> {
    if (hasHydratedStorage) {
        return;
    }

    if (hydrationPromise) {
        await hydrationPromise;
        return;
    }

    hydrationPromise = (async () => {
        const keys = [COOKIE_STORAGE_KEY, SESSION_STORAGE_KEY];

        await Promise.all(
            keys.map(async (key) => {
                try {
                    const value = await readStorageItem(key);
                    if (value) {
                        storageCache.set(key, value);
                    }
                } catch {
                    // Ignore storage read failures and continue with memory cache.
                }
            }),
        );

        hasHydratedStorage = true;
    })();

    await hydrationPromise;
}

const storageAdapter = {
    getItem(key: string): string | null {
        return storageCache.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
        storageCache.set(key, value);

        void writeStorageItem(key, value).catch(() => {
            // Ignore persistence failures and keep in-memory auth state.
        });
    },
};

void hydrateAuthStorage();

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

const shouldLogAuthDebug =
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    process.env.NODE_ENV !== "production";

export async function ensureAuthStorageHydrated(): Promise<void> {
    await hydrateAuthStorage();
}

export async function getAuthCookie(): Promise<string> {
    await ensureAuthStorageHydrated();
    const cookie = authClient.getCookie();

    if (shouldLogAuthDebug) {
        const cookiePayload = storageCache.get(COOKIE_STORAGE_KEY);
        console.log("[auth] cookie debug", {
            platform: Platform.OS,
            cookieLength: cookie.length,
            hasCookiePayload: Boolean(cookiePayload),
        });
    }

    return cookie;
}
