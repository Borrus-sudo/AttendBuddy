import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ProgressBarProps = {
    label?: string;
    value: number;
    max: number;
    color?: string;
    /** Track height in px. */
    height?: number;
    /** Show label row above the bar. */
    showLabel?: boolean;
};

export function ProgressBar({
    label,
    value,
    max,
    color,
    height = 10,
    showLabel = true,
}: ProgressBarProps) {
    const muted = useThemeColor({}, "muted");
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    const percent = Math.round(ratio * 100);

    function getBarColor(): string {
        if (color) return color;
        if (percent >= 85) return isDark ? "#6BE0D8" : "#4ECDC4";
        if (percent >= 70) return isDark ? "#FFC76B" : "#FFB84D";
        return isDark ? "#FF8585" : "#FF6B6B";
    }

    return (
        <View style={styles.container}>
            {showLabel ? (
                <View style={styles.metaRow}>
                    <ThemedText style={[styles.label, { color: muted }]}>
                        {label || "Progress"}
                    </ThemedText>
                    <ThemedText style={[styles.percent, { color: muted }]}>
                        {percent}%
                    </ThemedText>
                </View>
            ) : null}

            <View
                style={[
                    styles.track,
                    {
                        height,
                        backgroundColor: isDark ? "#2A2B3A" : "#EDEDF5",
                    },
                ]}
            >
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${percent}%`,
                            height,
                            backgroundColor: getBarColor(),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: 8,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    label: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
    },
    percent: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
    },
    track: {
        borderRadius: 999,
        overflow: "hidden",
    },
    fill: {
        borderRadius: 999,
    },
});
