import { Platform } from "react-native";

export const API_BASE_URL = "http://localhost:5000";

export const isWeb = Platform.OS === "web";
