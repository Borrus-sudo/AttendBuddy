import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Switch,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import QRCode from "react-native-qrcode-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppListItem } from "@/components/ui/app-list-item";
import { ScreenHeader } from "@/components/ui/screen-header";
import { StatusPill } from "@/components/ui/status-pill";
import { WebQrScanner } from "@/components/qr/web-qr-scanner";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    formatSessionLabel,
    getAttendanceSessionDetail,
    markAttendanceByToken,
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
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scanLock, setScanLock] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

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

        const total = data.session.totalCount;
        const present = data.session.presentCount;

        return {
            present,
            absent: Math.max(0, total - present),
            total,
        };
    }, [data]);

    const isTeacher = data?.role === "teacher";
    const currentStudent = useMemo(() => {
        if (!data || isTeacher) {
            return null;
        }
        return data.members[0] ?? null;
    }, [data, isTeacher]);

    const handleToggle = useCallback(
        async (member: AttendanceMemberStatus, nextPresent: boolean) => {
            if (!data || !isTeacher) {
                return;
            }

            const previousMembers = data.members;
            const optimisticMembers = data.members.map((item) =>
                item.userId === member.userId
                    ? {
                          ...item,
                          isPresent: nextPresent,
                          markedAt: nextPresent
                              ? new Date().toISOString()
                              : null,
                      }
                    : item,
            );

            setData({ ...data, members: optimisticMembers });

            setError(null);
            setIsSaving(true);

            try {
                await setAttendancePresence({
                    attendanceSessionId: sessionId,
                    studentUserId: member.userId,
                    isPresent: nextPresent,
                });

                const latest = await getAttendanceSessionDetail(
                    classroomCode,
                    sessionId,
                );
                setData(latest);
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
        [classroomCode, data, isTeacher, sessionId],
    );

    const openScanner = useCallback(async () => {
        if (permission?.granted) {
            setScannerOpen(true);
            return;
        }

        const result = await requestPermission();
        if (result.granted) {
            setScannerOpen(true);
        } else {
            setError("Camera permission is required to scan attendance QR.");
        }
    }, [permission?.granted, requestPermission]);

    const handleScan = useCallback(
        async ({ data: qrData }: { data: string }) => {
            if (!data || scanLock) {
                return;
            }

            setScanLock(true);
            setError(null);

            const expectedToken = data.session.token;
            if (!expectedToken || qrData !== expectedToken) {
                setError("Invalid QR code for this attendance session.");
                setScanLock(false);
                return;
            }

            try {
                await markAttendanceByToken(expectedToken);
                const latest = await getAttendanceSessionDetail(
                    classroomCode,
                    sessionId,
                );
                setData(latest);
                setScannerOpen(false);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to mark attendance from QR.",
                );
            } finally {
                setScanLock(false);
            }
        },
        [classroomCode, data, scanLock, sessionId],
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
                        label={
                            data.session.isClosed ||
                            new Date(data.session.expiresAt).getTime() < Date.now()
                                ? "Expired"
                                : "Active"
                        }
                        tone={
                            data.session.isClosed ||
                            new Date(data.session.expiresAt).getTime() < Date.now()
                                ? "danger"
                                : "success"
                        }
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
                        : isTeacher
                          ? "Teacher controls are synced with database."
                          : "Scan the session QR to mark your attendance."}
                </ThemedText>
            </AppCard>

            {isTeacher ? (
                <AppCard style={styles.qrCard}>
                    <ThemedText type="defaultSemiBold">Session QR Code</ThemedText>
                    {data.session.token ? (
                        <View style={styles.qrWrap}>
                            <QRCode value={data.session.token} size={180} />
                            <ThemedText style={{ color: muted }}>
                                Students scan this to mark attendance.
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={{ color: danger }}>
                            Missing session token.
                        </ThemedText>
                    )}
                </AppCard>
            ) : (
                <AppCard style={styles.studentCard}>
                    <ThemedText type="defaultSemiBold">Mark attendance</ThemedText>
                    <ThemedText style={{ color: muted }}>
                        Tap scan and point to your teacher's session QR code.
                    </ThemedText>

                    <AppButton
                        label={scannerOpen ? "Scanning..." : "Scan Session QR"}
                        onPress={() => {
                            void openScanner();
                        }}
                    />

                    {currentStudent ? (
                        <StatusPill
                            label={
                                currentStudent.isPresent
                                    ? "You are marked present"
                                    : "You are currently absent"
                            }
                            tone={currentStudent.isPresent ? "success" : "danger"}
                        />
                    ) : null}
                </AppCard>
            )}

            {scannerOpen ? (
                <AppCard style={styles.scannerCard}>
                    <ThemedText type="defaultSemiBold">QR Scanner</ThemedText>
                    <View style={styles.cameraFrame}>
                        {Platform.OS === "web" ? (
                            <WebQrScanner
                                active={scannerOpen}
                                onScan={(payload) => {
                                    void handleScan({ data: payload });
                                }}
                            />
                        ) : (
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                }}
                                onBarcodeScanned={
                                    scanLock || !data.session.token
                                        ? undefined
                                        : handleScan
                                }
                            />
                        )}
                    </View>
                    <AppButton
                        label="Cancel Scan"
                        variant="secondary"
                        onPress={() => setScannerOpen(false)}
                    />
                </AppCard>
            ) : null}

            {isTeacher ? (
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
                                            item.isPresent
                                                ? "Present"
                                                : "Absent"
                                        }
                                        tone={
                                            item.isPresent
                                                ? "success"
                                                : "danger"
                                        }
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
            ) : (
                <View style={styles.studentSummary}>
                    <ThemedText style={{ color: muted }}>
                        Attendance for students is QR-based only.
                    </ThemedText>
                </View>
            )}
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
    qrCard: {
        gap: 10,
    },
    qrWrap: {
        alignItems: "center",
        gap: 10,
    },
    studentCard: {
        gap: 10,
    },
    scannerCard: {
        gap: 10,
    },
    cameraFrame: {
        height: 260,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#0f172a",
    },
    studentSummary: {
        alignItems: "center",
        paddingTop: 12,
    },
});
