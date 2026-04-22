import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    LayoutAnimation,
    Pressable,
    ScrollView,
    StyleSheet,
    UIManager,
    View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppModal } from "@/components/ui/app-modal";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatusPill } from "@/components/ui/status-pill";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
    createAttendanceSession,
    formatSessionLabel,
    getClassroomByCode,
    getClassroomSessions,
    getMemberAttendanceAnalytics,
} from "@/lib/api";
import { useAuth } from "@/providers/auth-provider";
import type {
    AttendanceSessionSummary,
    ClassroomDetailPayload,
    ClassroomRole,
} from "@/types/api";

type TeacherTab = "members" | "sessions" | "create";
type StudentTab = "sessions" | "attendance" | "analytics";
type MemberStatus = "good" | "warning" | "critical";
type MemberSortBy =
    | "attendance_desc"
    | "attendance_asc"
    | "name_asc"
    | "last_attended_desc";

type MemberTableRow = {
    id: string;
    name: string;
    email: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    percentage: number;
    lastAttendedAt: string | null;
    status: MemberStatus;
};

function normalizeParam(value: string | string[] | undefined): string {
    if (!value) {
        return "";
    }
    return Array.isArray(value) ? value[0] || "" : value;
}

function getStatusFromPercentage(percentage: number): MemberStatus {
    if (percentage >= 85) {
        return "good";
    }
    if (percentage >= 70) {
        return "warning";
    }
    return "critical";
}

function getStatusTone(status: MemberStatus): "success" | "danger" | "muted" {
    if (status === "good") {
        return "success";
    }
    if (status === "critical") {
        return "danger";
    }
    return "muted";
}

function getStatusLabel(status: MemberStatus): string {
    if (status === "good") {
        return "Good";
    }
    if (status === "critical") {
        return "Critical";
    }
    return "Warning";
}

export default function ClassroomScreen() {
    const params = useLocalSearchParams<{ code: string }>();
    const classroomCode = normalizeParam(params.code);
    const { user } = useAuth();

    const muted = useThemeColor({}, "muted");
    const danger = useThemeColor({}, "danger");
    const border = useThemeColor({}, "border");
    const card = useThemeColor({}, "card");

    const [classroom, setClassroom] = useState<ClassroomDetailPayload | null>(
        null,
    );
    const [sessions, setSessions] = useState<AttendanceSessionSummary[]>([]);
    const [memberRows, setMemberRows] = useState<MemberTableRow[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isStartingSession, setIsStartingSession] = useState(false);
    const [isCopyingCode, setIsCopyingCode] = useState(false);
    const [isMemberRowsLoading, setIsMemberRowsLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);
    const [durationMinutes, setDurationMinutes] = useState(30);

    const [teacherTab, setTeacherTab] = useState<TeacherTab>("members");
    const [studentTab, setStudentTab] = useState<StudentTab>("sessions");

    const [queryInput, setQueryInput] = useState("");
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<MemberSortBy>("attendance_desc");
    const [statusFilter, setStatusFilter] = useState<MemberStatus[]>([]);
    const [minPct, setMinPct] = useState("");
    const [maxPct, setMaxPct] = useState("");
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showColumnModal, setShowColumnModal] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        present: true,
        absent: true,
        percentage: true,
        lastAttended: true,
    });

    useEffect(() => {
        if (UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setQuery(queryInput);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [queryInput]);

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

    const hydrateTeacherMemberRows = useCallback(
        async (
            members: ClassroomDetailPayload["members"],
        ): Promise<MemberTableRow[]> => {
            const rows = await Promise.all(
                members.map(async (member) => {
                    try {
                        const analytics = await getMemberAttendanceAnalytics(
                            classroomCode,
                            member.id,
                        );

                        return {
                            id: member.id,
                            name: member.name,
                            email: member.email,
                            totalSessions: analytics.totalSessions,
                            presentCount: analytics.presentCount,
                            absentCount: analytics.absentCount,
                            percentage: analytics.percentage,
                            lastAttendedAt:
                                analytics.recent[0]?.createdAt ?? null,
                            status: getStatusFromPercentage(analytics.percentage),
                        } satisfies MemberTableRow;
                    } catch {
                        return {
                            id: member.id,
                            name: member.name,
                            email: member.email,
                            totalSessions: 0,
                            presentCount: 0,
                            absentCount: 0,
                            percentage: 0,
                            lastAttendedAt: null,
                            status: "critical",
                        } satisfies MemberTableRow;
                    }
                }),
            );

            return rows;
        },
        [classroomCode],
    );

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

            const isTeacherView =
                !!user && classroomResponse.payload.creatorId === user.id;

            if (isTeacherView) {
                setIsMemberRowsLoading(true);
                const rows = await hydrateTeacherMemberRows(
                    classroomResponse.payload.members,
                );
                setMemberRows(rows);
                setIsMemberRowsLoading(false);
            } else {
                setMemberRows([]);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load classroom.",
            );
            setIsMemberRowsLoading(false);
        } finally {
            setIsLoading(false);
        }
    }, [classroomCode, hydrateTeacherMemberRows, user]);

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

            const isTeacherView =
                !!user && classroomResponse.payload.creatorId === user.id;

            if (isTeacherView) {
                setIsMemberRowsLoading(true);
                const rows = await hydrateTeacherMemberRows(
                    classroomResponse.payload.members,
                );
                setMemberRows(rows);
                setIsMemberRowsLoading(false);
            } else {
                setMemberRows([]);
            }
        } finally {
            setIsRefreshing(false);
            setIsMemberRowsLoading(false);
        }
    }, [classroomCode, hydrateTeacherMemberRows, user]);

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

    const filteredMemberRows = useMemo(() => {
        const minValue = Number(minPct);
        const maxValue = Number(maxPct);
        const hasMin = minPct.trim().length > 0 && Number.isFinite(minValue);
        const hasMax = maxPct.trim().length > 0 && Number.isFinite(maxValue);
        const normalizedQuery = query.trim().toLowerCase();

        const filtered = memberRows.filter((row) => {
            const matchesQuery =
                normalizedQuery.length === 0 ||
                row.name.toLowerCase().includes(normalizedQuery) ||
                row.email.toLowerCase().includes(normalizedQuery);

            const matchesStatus =
                statusFilter.length === 0 || statusFilter.includes(row.status);

            const matchesRange =
                (!hasMin || row.percentage >= minValue) &&
                (!hasMax || row.percentage <= maxValue);

            return matchesQuery && matchesStatus && matchesRange;
        });

        return filtered.sort((a, b) => {
            if (sortBy === "name_asc") {
                return a.name.localeCompare(b.name);
            }

            if (sortBy === "attendance_asc") {
                return a.percentage - b.percentage;
            }

            if (sortBy === "last_attended_desc") {
                const aTime = a.lastAttendedAt
                    ? new Date(a.lastAttendedAt).getTime()
                    : 0;
                const bTime = b.lastAttendedAt
                    ? new Date(b.lastAttendedAt).getTime()
                    : 0;
                return bTime - aTime;
            }

            return b.percentage - a.percentage;
        });
    }, [maxPct, memberRows, minPct, query, sortBy, statusFilter]);

    const activeFilterChips = useMemo(() => {
        const chips: Array<{ key: string; label: string }> = [];

        for (const status of statusFilter) {
            chips.push({
                key: `status-${status}`,
                label: `Status: ${getStatusLabel(status)}`,
            });
        }

        if (minPct.trim()) {
            chips.push({ key: "min", label: `Min ${minPct}%` });
        }

        if (maxPct.trim()) {
            chips.push({ key: "max", label: `Max ${maxPct}%` });
        }

        return chips;
    }, [maxPct, minPct, statusFilter]);

    const activeSortLabel = useMemo(() => {
        if (sortBy === "attendance_asc") {
            return "Attendance: low to high";
        }
        if (sortBy === "name_asc") {
            return "Name: A-Z";
        }
        if (sortBy === "last_attended_desc") {
            return "Last attended: recent first";
        }
        return "Attendance: high to low";
    }, [sortBy]);

    const toggleStatusFilter = useCallback((status: MemberStatus) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStatusFilter((prev) =>
            prev.includes(status)
                ? prev.filter((item) => item !== status)
                : [...prev, status],
        );
    }, []);

    const resetFilters = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStatusFilter([]);
        setMinPct("");
        setMaxPct("");
    }, []);

    const toggleColumn = useCallback(
        (key: keyof typeof visibleColumns) => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setVisibleColumns((prev) => ({
                ...prev,
                [key]: !prev[key],
            }));
        },
        [],
    );

    const renderMemberRow = useCallback(
        ({ item, index }: { item: MemberTableRow; index: number }) => {
            const isExpanded = expandedRowId === item.id;
            const isRisk = item.status === "critical";

            return (
                <Pressable
                    onPress={() => {
                        LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                        );
                        setExpandedRowId((prev) =>
                            prev === item.id ? null : item.id,
                        );
                    }}
                    onLongPress={() => {
                        router.push(
                            `/classroom/${classroomCode}/member/${item.id}` as never,
                        );
                    }}
                    style={({ pressed }) => [
                        styles.tableRow,
                        {
                            backgroundColor:
                                isRisk && !pressed
                                    ? "rgba(127, 29, 29, 0.18)"
                                    : index % 2 === 0
                                      ? card
                                      : "rgba(51, 65, 85, 0.18)",
                            opacity: pressed ? 0.85 : 1,
                        },
                    ]}
                >
                    <View style={[styles.tableCellName, styles.tableCellBase]}>
                        <ThemedText type="defaultSemiBold" numberOfLines={1}>
                            {item.name}
                        </ThemedText>
                        <ThemedText style={{ color: muted }} numberOfLines={1}>
                            {item.email}
                        </ThemedText>
                        <StatusPill
                            label={getStatusLabel(item.status)}
                            tone={getStatusTone(item.status)}
                        />
                    </View>

                    {visibleColumns.present ? (
                        <View style={[styles.tableCellSmall, styles.tableCellBase]}>
                            <ThemedText>{item.presentCount}</ThemedText>
                        </View>
                    ) : null}

                    {visibleColumns.absent ? (
                        <View style={[styles.tableCellSmall, styles.tableCellBase]}>
                            <ThemedText>{item.absentCount}</ThemedText>
                        </View>
                    ) : null}

                    {visibleColumns.percentage ? (
                        <View style={[styles.tableCellSmall, styles.tableCellBase]}>
                            <ThemedText
                                style={
                                    item.status === "good"
                                        ? styles.goodPercent
                                        : item.status === "warning"
                                          ? styles.warnPercent
                                          : styles.riskPercent
                                }
                            >
                                {item.percentage}%
                            </ThemedText>
                        </View>
                    ) : null}

                    {visibleColumns.lastAttended ? (
                        <View style={[styles.tableCellSmall, styles.tableCellBase]}>
                            <ThemedText style={{ color: muted }}>
                                {item.lastAttendedAt
                                    ? formatSessionLabel(item.lastAttendedAt)
                                    : "-"}
                            </ThemedText>
                        </View>
                    ) : null}

                    {isExpanded ? (
                        <View style={styles.expandArea}>
                            <AppButton
                                label="Open member details"
                                variant="secondary"
                                onPress={() => {
                                    router.push(
                                        `/classroom/${classroomCode}/member/${item.id}` as never,
                                    );
                                }}
                            />
                        </View>
                    ) : null}
                </Pressable>
            );
        },
        [card, classroomCode, expandedRowId, muted, visibleColumns],
    );

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

    const insets = useSafeAreaInsets();

    return (
        <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
            <ScreenHeader
                showBack
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
                <ScrollView
                    style={styles.membersArea}
                    contentContainerStyle={styles.membersScrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={[
                            styles.controlBar,
                            { borderColor: border, backgroundColor: card },
                        ]}
                    >
                        <View style={styles.searchWrap}>
                            <AppInput
                                label="Search"
                                value={queryInput}
                                onChangeText={setQueryInput}
                                placeholder="Find by name or email"
                            />
                        </View>
                        <View style={styles.controlButtonsRow}>
                            <AppButton
                                label="Filter"
                                variant="secondary"
                                onPress={() => setShowFilterModal(true)}
                            />
                            <AppButton
                                label="Sort"
                                variant="secondary"
                                onPress={() => setShowSortModal(true)}
                            />
                            <AppButton
                                label="Columns"
                                variant="ghost"
                                onPress={() => setShowColumnModal(true)}
                            />
                        </View>
                    </View>

                    <View style={styles.activeMetaRow}>
                        <StatusPill label={activeSortLabel} tone="muted" />
                        {activeFilterChips.map((chip) => (
                            <Pressable
                                key={chip.key}
                                style={styles.filterChip}
                                onPress={() => {
                                    if (chip.key.startsWith("status-")) {
                                        const key = chip.key.replace(
                                            "status-",
                                            "",
                                        ) as MemberStatus;
                                        toggleStatusFilter(key);
                                        return;
                                    }
                                    if (chip.key === "min") {
                                        setMinPct("");
                                        return;
                                    }
                                    if (chip.key === "max") {
                                        setMaxPct("");
                                    }
                                }}
                            >
                                <ThemedText style={styles.filterChipText}>
                                    {chip.label} x
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>

                    <View style={[styles.tableShell, { borderColor: border }]}> 
                        <View style={[styles.tableHeader, { borderColor: border }]}> 
                            <ThemedText style={[styles.tableHeaderName]}>Student</ThemedText>
                            {visibleColumns.present ? (
                                <ThemedText style={styles.tableHeaderCell}>P</ThemedText>
                            ) : null}
                            {visibleColumns.absent ? (
                                <ThemedText style={styles.tableHeaderCell}>A</ThemedText>
                            ) : null}
                            {visibleColumns.percentage ? (
                                <ThemedText style={styles.tableHeaderCell}>%</ThemedText>
                            ) : null}
                            {visibleColumns.lastAttended ? (
                                <ThemedText style={styles.tableHeaderCell}>Last</ThemedText>
                            ) : null}
                        </View>

                        {isMemberRowsLoading ? (
                            <View style={styles.skeletonWrap}>
                                {[1, 2, 3, 4, 5].map((item) => (
                                    <View
                                        key={item}
                                        style={[
                                            styles.skeletonRow,
                                            { borderColor: border },
                                        ]}
                                    />
                                ))}
                            </View>
                        ) : filteredMemberRows.length === 0 ? (
                            <View style={styles.memberEmptyArea}>
                                <ThemedText>No results found.</ThemedText>
                                <AppButton
                                    label="Reset Filters"
                                    variant="secondary"
                                    onPress={resetFilters}
                                />
                            </View>
                        ) : (
                            <View style={styles.memberRowsWrap}>
                                <FlatList
                                    nestedScrollEnabled
                                    data={filteredMemberRows}
                                    keyExtractor={(item) => item.id}
                                    renderItem={renderMemberRow}
                                    contentContainerStyle={styles.memberRowsContent}
                                />
                            </View>
                        )}
                    </View>
                </ScrollView>
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
                    renderItem={({ item }) => {
                        const isExpired =
                            item.isClosed ||
                            new Date(item.expiresAt).getTime() < Date.now();

                        return (
                            <AppCard style={styles.sessionCard}>
                                <View style={styles.sessionRow}>
                                    <View style={styles.sessionDetails}>
                                        <ThemedText type="defaultSemiBold">
                                            {formatSessionLabel(item.createdAt)}
                                        </ThemedText>
                                        <ThemedText style={{ color: muted }}>
                                            {item.presentCount}/{item.totalCount} students present
                                        </ThemedText>
                                    </View>
                                    <View style={styles.sessionPills}>
                                        <StatusPill
                                            label={isExpired ? "Expired" : "Active"}
                                            tone={isExpired ? "danger" : "success"}
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
                        );
                    }}
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

            <AppModal
                visible={showSortModal}
                title="Sort Students"
                onClose={() => setShowSortModal(false)}
            >
                <View style={styles.modalBody}>
                    <AppButton
                        label="Attendance % high to low"
                        variant={sortBy === "attendance_desc" ? "primary" : "secondary"}
                        onPress={() => {
                            setSortBy("attendance_desc");
                            setShowSortModal(false);
                        }}
                    />
                    <AppButton
                        label="Attendance % low to high"
                        variant={sortBy === "attendance_asc" ? "primary" : "secondary"}
                        onPress={() => {
                            setSortBy("attendance_asc");
                            setShowSortModal(false);
                        }}
                    />
                    <AppButton
                        label="Name A-Z"
                        variant={sortBy === "name_asc" ? "primary" : "secondary"}
                        onPress={() => {
                            setSortBy("name_asc");
                            setShowSortModal(false);
                        }}
                    />
                    <AppButton
                        label="Last attended recent"
                        variant={
                            sortBy === "last_attended_desc"
                                ? "primary"
                                : "secondary"
                        }
                        onPress={() => {
                            setSortBy("last_attended_desc");
                            setShowSortModal(false);
                        }}
                    />
                </View>
            </AppModal>

            <AppModal
                visible={showFilterModal}
                title="Filter Students"
                onClose={() => setShowFilterModal(false)}
            >
                <View style={styles.modalBody}>
                    <ThemedText type="defaultSemiBold">Status</ThemedText>
                    <View style={styles.statusChipRow}>
                        {(["good", "warning", "critical"] as MemberStatus[]).map(
                            (status) => (
                                <AppButton
                                    key={status}
                                    label={getStatusLabel(status)}
                                    variant={
                                        statusFilter.includes(status)
                                            ? "primary"
                                            : "secondary"
                                    }
                                    onPress={() => toggleStatusFilter(status)}
                                />
                            ),
                        )}
                    </View>

                    <AppInput
                        label="Min attendance %"
                        value={minPct}
                        onChangeText={setMinPct}
                        placeholder="e.g. 60"
                    />
                    <AppInput
                        label="Max attendance %"
                        value={maxPct}
                        onChangeText={setMaxPct}
                        placeholder="e.g. 90"
                    />

                    <View style={styles.filterActions}>
                        <AppButton
                            label="Reset"
                            variant="secondary"
                            onPress={resetFilters}
                        />
                        <AppButton
                            label="Apply"
                            onPress={() => setShowFilterModal(false)}
                        />
                    </View>
                </View>
            </AppModal>

            <AppModal
                visible={showColumnModal}
                title="Toggle Columns"
                onClose={() => setShowColumnModal(false)}
            >
                <View style={styles.modalBody}>
                    <AppButton
                        label={`Present: ${visibleColumns.present ? "On" : "Off"}`}
                        variant={visibleColumns.present ? "primary" : "secondary"}
                        onPress={() => toggleColumn("present")}
                    />
                    <AppButton
                        label={`Absent: ${visibleColumns.absent ? "On" : "Off"}`}
                        variant={visibleColumns.absent ? "primary" : "secondary"}
                        onPress={() => toggleColumn("absent")}
                    />
                    <AppButton
                        label={`%: ${visibleColumns.percentage ? "On" : "Off"}`}
                        variant={visibleColumns.percentage ? "primary" : "secondary"}
                        onPress={() => toggleColumn("percentage")}
                    />
                    <AppButton
                        label={`Last: ${visibleColumns.lastAttended ? "On" : "Off"}`}
                        variant={
                            visibleColumns.lastAttended ? "primary" : "secondary"
                        }
                        onPress={() => toggleColumn("lastAttended")}
                    />
                </View>
            </AppModal>
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
    membersArea: {
        flex: 1,
        gap: 10,
    },
    membersScrollContent: {
        paddingBottom: 16,
        gap: 10,
    },
    controlBar: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    searchWrap: {
        gap: 6,
    },
    controlButtonsRow: {
        flexDirection: "row",
        gap: 8,
    },
    activeMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    filterChip: {
        backgroundColor: "rgba(51, 65, 85, 0.55)",
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    filterChipText: {
        fontSize: 12,
        lineHeight: 16,
    },
    tableShell: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 14,
        overflow: "hidden",
    },
    tableHeader: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
    },
    tableHeaderName: {
        flex: 2.8,
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    tableHeaderCell: {
        flex: 1,
        textAlign: "right",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    skeletonWrap: {
        padding: 10,
        gap: 8,
    },
    skeletonRow: {
        height: 56,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: "rgba(51, 65, 85, 0.3)",
    },
    memberRowsContent: {
        paddingBottom: 14,
    },
    memberRowsWrap: {
        maxHeight: 430,
    },
    memberEmptyArea: {
        padding: 16,
        gap: 10,
        alignItems: "flex-start",
    },
    tableRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(51, 65, 85, 0.35)",
    },
    tableCellBase: {
        paddingRight: 8,
    },
    tableCellName: {
        flex: 2.8,
        gap: 4,
    },
    tableCellSmall: {
        flex: 1,
        alignItems: "flex-end",
    },
    expandArea: {
        width: "100%",
        marginTop: 10,
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
    modalBody: {
        gap: 12,
    },
    statusChipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    filterActions: {
        flexDirection: "row",
        gap: 10,
    },
    goodPercent: {
        color: "#4ade80",
        fontWeight: "700",
    },
    warnPercent: {
        color: "#facc15",
        fontWeight: "700",
    },
    riskPercent: {
        color: "#f87171",
        fontWeight: "700",
    },
});
