import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { ActivityIndicator, View } from "react-native";

export default function AuthLayout() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    // If already logged in → kick out of auth screens
    if (user) {
        return <Redirect href="/(protected)/(tabs)/profile" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
