import { Platform } from "react-native";

function getDefaultApiBaseUrl(): string {
    if (Platform.OS === "android") {
        return "http://192.168.29.227:5000";
    }

    return "http://localhost:5000";
}

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_BASE_URL || getDefaultApiBaseUrl();
