import { Platform } from "react-native";

// export const API_BASE_URL = "https://attendbuddy-1.onrender.com/";
// attendbuddy-1.onrender.com/api/auth/callback/google
// "https://attend-buddy-601876851843.europe-west1.run.app";
export const API_BASE_URL = "http://localhost:5000";
export const isWeb = Platform.OS === "web";
