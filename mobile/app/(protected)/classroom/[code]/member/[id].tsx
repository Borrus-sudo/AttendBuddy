import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Spacing, Radii, CONTENT_BOTTOM_PAD } from "@/constants/theme";
import { formatSessionLabel, getMemberAttendanceAnalytics } from "@/lib/api";
import type { MemberAttendanceAnalytics } from "@/types/api";

function normalize(value: string | string[] | undefined): string {
    if (!value) {
        return "";
    }
    return Array.isArray(value) ? value[0] || "" : value;
}

export default function MemberDetailScreen() {
    const params = useLocalSearchParams<{ code: string; id: string }>();
    const classroomCode = normalize(params.code);
    const memberId = normalize(params.id);

    const muted = useThemeColor({}, "muted");
    const danger = useThemeColor({}, "danger");

    const [analytics, setAnalytics] =
        useState<MemberAttendanceAnalytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!classroomCode || !memberId) {
            setError("Missing member route params.");
            setIsLoading(false);
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const response = await getMemberAttendanceAnalytics(
                classroomCode,
                memberId,
            );
            setAnalytics(response);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not load member analytics.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [classroomCode, memberId]);

    useEffect(() => {
        load();
    }, [load]);

    const percentageColor = useMemo(() => {
        if (!analytics) {
            return "#64748b";
        }
        if (analytics.percentage >= 80) {
            return "#22c55e";
        }
        if (analytics.percentage >= 60) {
            return "#eab308";
        }
        return "#ef4444";
    }, [analytics]);

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (!analytics || error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={{ color: danger }}>
                    {error || "Member analytics unavailable."}
                </ThemedText>
                <AppButton label="Retry" onPress={load} />
            </ThemedView>
        );
    }

    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
            <ScreenHeader
                showBack
                title={analytics.member.name}
                subtitle={analytics.member.email}
            />

            <AppCard>
                <ThemedText type="defaultSemiBold">
                    Attendance overview
                </ThemedText>
                <ProgressBar
                    label="Attendance"
                    value={analytics.presentCount}
                    max={Math.max(1, analytics.totalSessions)}
                    color={percentageColor}
                />

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNumber}>
                            {analytics.totalSessions}
                        </ThemedText>
                        <ThemedText style={{ color: muted }}>
                            Total sessions
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNumber}>
                            {analytics.presentCount}
                        </ThemedText>
                        <ThemedText style={{ color: muted }}>
                            Present
                        </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNumber}>
                            {analytics.absentCount}
                        </ThemedText>
                        <ThemedText style={{ color: muted }}>Absent</ThemedText>
                    </View>
                    <View style={styles.statItem}>
                        <ThemedText style={styles.statNumber}>
                            {analytics.percentage}%
                        </ThemedText>
                        <ThemedText style={{ color: muted }}>Score</ThemedText>
                    </View>
                </View>
            </AppCard>

            <FlatList
                data={analytics.recent}
                keyExtractor={(item) => item.sessionId}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <ThemedText type="defaultSemiBold">
                        Recent sessions
                    </ThemedText>
                }
                ListEmptyComponent={
                    <AppCard>
                        <ThemedText>No attendance records yet.</ThemedText>
                    </AppCard>
                }
                renderItem={({ item }) => (
                    <AppCard style={styles.recentCard}>
                        <View style={styles.recentRow}>
                            <ThemedText style={{ color: muted }}>
                                {formatSessionLabel(item.createdAt)}
                            </ThemedText>
                            <StatusPill
                                label={
                                    item.status === "present"
                                        ? "Present"
                                        : "Absent"
                                }
                                tone={
                                    item.status === "present"
                                        ? "success"
                                        : "danger"
                                }
                            />
                        </View>
                    </AppCard>
                )}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
        gap: Spacing.lg,
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    statsGrid: {
        marginTop: Spacing.md,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: Spacing.sm,
    },
    statItem: {
        width: "48%",
        borderRadius: Radii.lg,
        padding: Spacing.md,
        backgroundColor: "rgba(51, 65, 85, 0.3)",
        gap: 2,
    },
    statNumber: {
        fontSize: 19,
        lineHeight: 24,
        fontWeight: "700",
    },
    listContent: {
        gap: Spacing.md,
        paddingBottom: CONTENT_BOTTOM_PAD,
    },
    recentCard: {
        paddingVertical: Spacing.md,
    },
    recentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.md,
    },
});
