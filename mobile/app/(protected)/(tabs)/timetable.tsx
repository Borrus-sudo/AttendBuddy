import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Skeleton } from "@/components/ui/skeleton-loader";
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
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

type ScheduleBlock = {
    id: string;
    startTime: string;
    endTime: string;
    className: string;
    classCode: string;
    room: string;
    emoji: string;
    accentColor: string;
    bgColor: string;
};

type DaySchedule = {
    day: string;
    shortDay: string;
    blocks: ScheduleBlock[];
};

const DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_SLOTS = [
    { start: "9:00 AM", end: "9:50 AM" },
    { start: "10:00 AM", end: "10:50 AM" },
    { start: "11:00 AM", end: "11:50 AM" },
    { start: "1:00 PM", end: "1:50 PM" },
    { start: "2:00 PM", end: "2:50 PM" },
    { start: "3:00 PM", end: "3:50 PM" },
];

const DAY_PATTERNS = [
    [0, 2, 4], // MWF
    [1, 3], // TTh
    [0, 2], // MW
    [1, 3, 4], // TThF
    [0, 1, 3], // MTTh
    [2, 4], // WF
];

function parseTimeToMinutes(timeStr: string): number {
    const [hm, ampm] = timeStr.split(" ");
    const [h, m] = hm.split(":").map(Number);
    let hours = h;
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + m;
}

function isBlockActive(
    day: string,
    startTime: string,
    endTime: string,
): boolean {
    const now = new Date();
    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    if (dayNames[now.getDay()] !== day) return false;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return (
        nowMin >= parseTimeToMinutes(startTime) &&
        nowMin <= parseTimeToMinutes(endTime)
    );
}

function generateWeeklySchedule(
    classrooms: ClassroomSummary[],
    accentColors: typeof ClassAccentColors.light,
): DaySchedule[] {
    return DAYS.map((day, dayIdx) => {
        const blocks: ScheduleBlock[] = [];
        classrooms.forEach((classroom, classIdx) => {
            const pattern = DAY_PATTERNS[classIdx % DAY_PATTERNS.length];
            if (pattern.includes(dayIdx)) {
                const slotIdx = classIdx % TIME_SLOTS.length;
                const colors = accentColors[classIdx % accentColors.length];
                blocks.push({
                    id: `${classroom.code}-${day}`,
                    startTime: TIME_SLOTS[slotIdx].start,
                    endTime: TIME_SLOTS[slotIdx].end,
                    className: classroom.name,
                    classCode: classroom.code,
                    room: `Room ${101 + classIdx * 10}`,
                    emoji: getClassEmoji(classroom.name),
                    accentColor: colors.accent,
                    bgColor: colors.bg,
                });
            }
        });
        blocks.sort(
            (a, b) =>
                parseTimeToMinutes(a.startTime) -
                parseTimeToMinutes(b.startTime),
        );
        return { day, shortDay: SHORT_DAYS[dayIdx], blocks };
    });
}

function getCurrentDayIndex(): number {
    const jsDay = new Date().getDay(); // 0=Sun
    if (jsDay === 0) return 5; // Sunday → show Saturday
    return jsDay - 1; // Mon=0, Tue=1... Sat=5
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function TimetableScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const cardColor = useThemeColor({}, "card");
    const mutedColor = useThemeColor({}, "muted");
    const primaryColor = useThemeColor({}, "primary");
    const borderColor = useThemeColor({}, "border");

    const accentColors = isDark
        ? ClassAccentColors.dark
        : ClassAccentColors.light;

    const [classrooms, setClassrooms] = useState<ClassroomSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(getCurrentDayIndex);

    const loadData = useCallback(async () => {
        if (!user) return;
        try {
            const response = await getUserProfile(user.id);
            setClassrooms(response.payload.classrooms || []);
        } catch {
            /* degrade gracefully */
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const schedule = useMemo(
        () => generateWeeklySchedule(classrooms, accentColors),
        [classrooms, accentColors],
    );

    const todayBlocks = schedule[selectedDay]?.blocks || [];

    /* ---------- skeleton ---------- */

    if (isLoading) {
        return (
            <ThemedView
                style={[styles.container, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.skeletonContent}>
                    <Skeleton width={160} height={32} borderRadius={8} />
                    <Skeleton
                        width={180}
                        height={16}
                        borderRadius={6}
                        style={{ marginTop: 8 }}
                    />
                    <View style={[styles.dayRow, { marginTop: 24 }]}>
                        {SHORT_DAYS.map((d) => (
                            <Skeleton
                                key={d}
                                width={48}
                                height={72}
                                borderRadius={20}
                            />
                        ))}
                    </View>
                    <View style={{ gap: 12, marginTop: 16 }}>
                        <Skeleton height={100} borderRadius={24} />
                        <Skeleton height={100} borderRadius={24} />
                        <Skeleton height={100} borderRadius={24} />
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
            >
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Timetable</ThemedText>
                    <ThemedText
                        style={[styles.subtitle, { color: mutedColor }]}
                    >
                        Your weekly schedule
                    </ThemedText>
                </View>

                {/* Day Selector */}
                <View style={styles.dayRow}>
                    {schedule.map((daySchedule, idx) => {
                        const isSelected = idx === selectedDay;
                        const isToday = idx === getCurrentDayIndex();
                        return (
                            <Pressable
                                key={daySchedule.day}
                                onPress={() => setSelectedDay(idx)}
                                style={({ pressed }) => [
                                    styles.dayButton,
                                    {
                                        backgroundColor: isSelected
                                            ? primaryColor
                                            : isDark
                                              ? "#1E1F2B"
                                              : "#F0F1F5",
                                        opacity: pressed ? 0.85 : 1,
                                        transform: [
                                            { scale: pressed ? 0.95 : 1 },
                                        ],
                                    },
                                    isSelected ? Shadows.md : null,
                                ]}
                            >
                                <ThemedText
                                    style={[
                                        styles.dayLabel,
                                        {
                                            color: isSelected
                                                ? "#FFFFFF"
                                                : mutedColor,
                                        },
                                    ]}
                                >
                                    {daySchedule.shortDay}
                                </ThemedText>
                                {isToday && !isSelected ? (
                                    <View
                                        style={[
                                            styles.todayDot,
                                            { backgroundColor: primaryColor },
                                        ]}
                                    />
                                ) : null}
                                <ThemedText
                                    style={[
                                        styles.dayBlockCount,
                                        {
                                            color: isSelected
                                                ? "rgba(255,255,255,0.8)"
                                                : mutedColor,
                                        },
                                    ]}
                                >
                                    {daySchedule.blocks.length}
                                </ThemedText>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Schedule Day Title */}
                <ThemedText type="defaultSemiBold" style={styles.dayTitle}>
                    {DAYS[selectedDay]}
                </ThemedText>

                {/* Schedule blocks */}
                {todayBlocks.length === 0 ? (
                    <View
                        style={[
                            styles.emptyDay,
                            { backgroundColor: cardColor },
                        ]}
                    >
                        <ThemedText style={styles.emptyEmoji}>🌴</ThemedText>
                        <ThemedText type="defaultSemiBold">
                            No classes today
                        </ThemedText>
                        <ThemedText
                            style={[styles.emptyText, { color: mutedColor }]}
                        >
                            Enjoy your free time!
                        </ThemedText>
                    </View>
                ) : (
                    <View style={styles.blockList}>
                        {todayBlocks.map((block, blockIdx) => {
                            const active = isBlockActive(
                                DAYS[selectedDay],
                                block.startTime,
                                block.endTime,
                            );
                            return (
                                <Pressable
                                    key={block.id}
                                    onPress={() => {
                                        router.push({
                                            pathname: "/classroom/[code]",
                                            params: { code: block.classCode },
                                        } as never);
                                    }}
                                    style={({ pressed }) => [
                                        styles.blockCard,
                                        {
                                            backgroundColor: block.bgColor,
                                            borderColor: active
                                                ? block.accentColor
                                                : "transparent",
                                            borderWidth: active ? 2 : 0,
                                            opacity: pressed ? 0.9 : 1,
                                            transform: [
                                                { scale: pressed ? 0.98 : 1 },
                                            ],
                                        },
                                        active
                                            ? {
                                                  shadowColor:
                                                      block.accentColor,
                                                  shadowOpacity: 0.3,
                                                  shadowRadius: 16,
                                                  shadowOffset: {
                                                      width: 0,
                                                      height: 6,
                                                  },
                                                  elevation: 8,
                                              }
                                            : Shadows.sm,
                                    ]}
                                >
                                    <View style={styles.blockRow}>
                                        {/* Time column */}
                                        <View style={styles.timeColumn}>
                                            <ThemedText
                                                style={[
                                                    styles.timeText,
                                                    {
                                                        color: block.accentColor,
                                                    },
                                                ]}
                                            >
                                                {block.startTime}
                                            </ThemedText>
                                            <View
                                                style={[
                                                    styles.timeLine,
                                                    {
                                                        backgroundColor:
                                                            block.accentColor +
                                                            "40",
                                                    },
                                                ]}
                                            />
                                            <ThemedText
                                                style={[
                                                    styles.timeTextEnd,
                                                    { color: mutedColor },
                                                ]}
                                            >
                                                {block.endTime}
                                            </ThemedText>
                                        </View>

                                        {/* Content  */}
                                        <View style={styles.blockContent}>
                                            <View style={styles.blockHeaderRow}>
                                                <View
                                                    style={[
                                                        styles.blockEmoji,
                                                        {
                                                            backgroundColor:
                                                                block.accentColor +
                                                                "20",
                                                        },
                                                    ]}
                                                >
                                                    <ThemedText
                                                        style={{ fontSize: 18 }}
                                                    >
                                                        {block.emoji}
                                                    </ThemedText>
                                                </View>
                                                {active ? (
                                                    <View
                                                        style={[
                                                            styles.liveBadge,
                                                            {
                                                                backgroundColor:
                                                                    block.accentColor,
                                                            },
                                                        ]}
                                                    >
                                                        <ThemedText
                                                            style={
                                                                styles.liveText
                                                            }
                                                        >
                                                            NOW
                                                        </ThemedText>
                                                    </View>
                                                ) : null}
                                            </View>
                                            <ThemedText
                                                type="defaultSemiBold"
                                                numberOfLines={1}
                                            >
                                                {block.className}
                                            </ThemedText>
                                            <ThemedText
                                                style={[
                                                    styles.roomText,
                                                    { color: mutedColor },
                                                ]}
                                            >
                                                {block.room}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                )}

                {/* Info footer */}
                {classrooms.length > 0 ? (
                    <View style={styles.infoFooter}>
                        <ThemedText
                            style={[styles.infoText, { color: mutedColor }]}
                        >
                            💡 Schedule is auto-generated from your enrolled
                            classes. A real timetable feature is coming soon!
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
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: CONTENT_BOTTOM_PAD,
        gap: Spacing.xl,
    },
    skeletonContent: {
        paddingHorizontal: Spacing.xl,
    },

    /* header */
    header: { gap: Spacing.xs },
    title: { fontSize: 28, fontWeight: "800", lineHeight: 34 },
    subtitle: { fontSize: 14, lineHeight: 20 },

    /* day selector */
    dayRow: {
        flexDirection: "row",
        gap: Spacing.sm,
    },
    dayButton: {
        flex: 1,
        borderRadius: Radii.xl,
        paddingVertical: Spacing.md,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        minHeight: 72,
    },
    dayLabel: { fontSize: 13, fontWeight: "700" },
    dayBlockCount: { fontSize: 11, fontWeight: "600" },
    todayDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        marginTop: 2,
    },

    dayTitle: { fontSize: 17 },

    /* blocks */
    blockList: { gap: Spacing.md },
    blockCard: {
        borderRadius: Radii.xxl,
        padding: Spacing.lg,
    },
    blockRow: {
        flexDirection: "row",
        gap: Spacing.lg,
    },
    timeColumn: {
        alignItems: "center",
        width: 56,
        gap: Spacing.xs,
    },
    timeText: {
        fontSize: 12,
        fontWeight: "700",
    },
    timeLine: {
        width: 2,
        flex: 1,
        borderRadius: 1,
        minHeight: 20,
    },
    timeTextEnd: {
        fontSize: 11,
        fontWeight: "500",
    },
    blockContent: {
        flex: 1,
        gap: Spacing.sm,
    },
    blockHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    blockEmoji: {
        width: 38,
        height: 38,
        borderRadius: Radii.md,
        alignItems: "center",
        justifyContent: "center",
    },
    liveBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        borderRadius: Radii.full,
    },
    liveText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    roomText: { fontSize: 13 },

    /* empty day */
    emptyDay: {
        borderRadius: Radii.xxl,
        padding: Spacing.xxxl,
        alignItems: "center",
        gap: Spacing.sm,
        ...Shadows.md,
    },
    emptyEmoji: { fontSize: 48, marginBottom: Spacing.xs },
    emptyText: { textAlign: "center", fontSize: 14, lineHeight: 20 },

    /* info */
    infoFooter: {
        paddingTop: Spacing.lg,
    },
    infoText: { fontSize: 12, lineHeight: 18, textAlign: "center" },
});
