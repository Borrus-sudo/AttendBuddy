import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    KeyboardAvoidingView,
    LogBox,
    Platform,
    StyleSheet,
} from "react-native";
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
            <PaperProvider
                theme={colorScheme === "dark" ? MD3DarkTheme : MD3LightTheme}
            >
                <KeyboardAvoidingView
                    style={styles.root}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <AuthProvider>
                        <Stack screenOptions={{ headerShown: false }} />
                    </AuthProvider>
                </KeyboardAvoidingView>
                <StatusBar style="auto" />
            </PaperProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
