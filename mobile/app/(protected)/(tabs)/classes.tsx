import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { router } from "expo-router";
import { useThemeColor } from "@/hooks/use-theme-color";

import {
    createClassroom,
    deleteClassroom,
    getUserProfile,
    isClassroomTeacher,
    joinClassroom,
} from "@/lib/api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/providers/auth-provider";
import type { ClassroomSummary } from "@/types/api";

export default function ClassesScreen() {
    const { user, loading } = useAuth();
    const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newClassName, setNewClassName] = useState("");
    const [newClassDescription, setNewClassDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const cardColor = useThemeColor({}, "card");
    const borderColor = useThemeColor({}, "border");
    const textColor = useThemeColor({}, "text");
    const mutedColor = useThemeColor({}, "muted");
    const primaryColor = useThemeColor({}, "primary");
    const dangerColor = useThemeColor({}, "danger");

    const loadClassrooms = useCallback(async () => {
        if (!user) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await getUserProfile(user.id);
            setClassrooms(response.payload.classrooms || []);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load classes",
            );
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadClassrooms();
    }, [loadClassrooms]);

    if (loading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    async function handleCreateClass() {
        if (!newClassName.trim()) {
            setError("Class name is required");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await createClassroom({
                name: newClassName.trim(),
                description: newClassDescription.trim(),
            });
            setNewClassName("");
            setNewClassDescription("");
            await loadClassrooms();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to create class",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleJoinClass() {
        const normalizedCode = joinCode.trim();
        if (!normalizedCode) {
            setError("Class code is required");
            return;
        }

        setError(null);
        setIsSubmitting(true);
        try {
            await joinClassroom(normalizedCode);
            setJoinCode("");
            await loadClassrooms();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to join class",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteClass(code: string) {
        setError(null);
        setIsSubmitting(true);
        try {
            await deleteClassroom(code);
            await loadClassrooms();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to remove class",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">Classes</ThemedText>

            {error ? (
                <View style={[styles.errorCard, { borderColor: dangerColor }]}>
                    <ThemedText style={[styles.error, { color: dangerColor }]}>
                        {error}
                    </ThemedText>
                    <Pressable
                        style={[
                            styles.retryButton,
                            { backgroundColor: primaryColor },
                        ]}
                        onPress={loadClassrooms}
                    >
                        <ThemedText style={styles.retryText}>Retry</ThemedText>
                    </Pressable>
                </View>
            ) : null}

            <View
                style={[
                    styles.formCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                <ThemedText type="subtitle">Create Class</ThemedText>
                <TextInput
                    style={[styles.input, { borderColor, color: textColor }]}
                    placeholder="Class name"
                    placeholderTextColor={mutedColor}
                    value={newClassName}
                    onChangeText={setNewClassName}
                />
                <TextInput
                    style={[styles.input, { borderColor, color: textColor }]}
                    placeholder="Description"
                    placeholderTextColor={mutedColor}
                    value={newClassDescription}
                    onChangeText={setNewClassDescription}
                />
                <Pressable
                    style={[
                        styles.actionButton,
                        { backgroundColor: primaryColor },
                    ]}
                    disabled={isSubmitting}
                    onPress={handleCreateClass}
                >
                    <ThemedText style={styles.actionButtonText}>
                        Create
                    </ThemedText>
                </Pressable>
            </View>

            <View
                style={[
                    styles.formCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                <ThemedText type="subtitle">Join Class</ThemedText>
                <TextInput
                    style={[styles.input, { borderColor, color: textColor }]}
                    placeholder="Class code"
                    placeholderTextColor={mutedColor}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="none"
                />
                <Pressable
                    style={[
                        styles.actionButton,
                        { backgroundColor: primaryColor },
                    ]}
                    disabled={isSubmitting}
                    onPress={handleJoinClass}
                >
                    <ThemedText style={styles.actionButtonText}>
                        Join
                    </ThemedText>
                </Pressable>
            </View>

            <FlatList
                data={classrooms}
                keyExtractor={(item) => item.code}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View
                        style={[
                            styles.emptyCard,
                            { backgroundColor: cardColor, borderColor },
                        ]}
                    >
                        <ThemedText>No classes joined</ThemedText>
                    </View>
                }
                renderItem={({ item }) => {
                    const resolvedRole =
                        item.role ||
                        (item.creatorId === user?.id ? "teacher" : "member");
                    const canDelete =
                        !!user && isClassroomTeacher(item, user.id);

                    return (
                        <View
                            style={[
                                styles.classCard,
                                { backgroundColor: cardColor, borderColor },
                            ]}
                        >
                            <Pressable
                                onPress={() => {
                                    router.push(
                                        `/classroom/${item.code}` as never,
                                    );
                                }}
                            >
                                <ThemedText type="subtitle">
                                    {item.name}
                                </ThemedText>
                                <ThemedText
                                    style={[
                                        styles.description,
                                        { color: mutedColor },
                                    ]}
                                >
                                    {item.description || "No description"}
                                </ThemedText>
                                <ThemedText>Code: {item.code}</ThemedText>
                                <ThemedText>Role: {resolvedRole}</ThemedText>
                                <ThemedText>
                                    Status:{" "}
                                    {item.isActive ? "Active" : "Inactive"}
                                </ThemedText>
                            </Pressable>
                            {canDelete ? (
                                <Pressable
                                    style={[
                                        styles.removeButton,
                                        { borderColor: dangerColor },
                                    ]}
                                    disabled={isSubmitting}
                                    onPress={() => handleDeleteClass(item.code)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.removeButtonText,
                                            { color: dangerColor },
                                        ]}
                                    >
                                        Remove class
                                    </ThemedText>
                                </Pressable>
                            ) : null}
                        </View>
                    );
                }}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 12,
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        gap: 12,
    },
    error: {
        textAlign: "center",
    },
    errorCard: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        gap: 10,
    },
    retryButton: {
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    retryText: {
        color: "#ffffff",
        fontWeight: "700",
    },
    listContent: {
        gap: 12,
        paddingBottom: 16,
    },
    classCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 6,
    },
    description: {
        marginBottom: 2,
    },
    emptyCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 16,
    },
    formCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    actionButton: {
        borderRadius: 10,
        minHeight: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    actionButtonText: {
        color: "#ffffff",
        fontWeight: "700",
    },
    removeButton: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10,
        alignSelf: "flex-start",
        marginTop: 6,
    },
    removeButtonText: {
        fontWeight: "700",
    },
});
