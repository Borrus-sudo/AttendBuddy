import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    useWindowDimensions,
    View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { createClassroom, getUserProfile, joinClassroom } from "@/lib/api";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppModal } from "@/components/ui/app-modal";
import { StatusPill } from "@/components/ui/status-pill";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { useAuth } from "@/providers/auth-provider";
import {
    ClassAccentColors,
    getClassEmoji,
    Spacing,
    Radii,
    Shadows,
    CONTENT_BOTTOM_PAD,
} from "@/constants/theme";
import type { ClassroomSummary } from "@/types/api";

export default function ClassesScreen() {
    const { user, loading } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const { width, height } = useWindowDimensions();
    const isSmallScreen = width < 460;
    const cardMinHeight = isSmallScreen ? Math.max(188, height * 0.28) : 200;

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
    const cardColor = useThemeColor({}, "card");

    const accentColors = ClassAccentColors.light;

    /* ---------- data ---------- */

    const loadClassrooms = useCallback(async () => {
        if (!user) return;
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

    /* ---------- skeleton ---------- */

    if (isLoading) {
        return (
            <ThemedView
                style={[styles.container, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.header}>
                    <Skeleton width={150} height={32} borderRadius={8} />
                    <Skeleton
                        width={100}
                        height={16}
                        borderRadius={6}
                        style={{ marginTop: 6 }}
                    />
                </View>
                <View style={styles.headerButtons}>
                    <Skeleton width={90} height={42} borderRadius={12} />
                    <Skeleton width={80} height={42} borderRadius={12} />
                </View>
                <View style={styles.columnWrapper}>
                    <Skeleton
                        height={200}
                        borderRadius={24}
                        style={{ flex: 1 }}
                    />
                    <Skeleton
                        height={200}
                        borderRadius={24}
                        style={{ flex: 1 }}
                    />
                </View>
                <View style={styles.columnWrapper}>
                    <Skeleton
                        height={200}
                        borderRadius={24}
                        style={{ flex: 1 }}
                    />
                    <Skeleton
                        height={200}
                        borderRadius={24}
                        style={{ flex: 1 }}
                    />
                </View>
            </ThemedView>
        );
    }

    /* ---------- render ---------- */

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
            {/* Header */}
            <View style={styles.headerRow}>
                <View>
                    <ThemedText style={styles.titleText}>My Classes</ThemedText>
                    <ThemedText
                        style={[styles.subtitleText, { color: mutedColor }]}
                    >
                        {classCountLabel}
                    </ThemedText>
                </View>
                <View style={styles.headerButtons}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionChip,
                            {
                                backgroundColor: "rgba(201, 153, 107, 0.15)",
                                opacity: pressed ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                        onPress={() => {
                            setError(null);
                            setCreateModalVisible(true);
                        }}
                    >
                        <MaterialIcons
                            name="add"
                            size={16}
                            color={primaryColor}
                        />
                        <ThemedText
                            style={[
                                styles.actionChipLabel,
                                { color: primaryColor },
                            ]}
                        >
                            Create
                        </ThemedText>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                            styles.actionChip,
                            {
                                backgroundColor: "rgba(92, 118, 109, 0.15)",
                                opacity: pressed ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                        onPress={() => {
                            setError(null);
                            setJoinModalVisible(true);
                        }}
                    >
                        <MaterialIcons name="link" size={15} color="#5C766D" />
                        <ThemedText
                            style={[
                                styles.actionChipLabel,
                                { color: "#5C766D" },
                            ]}
                        >
                            Join
                        </ThemedText>
                    </Pressable>
                </View>
            </View>

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
                key={isSmallScreen ? "single-column" : "two-column"}
                numColumns={isSmallScreen ? 1 : 2}
                columnWrapperStyle={
                    isSmallScreen ? undefined : styles.columnWrapper
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View
                        style={[
                            styles.emptyCard,
                            { backgroundColor: cardColor },
                        ]}
                    >
                        <ThemedText style={styles.emptyEmoji}>📭</ThemedText>
                        <ThemedText type="defaultSemiBold">
                            No classes yet
                        </ThemedText>
                        <ThemedText
                            style={[styles.emptyText, { color: mutedColor }]}
                        >
                            Create one or join with a class code.
                        </ThemedText>
                    </View>
                }
                renderItem={({ item, index }) => {
                    const role =
                        item.role ||
                        (item.creatorId === user?.id ? "teacher" : "member");
                    const colors = accentColors[index % accentColors.length];
                    const emoji = getClassEmoji(item.name);

                    return (
                        <View
                            style={[
                                styles.gridItem,
                                isSmallScreen ? styles.gridItemSingle : null,
                                !isSmallScreen && index % 2 === 0
                                    ? styles.gridItemLeft
                                    : null,
                            ]}
                        >
                            <Pressable
                                style={({ pressed }) => [
                                    styles.classCard,
                                    { minHeight: cardMinHeight },
                                    {
                                        backgroundColor: colors.bg,
                                        opacity: pressed ? 0.9 : 1,
                                        transform: [
                                            { scale: pressed ? 0.97 : 1 },
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
                                <View style={styles.classCardHeader}>
                                    <View
                                        style={[
                                            styles.emojiCircle,
                                            {
                                                backgroundColor:
                                                    colors.accent + "20",
                                            },
                                        ]}
                                    >
                                        <ThemedText style={styles.emoji}>
                                            {emoji}
                                        </ThemedText>
                                    </View>
                                    <StatusPill
                                        label={
                                            role === "teacher"
                                                ? "Teacher"
                                                : "Student"
                                        }
                                        tone={
                                            role === "teacher"
                                                ? "primary"
                                                : "muted"
                                        }
                                    />
                                </View>

                                <ThemedText
                                    type="defaultSemiBold"
                                    numberOfLines={2}
                                    style={styles.className}
                                >
                                    {item.name}
                                </ThemedText>

                                <ThemedText
                                    style={[
                                        styles.description,
                                        { color: mutedColor },
                                    ]}
                                    numberOfLines={3}
                                >
                                    {item.description || "No description yet."}
                                </ThemedText>

                                <View style={styles.classFooter}>
                                    <ThemedText
                                        style={[
                                            styles.codeText,
                                            { color: colors.accent },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.code.length > 8
                                            ? `${item.code.slice(0, 3)}...${item.code.slice(-2)}`
                                            : item.code}
                                    </ThemedText>
                                </View>
                            </Pressable>
                        </View>
                    );
                }}
            />

            {/* ---- Modals ---- */}

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

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        gap: Spacing.lg,
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: Spacing.xl,
        gap: Spacing.md,
    },

    /* header */
    header: { gap: Spacing.xs },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: Spacing.md,
        paddingHorizontal: Spacing.xs,
    },
    titleText: {
        fontSize: 28,
        fontWeight: "600",
        lineHeight: 34,
    },
    subtitleText: {
        fontSize: 14,
        marginTop: 2,
    },
    headerButtons: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    actionChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radii.lg,
        minHeight: 44,
    },
    actionChipLabel: {
        fontSize: 13,
        fontWeight: "600",
    },

    /* error */
    error: { textAlign: "center" },
    errorCard: { padding: Spacing.md },

    /* grid */
    listContent: {
        gap: Spacing.md,
        paddingBottom: CONTENT_BOTTOM_PAD,
        minHeight: "100%",
    },
    columnWrapper: {
        gap: Spacing.md,
    },
    gridItem: {
        flex: 1,
        maxWidth: "50%",
    },
    gridItemSingle: {
        maxWidth: "100%",
    },
    gridItemLeft: {
        paddingRight: 0,
    },

    /* class card */
    classCard: {
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
        gap: Spacing.md,
        minHeight: 200,
        ...Shadows.sm,
    },
    classCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    emojiCircle: {
        width: 44,
        height: 44,
        borderRadius: Radii.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    emoji: { fontSize: 22 },
    className: { fontSize: 15, lineHeight: 20 },
    description: {
        fontSize: 12,
        lineHeight: 18,
        minHeight: 40,
    },
    classFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: "auto",
    },
    codeText: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
    },

    /* empty */
    emptyCard: {
        marginTop: Spacing.xl,
        borderRadius: Radii.xxl,
        padding: Spacing.xxxl,
        alignItems: "center",
        gap: Spacing.sm,
        ...Shadows.md,
    },
    emptyEmoji: { fontSize: 48, marginBottom: Spacing.xs },
    emptyText: { textAlign: "center", fontSize: 14, lineHeight: 20 },

    /* modals */
    modalBody: { gap: Spacing.md },
});
