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
import {
    Clock,
    Send,
    FileText,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Lock,
    MessageSquarePlus,
    ShieldAlert,
    History,
    Scan,
} from "lucide-react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppListItem } from "@/components/ui/app-list-item";
import { AppModal } from "@/components/ui/app-modal";
import { ScreenHeader } from "@/components/ui/screen-header";
import { WebQrScanner } from "@/components/qr/web-qr-scanner";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Spacing, Radii, Shadows, CONTENT_BOTTOM_PAD } from "@/constants/theme";
import {
    formatSessionLabel,
    getAttendanceSessionDetail,
    reviewAttendanceRequest,
    setAttendancePresence,
    submitAttendanceRequest,
    verifyAttendanceWithFace,
} from "@/lib/api";
import * as Location from "expo-location";
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
    const success = useThemeColor({}, "success");
    const card = useThemeColor({}, "card");
    const border = useThemeColor({}, "border");
    const text = useThemeColor({}, "text");
    const colorScheme = useColorScheme();

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
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
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
    const isSessionExpired = useMemo(() => {
        if (!data) return false;
        return (
            data.session.isClosed ||
            new Date(data.session.expiresAt).getTime() < Date.now()
        );
    }, [data]);

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
            const { status } =
                await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                throw new Error(
                    "Location permission is required to mark attendance.",
                );
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            await verifyAttendanceWithFace({
                attendanceCode: code,
                selfieBase64: capturedSelfieBase64,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
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
                quality: 0.7,
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
            setShowRequestModal(false);
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
        <ThemedView style={[styles.container, { paddingTop: insets.top + 20 }]}>
            <ScreenHeader
                showBack
                title="Session Detail"
                subtitle={formatSessionLabel(data.session.createdAt)}
                rightSlot={
                    <StatusPill
                        label={isSessionExpired ? "Expired" : "Active"}
                        tone={isSessionExpired ? "danger" : "success"}
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
                    <ThemedText type="defaultSemiBold">Session Code</ThemedText>
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

                            <View style={styles.codeInputWrap}>
                                <TextInput
                                    value={attendanceCode}
                                    onChangeText={setAttendanceCode}
                                    placeholder="Enter session code"
                                    placeholderTextColor={muted}
                                    autoCapitalize="none"
                                    style={[styles.codeInput, { color: muted }]}
                                />
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.scanButton,
                                        { opacity: pressed ? 0.7 : 1 }
                                    ]}
                                    onPress={async () => {
                                        if (!permission?.granted) {
                                            const result = await requestPermission();
                                            if (!result.granted) {
                                                setError("Camera permission is required to scan QR code.");
                                                return;
                                            }
                                        }
                                        setShowScanner(true);
                                    }}
                                >
                                    <Scan size={24} color={primary} />
                                </Pressable>
                            </View>

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

                        {/* Request Attendance — only if session is expired AND student absent */}
                        {currentStudent &&
                        !currentStudent.isPresent &&
                        isSessionExpired ? (
                            <Pressable
                                onPress={() => setShowRequestModal(true)}
                                style={({ pressed }) => [
                                    styles.requestTrigger,
                                    {
                                        backgroundColor:
                                            "rgba(201, 153, 107, 0.08)",
                                        borderColor: "rgba(201, 153, 107, 0.2)",
                                        transform: [
                                            { scale: pressed ? 0.97 : 1 },
                                        ],
                                        opacity: pressed ? 0.85 : 1,
                                    },
                                ]}
                            >
                                <View style={styles.requestTriggerIcon}>
                                    <MessageSquarePlus
                                        size={22}
                                        color={primary}
                                        strokeWidth={2}
                                    />
                                </View>
                                <View style={styles.requestTriggerTextWrap}>
                                    <ThemedText
                                        type="defaultSemiBold"
                                        style={{ fontSize: 15 }}
                                    >
                                        Request Attendance
                                    </ThemedText>
                                    <ThemedText
                                        style={{
                                            color: muted,
                                            fontSize: 13,
                                            lineHeight: 18,
                                        }}
                                    >
                                        Session expired — ask your teacher to
                                        mark you present
                                    </ThemedText>
                                </View>
                                <View
                                    style={[
                                        styles.requestTriggerBadge,
                                        {
                                            backgroundColor:
                                                "rgba(201, 153, 107, 0.15)",
                                        },
                                    ]}
                                >
                                    <Clock
                                        size={14}
                                        color={primary}
                                        strokeWidth={2.5}
                                    />
                                </View>
                            </Pressable>
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
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
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
                    <View style={styles.selfieHintRow}>
                        <Lock
                            size={12}
                            color="rgba(255, 255, 255, 0.4)"
                            strokeWidth={2.5}
                        />
                        <ThemedText style={styles.selfieHint}>
                            Photo is used only for verification
                        </ThemedText>
                    </View>

                    {/* Shutter + Cancel */}
                    <View style={styles.selfieControls}>
                        <Pressable
                            disabled={!isCameraReady}
                            onPress={() => {
                                void handleTakeSelfie();
                            }}
                            style={({ pressed }) => ({
                                opacity: !isCameraReady
                                    ? 0.4
                                    : pressed
                                      ? 0.85
                                      : 1,
                            })}
                        >
                            <Animated.View
                                style={[
                                    styles.shutterOuter,
                                    {
                                        borderColor: primary,
                                        transform: [{ scale: shutterScale }],
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

            {/* ---- Attendance Request Modal ---- */}
            <AppModal
                visible={showRequestModal}
                title="Request Attendance"
                onClose={() => setShowRequestModal(false)}
            >
                <View style={styles.requestModalContent}>
                    {/* Header illustration */}
                    <View
                        style={[
                            styles.requestModalIconWrap,
                            {
                                backgroundColor: "rgba(201, 153, 107, 0.12)",
                            },
                        ]}
                    >
                        <ShieldAlert
                            size={32}
                            color={primary}
                            strokeWidth={1.8}
                        />
                    </View>
                    <ThemedText
                        style={{
                            color: muted,
                            fontSize: 14,
                            lineHeight: 20,
                            textAlign: "center",
                        }}
                    >
                        This session has expired and you are marked absent. Send
                        a message to your teacher explaining why you should be
                        marked present.
                    </ThemedText>

                    {/* Message input */}
                    <View style={styles.requestModalInputWrap}>
                        <View style={styles.requestModalInputLabel}>
                            <FileText size={14} color={muted} strokeWidth={2} />
                            <ThemedText
                                style={{
                                    color: muted,
                                    fontSize: 12,
                                    fontWeight: "600",
                                    letterSpacing: 0.3,
                                }}
                            >
                                YOUR MESSAGE
                            </ThemedText>
                        </View>
                        <TextInput
                            value={requestMessage}
                            onChangeText={setRequestMessage}
                            placeholder="Explain why you should be marked present..."
                            placeholderTextColor="rgba(142, 130, 121, 0.7)"
                            multiline
                            numberOfLines={4}
                            style={[
                                styles.requestModalInput,
                                {
                                    color: text,
                                    backgroundColor: "rgba(237, 233, 230, 0.6)",
                                    borderColor: "rgba(237, 233, 230, 1)",
                                },
                            ]}
                        />
                    </View>

                    {/* Error display */}
                    {error ? (
                        <View style={styles.requestModalError}>
                            <AlertCircle
                                size={14}
                                color={danger}
                                strokeWidth={2.5}
                            />
                            <ThemedText
                                style={{
                                    color: danger,
                                    fontSize: 13,
                                    flex: 1,
                                }}
                            >
                                {error}
                            </ThemedText>
                        </View>
                    ) : null}

                    {/* Submit button */}
                    <AppButton
                        label="Send Request"
                        loading={isSubmittingRequest}
                        leftIcon={
                            <Send size={16} color="#f8fafc" strokeWidth={2.5} />
                        }
                        onPress={() => {
                            void handleSubmitRequest();
                        }}
                    />

                    {/* Previous requests history */}
                    {data.requests.length > 0 ? (
                        <View style={styles.requestModalHistory}>
                            <View style={styles.requestModalHistoryHeader}>
                                <History
                                    size={14}
                                    color={muted}
                                    strokeWidth={2.5}
                                />
                                <ThemedText
                                    style={{
                                        color: muted,
                                        fontSize: 12,
                                        fontWeight: "600",
                                        letterSpacing: 0.3,
                                    }}
                                >
                                    PREVIOUS REQUESTS
                                </ThemedText>
                            </View>
                            {data.requests.map((request) => (
                                <View
                                    key={request.id}
                                    style={[
                                        styles.requestModalHistoryItem,
                                        {
                                            backgroundColor:
                                                "rgba(237, 233, 230, 0.5)",
                                        },
                                    ]}
                                >
                                    <View
                                        style={
                                            styles.requestModalHistoryItemHeader
                                        }
                                    >
                                        {request.status === "approved" ? (
                                            <CheckCircle2
                                                size={16}
                                                color={success}
                                                strokeWidth={2.5}
                                            />
                                        ) : request.status === "rejected" ? (
                                            <XCircle
                                                size={16}
                                                color={danger}
                                                strokeWidth={2.5}
                                            />
                                        ) : (
                                            <Clock
                                                size={16}
                                                color={muted}
                                                strokeWidth={2.5}
                                            />
                                        )}
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
                                    <ThemedText
                                        style={{
                                            fontSize: 13,
                                            lineHeight: 18,
                                            color: muted,
                                        }}
                                    >
                                        {request.message}
                                    </ThemedText>
                                </View>
                            ))}
                        </View>
                    ) : null}
                </View>
            </AppModal>

            {/* ---- QR Scanner Modal ---- */}
            <Modal
                visible={showScanner}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowScanner(false)}
            >
                <ThemedView style={[styles.scannerContainer, { paddingTop: insets.top }]}>
                    <ScreenHeader title="Scan Session QR" onBack={() => setShowScanner(false)} showBack />
                    <View style={styles.scannerViewport}>
                        {Platform.OS === "web" ? (
                            <WebQrScanner
                                active={showScanner}
                                onScan={(payload) => {
                                    setAttendanceCode(payload);
                                    setShowScanner(false);
                                }}
                            />
                        ) : (
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                facing="back"
                                onBarcodeScanned={({ data: resultData }) => {
                                    if (resultData) {
                                        setAttendanceCode(resultData);
                                        setShowScanner(false);
                                    }
                                }}
                                barcodeScannerSettings={{
                                    barcodeTypes: ["qr"],
                                }}
                            />
                        )}
                        <View style={styles.scannerOverlay}>
                            <View style={styles.scannerTarget} />
                        </View>
                    </View>
                    <View style={styles.scannerFooter}>
                        <ThemedText style={{ color: muted, textAlign: "center" }}>
                            Point your camera at the QR code displayed by your teacher.
                        </ThemedText>
                        <AppButton
                            label="Cancel"
                            variant="secondary"
                            onPress={() => setShowScanner(false)}
                        />
                    </View>
                </ThemedView>
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
    requestTrigger: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        borderRadius: Radii.xxl,
        borderWidth: 1,
        padding: Spacing.lg,
    },
    requestTriggerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(155, 127, 255, 0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    requestTriggerTextWrap: {
        flex: 1,
        gap: 2,
    },
    requestTriggerBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    requestInput: {
        borderRadius: Radii.lg,
        minHeight: 90,
        textAlignVertical: "top",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: "rgba(240, 241, 245, 0.6)",
        fontFamily: "Outfit-Regular",
    },
    codeInputWrap: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: Spacing.sm,
    },
    codeInput: {
        flex: 1,
        borderRadius: Radii.lg,
        minHeight: 56,
        paddingHorizontal: Spacing.lg,
        backgroundColor: "rgba(240, 241, 245, 0.6)",
        fontFamily: "Outfit-Regular",
    },
    scanButton: {
        width: 56,
        borderRadius: Radii.lg,
        backgroundColor: "rgba(201, 153, 107, 0.12)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(201, 153, 107, 0.2)",
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
        shadowColor: "#C9996B",
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
    selfieHintRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: Spacing.sm,
    },
    selfieHint: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.4)",
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
        backgroundColor: "rgba(240, 241, 245, 0.6)",
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
    /* ---- Request Modal ---- */
    requestModalContent: {
        gap: Spacing.lg,
        alignItems: "center",
    },
    requestModalIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
    },
    requestModalInputWrap: {
        width: "100%",
        gap: Spacing.sm,
    },
    requestModalInputLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    requestModalInput: {
        borderRadius: Radii.lg,
        minHeight: 100,
        textAlignVertical: "top",
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        fontSize: 14,
        lineHeight: 20,
        fontFamily: "Outfit-Regular",
    },
    requestModalError: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        width: "100%",
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: Radii.md,
        backgroundColor: "rgba(255, 107, 107, 0.08)",
    },
    requestModalHistory: {
        width: "100%",
        gap: Spacing.sm,
    },
    requestModalHistoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: Spacing.xs,
    },
    requestModalHistoryItem: {
        gap: Spacing.sm,
        borderRadius: Radii.lg,
        padding: Spacing.md,
    },
    requestModalHistoryItemHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
    /* ---- QR Scanner Modal ---- */
    scannerContainer: {
        flex: 1,
    },
    scannerViewport: {
        flex: 1,
        margin: Spacing.xl,
        borderRadius: Radii.xl,
        overflow: "hidden",
        backgroundColor: "#000",
        position: "relative",
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    scannerTarget: {
        width: 240,
        height: 240,
        borderWidth: 2,
        borderColor: "#C9996B",
        borderRadius: Radii.lg,
    },
    scannerFooter: {
        padding: Spacing.xl,
        gap: Spacing.lg,
        paddingBottom: CONTENT_BOTTOM_PAD + 20,
    },
});
