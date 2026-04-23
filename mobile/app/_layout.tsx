import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
    useFonts,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
} from "@expo-google-fonts/outfit";
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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    
    const [loaded, error] = useFonts({
        "Outfit-Regular": Outfit_400Regular,
        "Outfit-Medium": Outfit_500Medium,
        "Outfit-SemiBold": Outfit_600SemiBold,
        "Outfit-Bold": Outfit_700Bold,
    });

    useEffect(() => {
        if (loaded || error) {
            SplashScreen.hideAsync();
        }
    }, [loaded, error]);

    if (!loaded && !error) {
        return null;
    }

    return (
        <ThemeProvider value={DefaultTheme}>
            <PaperProvider theme={MD3LightTheme}>
                <KeyboardAvoidingView
                    style={styles.root}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <AuthProvider>
                        <Stack screenOptions={{ headerShown: false }} />
                    </AuthProvider>
                </KeyboardAvoidingView>
                <StatusBar style="dark" />
            </PaperProvider>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
});
