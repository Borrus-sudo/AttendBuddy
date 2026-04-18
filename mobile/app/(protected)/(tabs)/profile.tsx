import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import { signOut } from "@/lib/auth";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/providers/auth-provider";

export default function ProfileScreen() {
    const { user, loading } = useAuth();
    const cardColor = useThemeColor({}, "card");
    const borderColor = useThemeColor({}, "border");
    const mutedColor = useThemeColor({}, "muted");
    const primaryColor = useThemeColor({}, "primary");

    if (loading) {
        return null;
    }

    if (!user) {
        return null;
    }

    return (
        <ThemedView style={styles.container}>
            <View
                style={[
                    styles.headerCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                {user.image ? (
                    <Image
                        source={{ uri: user.image }}
                        style={styles.avatar}
                        contentFit="cover"
                        transition={150}
                    />
                ) : (
                    <View style={styles.avatarPlaceholder} />
                )}
                <ThemedText type="title">{user.name}</ThemedText>
                <ThemedText style={[styles.mutedText, { color: mutedColor }]}>
                    {user.email}
                </ThemedText>
            </View>

            <View
                style={[
                    styles.detailCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                <ThemedText type="subtitle">Profile Details</ThemedText>
                <ThemedText>User ID: {user.id}</ThemedText>
                <ThemedText>Name: {user.name}</ThemedText>
                <ThemedText>Email: {user.email}</ThemedText>
            </View>

            <Pressable
                style={[
                    styles.signOutButton,
                    { backgroundColor: primaryColor },
                ]}
                onPress={() => {
                    void signOut();
                }}
            >
                <IconSymbol
                    name="rectangle.portrait.and.arrow.right"
                    size={18}
                    color="#ffffff"
                />
                <ThemedText style={styles.signOutText}>Sign out</ThemedText>
            </Pressable>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 16,
    },
    headerCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        gap: 6,
    },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        marginBottom: 8,
    },
    avatarPlaceholder: {
        width: 84,
        height: 84,
        borderRadius: 42,
        marginBottom: 8,
        backgroundColor: "#d1d5db",
    },
    mutedText: {
        textAlign: "center",
    },
    detailCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
        gap: 8,
    },
    signOutButton: {
        marginTop: "auto",
        borderRadius: 12,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    signOutText: {
        color: "#ffffff",
        fontWeight: "700",
    },
});
