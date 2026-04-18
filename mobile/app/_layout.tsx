import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider } from "@/providers/auth-provider";

LogBox.ignoreLogs([
    "props.pointerEvents is deprecated. Use style.pointerEvents",
]);

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
            <AuthProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </AuthProvider>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
