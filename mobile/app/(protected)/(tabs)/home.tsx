import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/providers/auth-provider";
import { getUserProfile } from "@/lib/api";
import {
    ClassAccentColors,
    getClassEmoji,
    Spacing,
    Radii,
    Shadows,
    CONTENT_BOTTOM_PAD,
} from "@/constants/theme";
import type { ClassroomSummary } from "@/types/api";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

function getFormattedDate(): string {
    return new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
    });
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function HomeScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    const cardColor = useThemeColor({}, "card");
    const mutedColor = useThemeColor({}, "muted");
    const primaryColor = useThemeColor({}, "primary");

    const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const accentColors = ClassAccentColors.light;

    /* ---------- data ---------- */

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const response = await getUserProfile(user.id);
            setClassrooms(response.payload.classrooms || []);
        } catch {
            /* home screen degrades gracefully */
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadData();
        setIsRefreshing(false);
    }, [loadData]);

    /* ---------- derived ---------- */

    const greeting = useMemo(() => getGreeting(), []);
    const dateString = useMemo(() => getFormattedDate(), []);
    const firstName = useMemo(
        () => user?.name?.split(" ")[0] || "there",
        [user?.name],
    );
    const teachingCount = useMemo(
        () =>
            classrooms.filter(
                (c) => c.role === "teacher" || c.creatorId === user?.id,
            ).length,
        [classrooms, user?.id],
    );

    /* ---------- skeleton ---------- */

    if (isLoading) {
        return (
            <ThemedView
                style={[styles.container, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.skeletonContent}>
                    <Skeleton width={220} height={32} borderRadius={8} />
                    <Skeleton
                        width={160}
                        height={16}
                        borderRadius={6}
                        style={{ marginTop: 8 }}
                    />
                    <Skeleton
                        height={170}
                        borderRadius={24}
                        style={{ marginTop: 24 }}
                    />
                    <View style={styles.quickActions}>
                        <Skeleton
                            height={80}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                        <Skeleton
                            height={80}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                        <Skeleton
                            height={80}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                    </View>
                    <Skeleton
                        width={130}
                        height={22}
                        borderRadius={6}
                        style={{ marginTop: 8 }}
                    />
                    <View style={styles.classGrid}>
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
                </View>
            </ThemedView>
        );
    }

    /* ---------- render ---------- */

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={primaryColor}
                    />
                }
            >
                {/* ---- Greeting ---- */}
                <View style={styles.header}>
                    <ThemedText style={styles.greeting}>
                        {greeting}, {firstName} 👋
                    </ThemedText>
                    <ThemedText
                        style={[styles.dateText, { color: mutedColor }]}
                    >
                        {dateString}
                    </ThemedText>
                </View>

                <LinearGradient
                    colors={["#C9996B", "#DFB892"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.overviewCard}
                >
                    <View style={styles.overviewContent}>
                        <View style={styles.overviewText}>
                            <ThemedText style={styles.overviewTitle}>
                                Today's Overview
                            </ThemedText>
                            <ThemedText style={styles.overviewSubtitle}>
                                {classrooms.length}{" "}
                                {classrooms.length === 1 ? "class" : "classes"}{" "}
                                enrolled
                            </ThemedText>

                            <View style={styles.overviewStats}>
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {classrooms.length}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Classes
                                    </ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {teachingCount}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Teaching
                                    </ThemedText>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <ThemedText style={styles.statValue}>
                                        {classrooms.length - teachingCount}
                                    </ThemedText>
                                    <ThemedText style={styles.statLabel}>
                                        Enrolled
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                        <View style={styles.overviewVisual}>
                            <ThemedText style={styles.overviewEmoji}>
                                📚
                            </ThemedText>
                        </View>
                    </View>
                </LinearGradient>

                {/* ---- Quick Actions ---- */}
                <View style={styles.quickActions}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.quickAction,
                            {
                                backgroundColor: "#F0EAE3",
                                opacity: pressed ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                        onPress={() =>
                            router.push("/(protected)/(tabs)/classes" as never)
                        }
                    >
                        <ThemedText style={styles.quickActionEmoji}>
                            ➕
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.quickActionLabel,
                                { color: "#C9996B" },
                            ]}
                        >
                            Create
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.quickAction,
                            {
                                backgroundColor: "#E6EBE8",
                                opacity: pressed ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                        onPress={() =>
                            router.push("/(protected)/(tabs)/classes" as never)
                        }
                    >
                        <ThemedText style={styles.quickActionEmoji}>
                            🔗
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.quickActionLabel,
                                { color: "#5C766D" },
                            ]}
                        >
                            Join
                        </ThemedText>
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.quickAction,
                            {
                                backgroundColor: "#F3EAE8",
                                opacity: pressed ? 0.8 : 1,
                                transform: [{ scale: pressed ? 0.95 : 1 }],
                            },
                        ]}
                        onPress={() =>
                            router.push(
                                "/(protected)/(tabs)/timetable" as never,
                            )
                        }
                    >
                        <ThemedText style={styles.quickActionEmoji}>
                            📅
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.quickActionLabel,
                                { color: "#BE7F72" },
                            ]}
                        >
                            Schedule
                        </ThemedText>
                    </Pressable>
                </View>

                {/* ---- Your Classes ---- */}
                <View style={styles.sectionHeader}>
                    <ThemedText style={styles.sectionTitle}>
                        Your Classes
                    </ThemedText>
                    <Pressable
                        onPress={() =>
                            router.push("/(protected)/(tabs)/classes" as never)
                        }
                        hitSlop={12}
                        style={styles.seeAllButton}
                    >
                        <ThemedText
                            style={[styles.seeAll, { color: primaryColor }]}
                        >
                            See all
                        </ThemedText>
                    </Pressable>
                </View>

                {classrooms.length === 0 ? (
                    <View
                        style={[
                            styles.emptyState,
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
                            Create a class or join one with a code to get
                            started
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.classGrid}>
                        {classrooms.slice(0, 6).map((classroom, index) => {
                            const colors =
                                accentColors[index % accentColors.length];
                            const role =
                                classroom.role ||
                                (classroom.creatorId === user?.id
                                    ? "teacher"
                                    : "member");
                            const emoji = getClassEmoji(classroom.name);

                            return (
                                <Pressable
                                    key={classroom.code}
                                    style={({ pressed }) => [
                                        styles.classCard,
                                        {
                                            backgroundColor: colors.bg,
                                            opacity: pressed ? 0.9 : 1,
                                            transform: [
                                                {
                                                    scale: pressed ? 0.97 : 1,
                                                },
                                            ],
                                        },
                                    ]}
                                    onPress={() => {
                                        router.push({
                                            pathname: "/classroom/[code]",
                                            params: {
                                                code: classroom.code,
                                            },
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
                                            <ThemedText
                                                style={styles.classEmoji}
                                            >
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
                                        {classroom.name}
                                    </ThemedText>
                                    <ThemedText
                                        style={[
                                            styles.classDescription,
                                            { color: mutedColor },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {classroom.description ||
                                            "No description"}
                                    </ThemedText>
                                    <View style={styles.classCardFooter}>
                                        <ThemedText
                                            style={[
                                                styles.classCode,
                                                { color: colors.accent },
                                            ]}
                                        >
                                            {classroom.code}
                                        </ThemedText>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* ---- Motivational footer ---- */}
                {classrooms.length > 0 ? (
                    <View
                        style={[
                            styles.motivationCard,
                            { backgroundColor: cardColor },
                        ]}
                    >
                        <ThemedText style={styles.motivationEmoji}>
                            🔥
                        </ThemedText>
                        <ThemedText
                            type="defaultSemiBold"
                            style={{ textAlign: "center" }}
                        >
                            Keep it up!
                        </ThemedText>
                        <ThemedText
                            style={[
                                styles.motivationText,
                                { color: mutedColor },
                            ]}
                        >
                            Tap a class to view attendance details and mark your
                            presence.
                        </ThemedText>
                    </View>
                ) : null}
            </ScrollView>
        </ThemedView>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: CONTENT_BOTTOM_PAD,
        gap: Spacing.xxl,
    },
    skeletonContent: {
        paddingHorizontal: Spacing.xl,
    },

    /* header */
    header: {
        gap: Spacing.xs,
        paddingTop: Spacing.sm,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "600",
        lineHeight: 34,
    },
    dateText: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 20,
    },

    /* overview card */
    overviewCard: {
        borderRadius: Radii.xxl,
        padding: Spacing.xxl,
        ...Shadows.lg,
    },
    overviewContent: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    overviewText: {
        flex: 1,
        gap: Spacing.sm,
    },
    overviewTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    overviewSubtitle: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
    },
    overviewStats: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: Spacing.lg,
        gap: Spacing.lg,
    },
    statItem: {
        alignItems: "center",
    },
    statValue: {
        fontSize: 22,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    statLabel: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "rgba(255,255,255,0.2)",
    },
    overviewVisual: {
        justifyContent: "center",
        alignItems: "center",
        marginLeft: Spacing.md,
    },
    overviewEmoji: {
        fontSize: 52,
    },

    /* quick actions */
    quickActions: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    quickAction: {
        flex: 1,
        borderRadius: Radii.xl,
        paddingVertical: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        minHeight: 80,
    },
    quickActionEmoji: {
        fontSize: 24,
    },
    quickActionLabel: {
        fontSize: 12,
        fontWeight: "600",
    },

    /* section header */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    seeAllButton: {
        minHeight: 44,
        justifyContent: "center",
        paddingLeft: Spacing.sm,
    },
    seeAll: {
        fontSize: 14,
        fontWeight: "500",
    },

    /* class grid */
    classGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.md,
    },
    classCard: {
        width: "48%",
        flexGrow: 1,
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
        gap: Spacing.sm,
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
    classEmoji: {
        fontSize: 22,
    },
    className: {
        fontSize: 15,
        lineHeight: 20,
    },
    classDescription: {
        fontSize: 12,
        lineHeight: 16,
        flex: 1,
    },
    classCardFooter: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: "auto",
    },
    classCode: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.5,
    },

    /* empty state */
    emptyState: {
        borderRadius: Radii.xxl,
        padding: Spacing.xxxl,
        alignItems: "center",
        gap: Spacing.sm,
        ...Shadows.md,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: Spacing.xs,
    },
    emptyText: {
        textAlign: "center",
        fontSize: 14,
        lineHeight: 20,
    },

    /* motivation */
    motivationCard: {
        alignItems: "center",
        gap: Spacing.xs,
        paddingVertical: Spacing.xl,
        borderRadius: Radii.xxl,
        ...Shadows.sm,
    },
    motivationEmoji: {
        fontSize: 32,
        marginBottom: Spacing.xs,
    },
    motivationText: {
        fontSize: 13,
        textAlign: "center",
        lineHeight: 18,
        paddingHorizontal: Spacing.lg,
    },
});
