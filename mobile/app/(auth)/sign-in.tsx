import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { signIn } from "@/lib/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import { isWeb } from "@/lib/config";

export default function SignInScreen() {
    const { user, loading } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                callbackURL: isWeb
                    ? "http://localhost:8081/profile"
                    : "/profile",
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
            <View style={styles.card}>
                <ThemedText type="title" style={styles.title}>
                    AttendBuddy
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                    Sign in with your Google account to continue.
                </ThemedText>

                <Pressable
                    style={[
                        styles.button,
                        disabled ? styles.buttonDisabled : undefined,
                    ]}
                    onPress={handleGoogleSignIn}
                    disabled={disabled}
                >
                    {disabled ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <ThemedText style={styles.buttonText}>
                            Continue with Google
                        </ThemedText>
                    )}
                </Pressable>

                {error ? (
                    <ThemedText style={styles.error}>{error}</ThemedText>
                ) : null}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },
    card: {
        borderWidth: 1,
        borderColor: "#d2d6db",
        borderRadius: 16,
        padding: 20,
        gap: 12,
        backgroundColor: "#ffffff",
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 16,
        color: "#4b5563",
    },
    button: {
        marginTop: 8,
        borderRadius: 12,
        backgroundColor: "#0b5fff",
        minHeight: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.65,
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
    },
    error: {
        color: "#b00020",
    },
});
