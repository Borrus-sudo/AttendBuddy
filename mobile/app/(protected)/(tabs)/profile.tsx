import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { signOut } from "@/lib/auth";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppCard } from "@/components/ui/app-card";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Skeleton } from "@/components/ui/skeleton-loader";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "@/providers/auth-provider";
import { getClassroomSessions, getUserProfile } from "@/lib/api";
import {
    ClassAccentColors,
    getClassEmoji,
    Spacing,
    Radii,
    Shadows,
    CONTENT_BOTTOM_PAD,
} from "@/constants/theme";
import type { ClassroomSummary } from "@/types/api";

type ClassroomMetric = {
    studentAttendancePct?: number;
    teacherSessionCount?: number;
};

export default function ProfileScreen() {
    const { user, loading } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();

    const cardColor = useThemeColor({}, "card");
    const mutedColor = useThemeColor({}, "muted");
    const primaryColor = useThemeColor({}, "primary");

    const accentColors = ClassAccentColors.light;

    const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
    const [classroomMetrics, setClassroomMetrics] = useState<
        Record<string, ClassroomMetric>
    >({});
    const [isLoading, setIsLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const response = await getUserProfile(user.id);
            const userClassrooms = response.payload.classrooms || [];
            setClassrooms(userClassrooms);

            const metricEntries = await Promise.all(
                userClassrooms.map(async (classroom) => {
                    try {
                        const role =
                            classroom.role ||
                            (classroom.creatorId === user.id
                                ? "teacher"
                                : "member");
                        const sessions = await getClassroomSessions(
                            classroom.code,
                        );

                        if (role === "teacher" || role === "creator") {
                            const teacherSessionCount = sessions.filter(
                                (session) =>
                                    session.createdByUserId === user.id,
                            ).length;

                            return [
                                classroom.code,
                                {
                                    teacherSessionCount,
                                } satisfies ClassroomMetric,
                            ] as const;
                        }

                        const markedSessions = sessions.filter(
                            (session) =>
                                session.status === "present" ||
                                session.status === "absent",
                        );
                        const presentCount = markedSessions.filter(
                            (session) => session.status === "present",
                        ).length;
                        const studentAttendancePct =
                            markedSessions.length > 0
                                ? Math.round(
                                      (presentCount / markedSessions.length) *
                                          100,
                                  )
                                : 0;

                        return [
                            classroom.code,
                            {
                                studentAttendancePct,
                            } satisfies ClassroomMetric,
                        ] as const;
                    } catch {
                        return [
                            classroom.code,
                            {} satisfies ClassroomMetric,
                        ] as const;
                    }
                }),
            );

            setClassroomMetrics(Object.fromEntries(metricEntries));
        } catch {
            /* degrade gracefully */
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading || !user) return null;

    const teachingCount = classrooms.filter(
        (c) => c.role === "teacher" || c.creatorId === user.id,
    ).length;

    /* ---------- skeleton ---------- */

    if (isLoading) {
        return (
            <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
                <Skeleton height={220} borderRadius={0} />
                <View style={styles.bodyPadding}>
                    <View style={styles.statsRow}>
                        <Skeleton
                            height={88}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                        <Skeleton
                            height={88}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                        <Skeleton
                            height={88}
                            borderRadius={20}
                            style={{ flex: 1 }}
                        />
                    </View>
                    <Skeleton width={130} height={22} borderRadius={6} />
                    <Skeleton height={64} borderRadius={20} />
                    <Skeleton height={64} borderRadius={20} />
                </View>
            </ThemedView>
        );
    }

    /* ---------- render ---------- */

    return (
        <ThemedView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ---- Gradient Header ---- */}
                <LinearGradient
                    colors={["#C9996B", "#DFB892"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.headerGradient,
                        { paddingTop: insets.top + 32 },
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
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <ThemedText style={styles.avatarInitial}>
                                {user.name?.charAt(0)?.toUpperCase() || "?"}
                            </ThemedText>
                        </View>
                    )}
                    <ThemedText style={styles.userName}>{user.name}</ThemedText>
                    <ThemedText style={styles.userEmail}>
                        {user.email}
                    </ThemedText>
                </LinearGradient>

                {/* ---- Stats Row ---- */}
                <View style={styles.bodyPadding}>
                    <View style={styles.statsRow}>
                        <View
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor:
                                        "rgba(201, 153, 107, 0.15)",
                                },
                            ]}
                        >
                            <ThemedText style={styles.statEmoji}>📚</ThemedText>
                            <ThemedText
                                style={[
                                    styles.statNumber,
                                    { color: primaryColor },
                                ]}
                            >
                                {classrooms.length}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.statCaption,
                                    { color: mutedColor },
                                ]}
                            >
                                Total
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: "rgba(92, 118, 109, 0.15)",
                                },
                            ]}
                        >
                            <ThemedText style={styles.statEmoji}>📝</ThemedText>
                            <ThemedText
                                style={[
                                    styles.statNumber,
                                    { color: "#5C766D" },
                                ]}
                            >
                                {teachingCount}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.statCaption,
                                    { color: mutedColor },
                                ]}
                            >
                                Teaching
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor:
                                        "rgba(142, 130, 121, 0.15)",
                                },
                            ]}
                        >
                            <ThemedText style={styles.statEmoji}>📖</ThemedText>
                            <ThemedText
                                style={[
                                    styles.statNumber,
                                    { color: "#8E8279" },
                                ]}
                            >
                                {classrooms.length - teachingCount}
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.statCaption,
                                    { color: mutedColor },
                                ]}
                            >
                                Enrolled
                            </ThemedText>
                        </View>
                    </View>

                    {/* ---- Your Classes ---- */}
                    <ThemedText style={styles.sectionTitle}>
                        Your Classes
                    </ThemedText>

                    {classrooms.length === 0 ? (
                        <View
                            style={[
                                styles.emptyCard,
                                { backgroundColor: cardColor },
                            ]}
                        >
                            <ThemedText style={styles.emptyEmoji}>
                                📭
                            </ThemedText>
                            <ThemedText type="defaultSemiBold">
                                No classes yet
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.classList}>
                            {classrooms.map((classroom, index) => {
                                const colors =
                                    accentColors[index % accentColors.length];
                                const emoji = getClassEmoji(classroom.name);
                                const role =
                                    classroom.role ||
                                    (classroom.creatorId === user.id
                                        ? "teacher"
                                        : "member");
                                const metric = classroomMetrics[classroom.code];

                                const roleMetricLabel =
                                    role === "teacher" || role === "creator"
                                        ? `Sessions taken: ${metric?.teacherSessionCount ?? 0}`
                                        : `Attendance: ${metric?.studentAttendancePct ?? 0}%`;
                                return (
                                    <Pressable
                                        key={classroom.code}
                                        onPress={() => {
                                            router.push({
                                                pathname: "/classroom/[code]",
                                                params: {
                                                    code: classroom.code,
                                                },
                                            } as never);
                                        }}
                                        style={({ pressed }) => [
                                            styles.classItem,
                                            {
                                                backgroundColor: cardColor,
                                                opacity: pressed ? 0.85 : 1,
                                                transform: [
                                                    {
                                                        scale: pressed
                                                            ? 0.98
                                                            : 1,
                                                    },
                                                ],
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.classItemEmoji,
                                                {
                                                    backgroundColor: colors.bg,
                                                },
                                            ]}
                                        >
                                            <ThemedText
                                                style={{ fontSize: 20 }}
                                            >
                                                {emoji}
                                            </ThemedText>
                                        </View>
                                        <View style={styles.classItemText}>
                                            <ThemedText
                                                type="defaultSemiBold"
                                                numberOfLines={1}
                                            >
                                                {classroom.name}
                                            </ThemedText>
                                            <ThemedText
                                                style={{
                                                    color: mutedColor,
                                                    fontSize: 13,
                                                }}
                                            >
                                                {role === "teacher"
                                                    ? "Teaching"
                                                    : "Student"}{" "}
                                                · {classroom.code}
                                            </ThemedText>
                                            <ThemedText
                                                style={{
                                                    color: mutedColor,
                                                    fontSize: 12,
                                                }}
                                            >
                                                {roleMetricLabel}
                                            </ThemedText>
                                        </View>
                                        <MaterialIcons
                                            name="chevron-right"
                                            size={22}
                                            color={mutedColor}
                                        />
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}

                    {/* ---- Settings ---- */}
                    <ThemedText style={styles.sectionTitle}>
                        Settings
                    </ThemedText>

                    <View
                        style={[
                            styles.settingsGroup,
                            { backgroundColor: cardColor },
                        ]}
                    >
                        <View style={styles.settingsItem}>
                            <View
                                style={[
                                    styles.settingsIcon,
                                    {
                                        backgroundColor:
                                            "rgba(201, 153, 107, 0.15)",
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name="notifications-none"
                                    size={20}
                                    color={primaryColor}
                                />
                            </View>
                            <ThemedText style={styles.settingsLabel}>
                                Notifications
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.settingsHint,
                                    { color: mutedColor },
                                ]}
                            >
                                Coming soon
                            </ThemedText>
                        </View>

                        <View style={styles.settingsDivider} />

                        <View style={styles.settingsItem}>
                            <View
                                style={[
                                    styles.settingsIcon,
                                    {
                                        backgroundColor:
                                            "rgba(92, 118, 109, 0.15)",
                                    },
                                ]}
                            >
                                <MaterialIcons
                                    name="info-outline"
                                    size={20}
                                    color="#5C766D"
                                />
                            </View>
                            <ThemedText style={styles.settingsLabel}>
                                About Attend Buddy
                            </ThemedText>
                            <ThemedText
                                style={[
                                    styles.settingsHint,
                                    { color: mutedColor },
                                ]}
                            >
                                v1.0.0
                            </ThemedText>
                        </View>
                    </View>

                    {/* ---- Sign Out ---- */}
                    <Pressable
                        style={({ pressed }) => [
                            styles.signOutButton,
                            {
                                backgroundColor: "rgba(229, 62, 62, 0.15)",
                                opacity: pressed ? 0.85 : 1,
                                transform: [{ scale: pressed ? 0.98 : 1 }],
                            },
                        ]}
                        onPress={() => {
                            void signOut();
                        }}
                    >
                        <MaterialIcons
                            name="logout"
                            size={18}
                            color="#E53E3E"
                        />
                        <ThemedText
                            style={[styles.signOutText, { color: "#E53E3E" }]}
                        >
                            Sign out
                        </ThemedText>
                    </Pressable>
                </View>
            </ScrollView>
        </ThemedView>
    );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: CONTENT_BOTTOM_PAD },
    bodyPadding: {
        paddingHorizontal: Spacing.xl,
        gap: Spacing.xl,
        marginTop: Spacing.xxl,
    },

    /* header gradient */
    headerGradient: {
        paddingBottom: Spacing.xxxl,
        alignItems: "center",
        gap: Spacing.sm,
        borderBottomLeftRadius: Radii.xxxl,
        borderBottomRightRadius: Radii.xxxl,
    },
    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        marginBottom: Spacing.md,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.35)",
    },
    avatarPlaceholder: {
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    avatarInitial: {
        fontSize: 34,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    userName: {
        fontSize: 22,
        fontWeight: "600",
        color: "#FFFFFF",
    },
    userEmail: {
        fontSize: 14,
        color: "rgba(255,255,255,0.75)",
    },

    /* stats */
    statsRow: {
        flexDirection: "row",
        gap: Spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: Radii.xl,
        paddingVertical: Spacing.lg,
        alignItems: "center",
        gap: 2,
    },
    statEmoji: { fontSize: 20 },
    statNumber: {
        fontSize: 22,
        fontWeight: "600",
    },
    statCaption: {
        fontSize: 11,
        fontWeight: "600",
    },

    /* section */
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
    },

    /* classes */
    classList: { gap: Spacing.md },
    classItem: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: Radii.xl,
        padding: Spacing.lg,
        gap: Spacing.lg,
        minHeight: 68,
        ...Shadows.sm,
    },
    classItemEmoji: {
        width: 46,
        height: 46,
        borderRadius: Radii.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    classItemText: { flex: 1, gap: 2 },

    /* empty */
    emptyCard: {
        borderRadius: Radii.xxl,
        padding: Spacing.xxl,
        alignItems: "center",
        gap: Spacing.sm,
        ...Shadows.sm,
    },
    emptyEmoji: { fontSize: 36 },

    /* settings */
    settingsGroup: {
        borderRadius: Radii.xxl,
        padding: Spacing.xs,
        ...Shadows.sm,
    },
    settingsItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        minHeight: 56,
    },
    settingsIcon: {
        width: 36,
        height: 36,
        borderRadius: Radii.md,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsDivider: {
        height: 1,
        backgroundColor: "rgba(128, 128, 128, 0.1)",
        marginHorizontal: Spacing.md,
    },
    settingsLabel: {
        flex: 1,
        fontSize: 15,
    },
    settingsHint: {
        fontSize: 13,
    },

    /* sign out */
    signOutButton: {
        borderRadius: Radii.xl,
        minHeight: 56,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: Spacing.sm,
    },
    signOutText: {
        fontWeight: "600",
        fontSize: 15,
    },
});
