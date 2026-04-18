import { Redirect } from "expo-router";
import { useAuth } from "@/providers/auth-provider";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
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

    return (
        <Redirect
            href={user ? "/(protected)/(tabs)/profile" : "/(auth)/sign-in"}
        />
    );
}
