import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { signIn } from "@/lib/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { isWeb } from "@/lib/config";
import { Spacing, Radii, Shadows } from "@/constants/theme";

export default function SignInScreen() {
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    if (loading) {
        return (
            <ThemedView style={styles.container}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (user) {
        return null;
    }

    async function handleGoogleSignIn() {
        setError(null);
        setIsSubmitting(true);
        try {
            const result = await signIn.social({
                provider: "google",
                // TODO: solve this, make this more prod ready and mobile ready?
                callbackURL: isWeb ? "http://localhost:8081/home" : "/home",
            });
            if (result?.error) {
                throw new Error(
                    result.error.message || "Google sign-in failed",
                );
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to sign in with Google",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const disabled = isSubmitting;

    return (
        <ThemedView style={styles.container}>
            <LinearGradient
                colors={
                    isDark
                        ? ["#13141B", "#1E1F2B"]
                        : ["#F7F8FC", "#F0EAFF"]
                }
                style={[styles.gradient, { paddingTop: insets.top + 40 }]}
            >
                {/* Hero */}
                <View style={styles.hero}>
                    <View
                        style={[
                            styles.iconCircle,
                            {
                                backgroundColor: isDark
                                    ? "#22203A"
                                    : "#F0EAFF",
                            },
                        ]}
                    >
                        <ThemedText style={styles.iconEmoji}>📚</ThemedText>
                    </View>
                    <ThemedText
                        style={[
                            styles.appName,
                            { color: isDark ? "#E8E9F0" : "#2D3142" },
                        ]}
                    >
                        AttendBuddy
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.tagline,
                            { color: isDark ? "#6B6F82" : "#9094A6" },
                        ]}
                    >
                        Track attendance effortlessly.{"\n"}Stay on top of your
                        classes.
                    </ThemedText>
                </View>

                {/* Card */}
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDark ? "#1E1F2B" : "#FFFFFF",
                        },
                    ]}
                >
                    <ThemedText style={styles.cardTitle}>
                        Welcome back
                    </ThemedText>
                    <ThemedText
                        style={[
                            styles.cardSubtitle,
                            { color: isDark ? "#6B6F82" : "#9094A6" },
                        ]}
                    >
                        Sign in with your Google account to continue.
                    </ThemedText>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            {
                                backgroundColor: isDark
                                    ? "#9B7FFF"
                                    : "#7C5CFC",
                                opacity: disabled ? 0.6 : 1,
                                transform: [
                                    { scale: pressed && !disabled ? 0.97 : 1 },
                                ],
                            },
                        ]}
                        onPress={handleGoogleSignIn}
                        disabled={disabled}
                    >
                        {disabled ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <MaterialIcons
                                    name="login"
                                    size={20}
                                    color="#ffffff"
                                />
                                <ThemedText style={styles.buttonText}>
                                    Continue with Google
                                </ThemedText>
                            </View>
                        )}
                    </Pressable>

                    {error ? (
                        <ThemedText style={styles.error}>{error}</ThemedText>
                    ) : null}
                </View>

                {/* Footer */}
                <ThemedText
                    style={[
                        styles.footer,
                        { color: isDark ? "#4A4D5E" : "#BFC2D0" },
                    ]}
                >
                    By signing in, you agree to our terms and privacy policy.
                </ThemedText>
            </LinearGradient>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
        paddingHorizontal: Spacing.xxl,
        paddingBottom: Spacing.huge,
        justifyContent: "center",
    },

    /* hero */
    hero: {
        alignItems: "center",
        gap: Spacing.md,
        marginBottom: Spacing.huge,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.sm,
    },
    iconEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: 32,
        fontWeight: "800",
        lineHeight: 38,
    },
    tagline: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center",
    },

    /* card */
    card: {
        borderRadius: Radii.xxl,
        padding: Spacing.xxl,
        gap: Spacing.md,
        ...Shadows.lg,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: "700",
    },
    cardSubtitle: {
        fontSize: 15,
        lineHeight: 22,
    },

    /* button */
    button: {
        marginTop: Spacing.sm,
        borderRadius: Radii.lg,
        minHeight: 52,
        justifyContent: "center",
        alignItems: "center",
        ...Shadows.md,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 16,
    },

    /* error */
    error: {
        color: "#FF6B6B",
        textAlign: "center",
        fontSize: 14,
    },

    /* footer */
    footer: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: "center",
        marginTop: Spacing.xxl,
    },
});
