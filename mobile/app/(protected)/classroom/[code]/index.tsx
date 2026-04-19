import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Clipboard from "expo-clipboard";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppListItem } from "@/components/ui/app-list-item";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/providers/auth-provider";
import {
    createAttendanceSession,
    formatSessionLabel,
    getClassroomByCode,
    getClassroomSessions,
} from "@/lib/api";
import type {
    AttendanceSessionSummary,
    ClassroomDetailPayload,
    ClassroomRole,
} from "@/types/api";

type TeacherTab = "members" | "sessions" | "create";
type StudentTab = "sessions" | "attendance" | "analytics";

function normalizeParam(value: string | string[] | undefined): string {
    if (!value) {
        return "";
    }
    return Array.isArray(value) ? value[0] || "" : value;
}

export default function ClassroomScreen() {
    const params = useLocalSearchParams<{ code: string }>();
    const classroomCode = normalizeParam(params.code);
    const { user } = useAuth();

    const muted = useThemeColor({}, "muted");
    const danger = useThemeColor({}, "danger");

    const [classroom, setClassroom] = useState<ClassroomDetailPayload | null>(
        null,
    );
    const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isCopyingCode, setIsCopyingCode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState(30);
    const [teacherTab, setTeacherTab] = useState<TeacherTab>("members");
    const [studentTab, setStudentTab] = useState<StudentTab>("sessions");

    const role: ClassroomRole = useMemo(() => {
        if (!classroom || !user) {
            return "student";
        }
        return classroom.creatorId === user.id ? "teacher" : "student";
    }, [classroom, user]);

    const sessionStats = useMemo(() => {
        const presentCount = sessions.filter(
            (item) => item.status === "present",
        ).length;
        const absentCount = sessions.filter(
            (item) => item.status === "absent",
        ).length;

        return {
            total: sessions.length,
            presentCount,
            absentCount,
            percentage:
                sessions.length > 0
                    ? Math.round((presentCount / sessions.length) * 100)
                    : 0,
        };
    }, [sessions]);

    const loadClassroom = useCallback(async () => {
        if (!classroomCode) {
            setError("Missing classroom code.");
            setIsLoading(false);
            return;
        }

        setError(null);
        setIsLoading(true);

        try {
            const [classroomResponse, sessionsResponse] = await Promise.all([
                getClassroomByCode(classroomCode),
                getClassroomSessions(classroomCode),
            ]);
            setClassroom(classroomResponse.payload);
            setSessions(sessionsResponse);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load classroom.",
            );
        } finally {
            setIsLoading(false);
        }
    }, [classroomCode]);

    useEffect(() => {
        loadClassroom();
    }, [loadClassroom]);

    const refresh = useCallback(async () => {
        if (!classroomCode) {
            return;
        }
        setIsRefreshing(true);
        try {
            const [classroomResponse, sessionsResponse] = await Promise.all([
                getClassroomByCode(classroomCode),
                getClassroomSessions(classroomCode),
            ]);
            setClassroom(classroomResponse.payload);
            setSessions(sessionsResponse);
        } finally {
            setIsRefreshing(false);
        }
    }, [classroomCode]);

    const handleStartSession = useCallback(async () => {
        if (!classroomCode) {
            return;
        }
        setError(null);
        setIsStartingSession(true);

        try {
            const newSession = await createAttendanceSession({
                classroomCode,
                durationMinutes,
            });
            setSessions((prev) => [newSession, ...prev]);
            router.push(
                `/classroom/${classroomCode}/session/${newSession.id}` as never,
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not start attendance session.",
            );
        } finally {
            setIsStartingSession(false);
        }
    }, [classroomCode, durationMinutes]);

    const displayClassroomCode = useMemo(() => {
        if (classroomCode.length <= 10) {
            return classroomCode;
        }

        return `${classroomCode.slice(0, 4)}...${classroomCode.slice(-4)}`;
    }, [classroomCode]);

    const handleCopyClassroomCode = useCallback(async () => {
        if (!classroomCode) {
            return;
        }

        setIsCopyingCode(true);
        try {
            await Clipboard.setStringAsync(classroomCode);
        } finally {
            setIsCopyingCode(false);
        }
    }, [classroomCode]);

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (!classroom || error) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={{ color: danger }}>
                    {error || "Classroom not available."}
                </ThemedText>
                <AppButton label="Retry" onPress={loadClassroom} />
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <ScreenHeader
                title={classroom.name}
                subtitle={`Code: ${displayClassroomCode}`}
                rightSlot={
                    <View style={styles.headerButtons}>
                        <AppButton
                            label={isCopyingCode ? "Copied" : "Copy Code"}
                            variant="secondary"
                            onPress={() => {
                                void handleCopyClassroomCode();
                            }}
                        />
                        <AppButton
                            label={isRefreshing ? "Refreshing..." : "Refresh"}
                            variant="ghost"
                            onPress={() => {
                                void refresh();
                            }}
                        />
                    </View>
                }
            />

            <AppCard>
                <ThemedText style={{ color: muted }}>
                    {classroom.description || "No class description provided."}
                </ThemedText>
            </AppCard>

            {role === "teacher" ? (
                <SegmentedControl<TeacherTab>
                    value={teacherTab}
                    onChange={setTeacherTab}
                    options={[
                        { label: "Members", value: "members" },
                        { label: "Sessions", value: "sessions" },
                        { label: "Create Session", value: "create" },
                    ]}
                />
            ) : (
                <SegmentedControl<StudentTab>
                    value={studentTab}
                    onChange={setStudentTab}
                    options={[
                        { label: "Sessions", value: "sessions" },
                        { label: "My Attendance", value: "attendance" },
                        { label: "Analytics", value: "analytics" },
                    ]}
                />
            )}

            {role === "teacher" && teacherTab === "members" ? (
                <FlatList
                    data={classroom.members}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <AppCard>
                            <ThemedText>No members yet.</ThemedText>
                        </AppCard>
                    }
                    renderItem={({ item }) => (
                        <AppListItem
                            title={item.name}
                            subtitle={item.email}
                            avatarUri={item.image}
                            rightSlot={
                                <MaterialIcons
                                    name="chevron-right"
                                    size={18}
                                    color={muted}
                                />
                            }
                            onPress={() => {
                                router.push(
                                    `/classroom/${classroomCode}/member/${item.id}` as never,
                                );
                            }}
                        />
                    )}
                />
            ) : null}

            {((role === "teacher" && teacherTab === "sessions") ||
                (role === "student" && studentTab === "sessions") ||
                (role === "student" && studentTab === "attendance")) && (
                <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <AppCard>
                            <ThemedText>No sessions yet.</ThemedText>
                        </AppCard>
                    }
                    renderItem={({ item }) => (
                        <AppCard style={styles.sessionCard}>
                            {(() => {
                                const isExpired =
                                    item.isClosed ||
                                    new Date(item.expiresAt).getTime() < Date.now();

                                return (
                                    <View style={styles.sessionRow}>
                                        <View style={styles.sessionDetails}>
                                            <ThemedText type="defaultSemiBold">
                                                {formatSessionLabel(item.createdAt)}
                                            </ThemedText>
                                            <ThemedText style={{ color: muted }}>
                                                {item.presentCount}/{item.totalCount}{" "}
                                                students present
                                            </ThemedText>
                                        </View>
                                        <View style={styles.sessionPills}>
                                            <StatusPill
                                                label={
                                                    isExpired ? "Expired" : "Active"
                                                }
                                                tone={
                                                    isExpired ? "danger" : "success"
                                                }
                                            />
                                            {role === "student" ? (
                                                <StatusPill
                                                    label={
                                                        item.status === "present"
                                                            ? "Present"
                                                            : item.status === "absent"
                                                              ? "Absent"
                                                              : "Unknown"
                                                    }
                                                    tone={
                                                        item.status === "present"
                                                            ? "success"
                                                            : item.status === "absent"
                                                              ? "danger"
                                                              : "muted"
                                                    }
                                                />
                                            ) : null}
                                        </View>
                                    </View>
                                );
                            })()}
                            <AppButton
                                label="Open Session"
                                variant="secondary"
                                onPress={() => {
                                    router.push(
                                        `/classroom/${classroomCode}/session/${item.id}` as never,
                                    );
                                }}
                            />
                        </AppCard>
                    )}
                />
            )}

            {role === "teacher" && teacherTab === "create" ? (
                <View style={styles.createArea}>
                    <AppCard>
                        <ThemedText type="defaultSemiBold">
                            New attendance session
                        </ThemedText>
                        <ThemedText style={{ color: muted }}>
                            Set duration and open the live attendance panel.
                        </ThemedText>

                        <View style={styles.durationRow}>
                            {[15, 30, 45, 60].map((option) => (
                                <AppButton
                                    key={option}
                                    label={`${option}m`}
                                    variant={
                                        durationMinutes === option
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onPress={() => setDurationMinutes(option)}
                                    style={styles.durationButton}
                                />
                            ))}
                        </View>

                        <AppButton
                            label="Start Attendance Session"
                            loading={isStartingSession}
                            onPress={handleStartSession}
                        />
                    </AppCard>
                </View>
            ) : null}

            {role === "student" && studentTab === "analytics" ? (
                <View style={styles.analyticsArea}>
                    <AppCard>
                        <ThemedText type="defaultSemiBold">
                            Attendance performance
                        </ThemedText>
                        <ProgressBar
                            label="Presence"
                            value={sessionStats.presentCount}
                            max={Math.max(1, sessionStats.total)}
                        />
                        <View style={styles.analyticsSummary}>
                            <ThemedText style={{ color: muted }}>
                                Present: {sessionStats.presentCount}
                            </ThemedText>
                            <ThemedText style={{ color: muted }}>
                                Absent: {sessionStats.absentCount}
                            </ThemedText>
                            <ThemedText style={{ color: muted }}>
                                Score: {sessionStats.percentage}%
                            </ThemedText>
                        </View>
                    </AppCard>
                </View>
            ) : null}
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
    listContent: {
        gap: 10,
        paddingBottom: 18,
    },
    headerButtons: {
        alignItems: "flex-end",
        gap: 8,
    },
    sessionCard: {
        gap: 10,
    },
    sessionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    sessionPills: {
        alignItems: "flex-end",
        gap: 6,
    },
    sessionDetails: {
        flex: 1,
        gap: 2,
    },
    createArea: {
        gap: 12,
    },
    durationRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 10,
        marginBottom: 12,
    },
    durationButton: {
        minHeight: 36,
        paddingHorizontal: 12,
    },
    analyticsArea: {
        gap: 10,
    },
    analyticsSummary: {
        marginTop: 6,
        gap: 4,
    },
});
