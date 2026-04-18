import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppListItem } from "@/components/ui/app-list-item";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    formatSessionLabel,
    getAttendanceSessionDetail,
    setAttendancePresence,
} from "@/lib/api";
import type {
    AttendanceMemberStatus,
    AttendanceSessionDetailPayload,
} from "@/types/api";

function paramAsString(value: string | string[] | undefined): string {
    if (!value) {
        return "";
    }
    return Array.isArray(value) ? value[0] || "" : value;
}

export default function SessionDetailScreen() {
    const params = useLocalSearchParams<{ code: string; id: string }>();
    const classroomCode = paramAsString(params.code);
    const sessionId = paramAsString(params.id);

    const primary = useThemeColor({}, "primary");
    const muted = useThemeColor({}, "muted");
    const danger = useThemeColor({}, "danger");

    const [data, setData] = useState<AttendanceSessionDetailPayload | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!classroomCode || !sessionId) {
            setError("Missing route params.");
            setIsLoading(false);
            return;
        }

        setError(null);
        setIsLoading(true);
        try {
            const response = await getAttendanceSessionDetail(
                classroomCode,
                sessionId,
            );
            setData(response);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not load session.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [classroomCode, sessionId]);

    useEffect(() => {
        load();
    }, [load]);

    const attendanceStats = useMemo(() => {
        if (!data) {
            return { present: 0, absent: 0, total: 0 };
        }

        const present = data.members.filter((item) => item.isPresent).length;
        const total = data.members.length;
        return {
            present,
            absent: total - present,
            total,
        };
    }, [data]);

    const handleToggle = useCallback(
        async (member: AttendanceMemberStatus, nextPresent: boolean) => {
            if (!data) {
                return;
            }

            const previousMembers = data.members;
            setData({
                ...data,
                members: data.members.map((item) =>
                    item.userId === member.userId
                        ? {
                              ...item,
                              isPresent: nextPresent,
                              markedAt: new Date().toISOString(),
                          }
                        : item,
                ),
            });

            setError(null);
            setIsSaving(true);

            try {
                await setAttendancePresence({
                    attendanceSessionId: sessionId,
                    studentUserId: member.userId,
                    isPresent: nextPresent,
                });
            } catch (err) {
                setData({ ...data, members: previousMembers });
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to save attendance update.",
                );
            } finally {
                setIsSaving(false);
            }
        },
        [data, sessionId],
    );

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (!data || error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={{ color: danger }}>
                    {error || "Session unavailable."}
                </ThemedText>
                <AppButton label="Retry" onPress={load} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScreenHeader
                title="Session Detail"
                subtitle={formatSessionLabel(data.session.createdAt)}
                rightSlot={
                    <StatusPill
                        label={data.session.isClosed ? "Closed" : "Open"}
                        tone={data.session.isClosed ? "danger" : "success"}
                    />
                }
            />

            <AppCard>
                <View style={styles.statsRow}>
                    <ThemedText style={{ color: muted }}>
                        Present: {attendanceStats.present}
                    </ThemedText>
                    <ThemedText style={{ color: muted }}>
                        Absent: {attendanceStats.absent}
                    </ThemedText>
                    <ThemedText style={{ color: muted }}>
                        Total: {attendanceStats.total}
                    </ThemedText>
                </View>
                <ThemedText style={{ color: muted }}>
                    {isSaving
                        ? "Syncing latest attendance updates..."
                        : "Changes are saved immediately."}
                </ThemedText>
            </AppCard>

            <FlatList
                data={data.members}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <AppCard>
                        <ThemedText>
                            No students found for this session.
                        </ThemedText>
                    </AppCard>
                }
                renderItem={({ item }) => (
                    <AppListItem
                        title={item.name}
                        subtitle={item.email}
                        avatarUri={item.image}
                        rightSlot={
                            <View style={styles.toggleSide}>
                                <StatusPill
                                    label={
                                        item.isPresent ? "Present" : "Absent"
                                    }
                                    tone={item.isPresent ? "success" : "danger"}
                                />
                                <Switch
                                    trackColor={{
                                        true: primary,
                                        false: "#475569",
                                    }}
                                    thumbColor="#f8fafc"
                                    value={item.isPresent}
                                    onValueChange={(next) => {
                                        void handleToggle(item, next);
                                    }}
                                />
                            </View>
                        }
                    />
                )}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        paddingHorizontal: 16,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    listContent: {
        gap: 10,
        paddingBottom: 20,
    },
    toggleSide: {
        alignItems: "flex-end",
        gap: 8,
    },
});
