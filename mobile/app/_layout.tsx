import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, LogBox, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

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
                <RootNavigator />
            </AuthProvider>
            <StatusBar style="auto" />
        </ThemeProvider>
    );
}

function RootNavigator() {
    const user = useAuth();

    if (user === undefined) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    if (!user) {
        return (
            <Stack initialRouteName="sign-in">
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="sign-in" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="classroom/[code]"
                    options={{ title: "Classroom" }}
                />
            </Stack>
        );
    }

    return (
        <Stack initialRouteName="(tabs)">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="classroom/[code]"
                options={{ title: "Classroom" }}
            />
        </Stack>
    );
}
