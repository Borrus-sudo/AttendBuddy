import { Stack, Redirect } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { ActivityIndicator, View } from "react-native";

export default function ProtectedLayout() {
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

    // Not logged in → send to sign-in
    if (!user) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
