import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
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
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Spacing, Radii, Shadows, CONTENT_BOTTOM_PAD } from "@/constants/theme";
import {
    formatSessionLabel,
    createAttendanceVerificationChallenge,
    getAttendanceSessionDetail,
    reviewAttendanceRequest,
    setAttendancePresence,
    submitAttendanceRequest,
    verifyAttendanceWithFace,
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
    const card = useThemeColor({}, "card");
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const shutterScale = useRef(new Animated.Value(1)).current;

    const [data, setData] = useState<AttendanceSessionDetailPayload | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attendanceCode, setAttendanceCode] = useState("");
    const [isSubmittingCode, setIsSubmittingCode] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedSelfieBase64, setCapturedSelfieBase64] = useState("");
    const [permission, requestPermission] = useCameraPermissions();
    const [requestMessage, setRequestMessage] = useState("");
    const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
    const [isReviewingRequest, setIsReviewingRequest] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const cameraRef = useRef<CameraView | null>(null);
    const insets = useSafeAreaInsets();

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

    const displaySessionCode = useMemo(() => {
        const token = data?.session.token;
        if (!token) {
            return "";
        }
        if (token.length <= 8) {
            return token;
        }
        return `${token.slice(0, 3)}...${token.slice(-2)}`;
    }, [data?.session.token]);

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

    const handleMarkByCode = useCallback(async () => {
        const code = attendanceCode.trim();
        if (!code) {
            setError("Please enter the attendance code.");
            return;
        }

        if (!capturedSelfieBase64) {
            setError(
                "Please capture your selfie before submitting attendance.",
            );
            return;
        }

        setError(null);
        setIsSubmittingCode(true);

        try {
            const challenge = await createAttendanceVerificationChallenge(code);
            await verifyAttendanceWithFace({
                attendanceCode: code,
                challengeId: challenge.challengeId,
                challengeToken: challenge.challengeToken,
                selfieBase64: capturedSelfieBase64,
            });

            const latest = await getAttendanceSessionDetail(
                classroomCode,
                sessionId,
            );
            setData(latest);
            setAttendanceCode("");
            setCapturedSelfieBase64("");
            setShowCamera(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to verify face and mark attendance.",
            );
        } finally {
            setIsSubmittingCode(false);
        }
    }, [attendanceCode, capturedSelfieBase64, classroomCode, sessionId]);

    const handleCaptureSelfie = useCallback(async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) {
                setError(
                    "Camera permission is required for face verification.",
                );
                return;
            }
        }

        setIsCameraReady(false);
        setShowCamera(true);
    }, [permission?.granted, requestPermission]);

    const handleTakeSelfie = useCallback(async () => {
        if (!cameraRef.current) {
            setError("Camera is not ready yet.");
            return;
        }

        if (!isCameraReady) {
            setError("Camera preview is still loading. Try again in a moment.");
            return;
        }

        // Shutter press animation
        Animated.sequence([
            Animated.timing(shutterScale, {
                toValue: 0.8,
                duration: 80,
                useNativeDriver: true,
            }),
            Animated.spring(shutterScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 60,
                friction: 6,
            }),
        ]).start();

        setError(null);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                base64: true,
                quality: 0.5,
                skipProcessing: true,
            });

            if (!photo?.base64) {
                throw new Error("Could not capture selfie.");
            }

            setCapturedSelfieBase64(`data:image/jpeg;base64,${photo.base64}`);
            setShowCamera(false);
            setIsCameraReady(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to capture selfie.",
            );
        }
    }, [isCameraReady, shutterScale]);

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

            const latest = await getAttendanceSessionDetail(
                classroomCode,
                sessionId,
            );
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

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 12 }]}>
            <ScreenHeader
                showBack
                title="Session Detail"
                subtitle={formatSessionLabel(data.session.createdAt)}
                rightSlot={
                    <StatusPill
                        label={
                            data.session.isClosed ||
                            new Date(data.session.expiresAt).getTime() <
                                Date.now()
                                ? "Expired"
                                : "Active"
                        }
                        tone={
                            data.session.isClosed ||
                            new Date(data.session.expiresAt).getTime() <
                                Date.now()
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
                          : "Enter the attendance code shared by your teacher."}
                </ThemedText>
            </AppCard>

            {isTeacher ? (
                <AppCard style={styles.qrCard}>
                    <ThemedText type="defaultSemiBold">
                        Session QR Code
                    </ThemedText>
                    {data.session.token ? (
                        <View style={styles.qrWrap}>
                            <QRCode value={data.session.token} size={180} />
                            <ThemedText style={{ color: muted }}>
                                Students use this code to mark attendance.
                            </ThemedText>
                            <ThemedText
                                type="defaultSemiBold"
                                style={styles.codeLabel}
                            >
                                Code: {displaySessionCode}
                            </ThemedText>
                        </View>
                    ) : (
                        <ThemedText style={{ color: danger }}>
                            Missing session token.
                        </ThemedText>
                    )}
                </AppCard>
            ) : (
                <ScrollView
                    style={styles.studentScroll}
                    contentContainerStyle={styles.studentScrollContent}
                    showsVerticalScrollIndicator
                >
                    <View style={styles.studentSection}>
                        <AppCard style={styles.studentCard}>
                            <ThemedText type="defaultSemiBold">
                                Mark attendance
                            </ThemedText>
                            <ThemedText style={{ color: muted }}>
                                Enter the attendance code and capture your
                                selfie.
                            </ThemedText>

                            <TextInput
                                value={attendanceCode}
                                onChangeText={setAttendanceCode}
                                placeholder="Enter session code"
                                placeholderTextColor={muted}
                                autoCapitalize="none"
                                style={[styles.requestInput, { color: muted }]}
                            />

                            <View style={styles.mobileActionRow}>
                                <AppButton
                                    label={
                                        capturedSelfieBase64
                                            ? "Retake Selfie"
                                            : "Capture Selfie"
                                    }
                                    variant="secondary"
                                    onPress={() => {
                                        void handleCaptureSelfie();
                                    }}
                                />
                                <AppButton
                                    label="Verify + Submit"
                                    loading={isSubmittingCode}
                                    onPress={() => {
                                        void handleMarkByCode();
                                    }}
                                />
                            </View>

                            {capturedSelfieBase64 ? (
                                <ThemedText style={{ color: muted }}>
                                    Selfie captured and ready for verification.
                                </ThemedText>
                            ) : null}

                            {currentStudent ? (
                                <StatusPill
                                    label={
                                        currentStudent.isPresent
                                            ? "You are marked present"
                                            : "You are currently absent"
                                    }
                                    tone={
                                        currentStudent.isPresent
                                            ? "success"
                                            : "danger"
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
                                    If you were missed, send a message to your
                                    teacher.
                                </ThemedText>
                                <TextInput
                                    value={requestMessage}
                                    onChangeText={setRequestMessage}
                                    placeholder="Explain why you should be marked present"
                                    placeholderTextColor={muted}
                                    multiline
                                    style={[
                                        styles.requestInput,
                                        { color: muted },
                                    ]}
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
                                                style={
                                                    styles.requestHistoryItem
                                                }
                                            >
                                                <StatusPill
                                                    label={request.status.toUpperCase()}
                                                    tone={
                                                        request.status ===
                                                        "approved"
                                                            ? "success"
                                                            : request.status ===
                                                                "rejected"
                                                              ? "danger"
                                                              : "muted"
                                                    }
                                                />
                                                <ThemedText>
                                                    {request.message}
                                                </ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                ) : null}
                            </AppCard>
                        ) : null}



                        <View style={styles.studentSummary}>
                            <ThemedText style={{ color: muted }}>
                                Attendance for students is code-based for this
                                session.
                            </ThemedText>
                        </View>
                    </View>
                </ScrollView>
            )}

            {isTeacher ? (
                <View style={styles.teacherSection}>
                    {data.requests.length > 0 ? (
                        <AppCard style={styles.teacherRequestsCard}>
                            <ThemedText type="defaultSemiBold">
                                Attendance requests
                            </ThemedText>
                            {data.requests.map((request) => (
                                <View
                                    key={request.id}
                                    style={styles.teacherRequestItem}
                                >
                                    <View style={styles.teacherRequestHeader}>
                                        <ThemedText type="defaultSemiBold">
                                            {request.studentName}
                                        </ThemedText>
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
                                    </View>
                                    <ThemedText style={{ color: muted }}>
                                        {request.message}
                                    </ThemedText>
                                    {request.status === "pending" ? (
                                        <View
                                            style={styles.teacherRequestActions}
                                        >
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
            ) : null}
            {/* ---- Selfie Capture Modal ---- */}
            <Modal
                visible={showCamera}
                animationType="fade"
                transparent
                onRequestClose={() => {
                    setShowCamera(false);
                    setIsCameraReady(false);
                }}
            >
                <View style={styles.selfieOverlay}>
                    {/* Title */}
                    <ThemedText style={styles.selfieTitle}>
                        Take a selfie
                    </ThemedText>
                    <ThemedText style={styles.selfieSubtitle}>
                        Position your face inside the circle
                    </ThemedText>

                    {/* Circular camera viewport */}
                    <View style={styles.selfieRingOuter}>
                        <View
                            style={[
                                styles.selfieRingGlow,
                                { borderColor: primary },
                            ]}
                        >
                            <View style={styles.selfieCircle}>
                                <CameraView
                                    ref={cameraRef}
                                    style={StyleSheet.absoluteFill}
                                    facing="front"
                                    mirror
                                    onCameraReady={() => {
                                        setIsCameraReady(true);
                                    }}
                                    onMountError={() => {
                                        setIsCameraReady(false);
                                        setError(
                                            Platform.OS === "web"
                                                ? "Unable to start camera on web. Ensure camera permission is allowed and the site runs on HTTPS or localhost."
                                                : "Unable to start camera preview.",
                                        );
                                        setShowCamera(false);
                                    }}
                                />
                                {!isCameraReady ? (
                                    <View style={styles.selfieLoading}>
                                        <ActivityIndicator
                                            size="large"
                                            color={primary}
                                        />
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </View>

                    {/* Hint */}
                    <ThemedText style={styles.selfieHint}>
                        🔒 Photo is used only for verification
                    </ThemedText>

                    {/* Shutter + Cancel */}
                    <View style={styles.selfieControls}>
                        <Pressable
                            disabled={!isCameraReady}
                            onPress={() => {
                                void handleTakeSelfie();
                            }}
                            style={({ pressed }) => ({
                                opacity:
                                    !isCameraReady ? 0.4 : pressed ? 0.85 : 1,
                            })}
                        >
                            <Animated.View
                                style={[
                                    styles.shutterOuter,
                                    {
                                        borderColor: primary,
                                        transform: [
                                            { scale: shutterScale },
                                        ],
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.shutterInner,
                                        { backgroundColor: primary },
                                    ]}
                                />
                            </Animated.View>
                        </Pressable>
                    </View>

                    <Pressable
                        onPress={() => {
                            setShowCamera(false);
                            setIsCameraReady(false);
                        }}
                        hitSlop={16}
                        style={styles.selfieCancelButton}
                    >
                        <ThemedText style={styles.selfieCancelText}>
                            Cancel
                        </ThemedText>
                    </Pressable>
                </View>
            </Modal>
        </ThemedView>
    );
}

const SELFIE_SIZE = Math.min(Dimensions.get("window").width * 0.65, 260);

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
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
    },
    listContent: {
        gap: Spacing.md,
        paddingBottom: CONTENT_BOTTOM_PAD,
    },
    toggleSide: {
        alignItems: "flex-end",
        gap: Spacing.sm,
    },
    qrCard: {
        gap: Spacing.md,
    },
    qrWrap: {
        alignItems: "center",
        gap: Spacing.md,
    },
    codeLabel: {
        fontSize: 12,
        lineHeight: 16,
        letterSpacing: 0.3,
    },
    studentCard: {
        gap: Spacing.md,
    },
    studentSection: {
        gap: Spacing.md,
    },
    requestCard: {
        gap: Spacing.md,
    },
    requestInput: {
        borderRadius: Radii.lg,
        minHeight: 90,
        textAlignVertical: "top",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: "rgba(42, 43, 58, 0.5)",
    },
    mobileActionRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    /* ---- Selfie capture modal ---- */
    selfieOverlay: {
        flex: 1,
        backgroundColor: "rgba(2, 6, 23, 0.92)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.xxl,
        gap: Spacing.lg,
    },
    selfieTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    selfieSubtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.55)",
        marginBottom: Spacing.sm,
    },
    selfieRingOuter: {
        alignItems: "center",
        justifyContent: "center",
    },
    selfieRingGlow: {
        borderWidth: 3,
        borderRadius: SELFIE_SIZE / 2 + 6,
        padding: 4,
        shadowColor: "#9B7FFF",
        shadowOpacity: 0.35,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
    },
    selfieCircle: {
        width: SELFIE_SIZE,
        height: SELFIE_SIZE,
        borderRadius: SELFIE_SIZE / 2,
        overflow: "hidden",
        backgroundColor: "#0f172a",
    },
    selfieLoading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(15, 23, 42, 0.6)",
    },
    selfieHint: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.4)",
        marginTop: Spacing.sm,
    },
    selfieControls: {
        marginTop: Spacing.xxl,
        alignItems: "center",
    },
    shutterOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        alignItems: "center",
        justifyContent: "center",
    },
    shutterInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    selfieCancelButton: {
        marginTop: Spacing.md,
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: Spacing.xl,
    },
    selfieCancelText: {
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: 15,
        fontWeight: "600",
    },
    requestHistory: {
        gap: Spacing.sm,
    },
    requestHistoryItem: {
        gap: Spacing.sm,
        borderRadius: Radii.lg,
        padding: Spacing.md,
        backgroundColor: "rgba(42, 43, 58, 0.35)",
    },
    studentSummary: {
        alignItems: "center",
        paddingTop: Spacing.md,
    },
    studentScroll: {
        flex: 1,
    },
    studentScrollContent: {
        gap: Spacing.md,
        paddingBottom: CONTENT_BOTTOM_PAD,
    },
    teacherSection: {
        flex: 1,
        gap: Spacing.md,
    },
    teacherRequestsCard: {
        gap: Spacing.md,
    },
    teacherRequestItem: {
        borderRadius: Radii.lg,
        padding: Spacing.md,
        gap: Spacing.sm,
        backgroundColor: "rgba(42, 43, 58, 0.35)",
    },
    teacherRequestHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.sm,
    },
    teacherRequestActions: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
});
