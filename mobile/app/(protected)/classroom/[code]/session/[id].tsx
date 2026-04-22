import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    StyleSheet,
    Switch,
    TextInput,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
    reviewAttendanceRequest,
    setAttendancePresence,
    submitAttendanceRequest,
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
    const [requestMessage, setRequestMessage] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [isReviewingRequest, setIsReviewingRequest] = useState(false);
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

    const handleSubmitRequest = useCallback(async () => {
        if (!data || isTeacher) {
            return;
        }

        const trimmed = requestMessage.trim();
        if (trimmed.length < 5) {
            setError("Please provide at least 5 characters in your message.");
            return;
        }

        setError(null);
        setIsSubmittingRequest(true);
        try {
            await submitAttendanceRequest({
                attendanceSessionId: sessionId,
                classroomCode,
                message: trimmed,
            });

            const latest = await getAttendanceSessionDetail(classroomCode, sessionId);
            setData(latest);
            setRequestMessage("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to submit attendance request.",
            );
        } finally {
            setIsSubmittingRequest(false);
        }
    }, [classroomCode, data, isTeacher, requestMessage, sessionId]);

    const handleReviewRequest = useCallback(
        async (requestId: string, action: "approve" | "reject") => {
            setError(null);
            setIsReviewingRequest(true);
            try {
                await reviewAttendanceRequest({ requestId, action });
                const latest = await getAttendanceSessionDetail(
                    classroomCode,
                    sessionId,
                );
                setData(latest);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to review attendance request.",
                );
            } finally {
                setIsReviewingRequest(false);
            }
        },
        [classroomCode, sessionId],
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

    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <ScreenHeader
                showBack
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
                <View style={styles.studentSection}>
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
                                tone={
                                    currentStudent.isPresent ? "success" : "danger"
                                }
                            />
                        ) : null}
                    </AppCard>

                    {currentStudent && !currentStudent.isPresent ? (
                        <AppCard style={styles.requestCard}>
                            <ThemedText type="defaultSemiBold">
                                Request attendance review
                            </ThemedText>
                            <ThemedText style={{ color: muted }}>
                                If you were missed, send a message to your teacher.
                            </ThemedText>
                            <TextInput
                                value={requestMessage}
                                onChangeText={setRequestMessage}
                                placeholder="Explain why you should be marked present"
                                placeholderTextColor={muted}
                                multiline
                                style={[styles.requestInput, { color: muted }]}
                            />
                            <AppButton
                                label="Submit Request"
                                loading={isSubmittingRequest}
                                onPress={() => {
                                    void handleSubmitRequest();
                                }}
                            />
                            {data.requests.length > 0 ? (
                                <View style={styles.requestHistory}>
                                    {data.requests.map((request) => (
                                        <View
                                            key={request.id}
                                            style={styles.requestHistoryItem}
                                        >
                                            <StatusPill
                                                label={request.status.toUpperCase()}
                                                tone={
                                                    request.status === "approved"
                                                        ? "success"
                                                        : request.status ===
                                                            "rejected"
                                                          ? "danger"
                                                          : "muted"
                                                }
                                            />
                                            <ThemedText>{request.message}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </AppCard>
                    ) : null}
                </View>
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
                <View style={styles.teacherSection}>
                    {data.requests.length > 0 ? (
                        <AppCard style={styles.teacherRequestsCard}>
                            <ThemedText type="defaultSemiBold">
                                Attendance requests
                            </ThemedText>
                            {data.requests.map((request) => (
                                <View key={request.id} style={styles.teacherRequestItem}>
                                    <View style={styles.teacherRequestHeader}>
                                        <ThemedText type="defaultSemiBold">
                                            {request.studentName}
                                        </ThemedText>
                                        <StatusPill
                                            label={request.status.toUpperCase()}
                                            tone={
                                                request.status === "approved"
                                                    ? "success"
                                                    : request.status === "rejected"
                                                      ? "danger"
                                                      : "muted"
                                            }
                                        />
                                    </View>
                                    <ThemedText style={{ color: muted }}>
                                        {request.message}
                                    </ThemedText>
                                    {request.status === "pending" ? (
                                        <View style={styles.teacherRequestActions}>
                                            <AppButton
                                                label="Reject"
                                                variant="danger"
                                                loading={isReviewingRequest}
                                                onPress={() => {
                                                    void handleReviewRequest(
                                                        request.id,
                                                        "reject",
                                                    );
                                                }}
                                            />
                                            <AppButton
                                                label="Approve"
                                                loading={isReviewingRequest}
                                                onPress={() => {
                                                    void handleReviewRequest(
                                                        request.id,
                                                        "approve",
                                                    );
                                                }}
                                            />
                                        </View>
                                    ) : null}
                                </View>
                            ))}
                        </AppCard>
                    ) : null}

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
                </View>
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
    studentSection: {
        gap: 10,
    },
    requestCard: {
        gap: 10,
    },
    requestInput: {
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        minHeight: 90,
        textAlignVertical: "top",
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    requestHistory: {
        gap: 8,
    },
    requestHistoryItem: {
        gap: 6,
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        padding: 10,
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
    teacherSection: {
        flex: 1,
        gap: 10,
    },
    teacherRequestsCard: {
        gap: 10,
    },
    teacherRequestItem: {
        borderWidth: 1,
        borderColor: "#334155",
        borderRadius: 10,
        padding: 10,
        gap: 8,
    },
    teacherRequestHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    teacherRequestActions: {
        flexDirection: "row",
        gap: 8,
    },
});
