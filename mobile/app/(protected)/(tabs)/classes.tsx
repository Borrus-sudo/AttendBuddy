import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useThemeColor } from "@/hooks/use-theme-color";

import { createClassroom, getUserProfile, joinClassroom } from "@/lib/api";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppModal } from "@/components/ui/app-modal";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusPill } from "@/components/ui/status-pill";
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
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [joinModalVisible, setJoinModalVisible] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newClassDescription, setNewClassDescription] = useState("");
    const [joinCode, setJoinCode] = useState("");

    const mutedColor = useThemeColor({}, "muted");
    const dangerColor = useThemeColor({}, "danger");
    const primaryColor = useThemeColor({}, "primary");

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
            setCreateModalVisible(false);
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
            setJoinModalVisible(false);
            await loadClassrooms();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to join class",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    const classCountLabel = useMemo(
        () =>
            `${classrooms.length} ${classrooms.length === 1 ? "class" : "classes"}`,
        [classrooms.length],
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScreenHeader
                title="Classes"
                subtitle={classCountLabel}
                rightSlot={
                    <>
                        <AppButton
                            label="Create"
                            variant="secondary"
                            onPress={() => {
                                setError(null);
                                setCreateModalVisible(true);
                            }}
                            leftIcon={
                                <MaterialIcons
                                    name="add"
                                    size={16}
                                    color={primaryColor}
                                />
                            }
                        />
                        <AppButton
                            label="Join"
                            variant="secondary"
                            onPress={() => {
                                setError(null);
                                setJoinModalVisible(true);
                            }}
                            leftIcon={
                                <MaterialIcons
                                    name="link"
                                    size={15}
                                    color={primaryColor}
                                />
                            }
                        />
                    </>
                }
            />

            {error ? (
                <AppCard
                    style={[styles.errorCard, { borderColor: dangerColor }]}
                >
                    <ThemedText style={[styles.error, { color: dangerColor }]}>
                        {error}
                    </ThemedText>
                    <AppButton label="Retry" onPress={loadClassrooms} />
                </AppCard>
            ) : null}

            <FlatList
                data={classrooms}
                keyExtractor={(item) => item.code}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <AppCard style={styles.emptyCard}>
                        <ThemedText type="defaultSemiBold">
                            No classes yet
                        </ThemedText>
                        <ThemedText style={{ color: mutedColor }}>
                            Create one or join with a class code.
                        </ThemedText>
                    </AppCard>
                }
                renderItem={({ item, index }) => {
                    const role =
                        item.role ||
                        (item.creatorId === user?.id ? "teacher" : "member");

                    return (
                        <View
                            style={[
                                styles.gridItem,
                                index % 2 === 0 ? styles.gridItemLeft : null,
                            ]}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    styles.cardPress,
                                    {
                                        opacity: pressed ? 0.95 : 1,
                                        transform: [
                                            { scale: pressed ? 0.985 : 1 },
                                        ],
                                    },
                                ]}
                                onPress={() => {
                                    router.push({
                                        pathname: "/classroom/[code]",
                                        params: { code: item.code },
                                    } as never);
                                }}
                            >
                                <AppCard
                                    style={styles.classCard}
                                    padded={false}
                                >
                                    <View style={styles.classBody}>
                                        <View style={styles.classTopRow}>
                                            <ThemedText
                                                type="defaultSemiBold"
                                                numberOfLines={2}
                                            >
                                                {item.name}
                                            </ThemedText>
                                            <StatusPill
                                                label={
                                                    role === "teacher"
                                                        ? "Teacher"
                                                        : "Student"
                                                }
                                                tone={
                                                    role === "teacher"
                                                        ? "success"
                                                        : "muted"
                                                }
                                            />
                                        </View>

                                        <ThemedText
                                            style={[
                                                styles.description,
                                                { color: mutedColor },
                                            ]}
                                            numberOfLines={3}
                                        >
                                            {item.description ||
                                                "No description yet."}
                                        </ThemedText>

                                        <View style={styles.classFooter}>
                                            <ThemedText
                                                style={{ color: mutedColor }}
                                            >
                                                {item.code}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </AppCard>
                            </Pressable>
                        </View>
                    );
                }}
            />

            <AppModal
                visible={createModalVisible}
                title="Create class"
                onClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalBody}>
                    <AppInput
                        label="Class name"
                        value={newClassName}
                        onChangeText={setNewClassName}
                        placeholder="e.g. DSA Semester 2"
                    />
                    <AppInput
                        label="Description"
                        value={newClassDescription}
                        onChangeText={setNewClassDescription}
                        placeholder="A quick description"
                        multiline
                    />
                    <AppButton
                        label="Create Class"
                        loading={isSubmitting}
                        onPress={handleCreateClass}
                    />
                </View>
            </AppModal>

            <AppModal
                visible={joinModalVisible}
                title="Join class"
                onClose={() => setJoinModalVisible(false)}
            >
                <View style={styles.modalBody}>
                    <AppInput
                        label="Class code"
                        value={joinCode}
                        onChangeText={setJoinCode}
                        autoCapitalize="none"
                        placeholder="Paste invite code"
                    />
                    <AppButton
                        label="Join Class"
                        loading={isSubmitting}
                        onPress={handleJoinClass}
                    />
                </View>
            </AppModal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 14,
        gap: 14,
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
        padding: 12,
    },
    listContent: {
        gap: 10,
        paddingBottom: 16,
        minHeight: "100%",
    },
    columnWrapper: {
        gap: 10,
    },
    gridItem: {
        flex: 1,
        maxWidth: "50%",
    },
    gridItemLeft: {
        paddingRight: 0,
    },
    cardPress: {
        borderRadius: 16,
    },
    classCard: {
        minHeight: 170,
    },
    classBody: {
        padding: 12,
        gap: 10,
        flex: 1,
    },
    classTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        minHeight: 54,
    },
    classFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: "auto",
    },
    emptyCard: {
        marginTop: 18,
        gap: 6,
    },
    modalBody: {
        gap: 12,
    },
});
