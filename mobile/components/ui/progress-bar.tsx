import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type ProgressBarProps = {
    label?: string;
    value: number;
    max: number;
    color?: string;
};

export function ProgressBar({ label, value, max, color }: ProgressBarProps) {
    const muted = useThemeColor({}, "muted");
    const border = useThemeColor({}, "border");
    const primary = useThemeColor({}, "primary");

    const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
    const percent = Math.round(ratio * 100);

    return (
        <View style={styles.container}>
            <View style={styles.metaRow}>
                <ThemedText style={[styles.label, { color: muted }]}>
                    {label || "Progress"}
                </ThemedText>
                <ThemedText style={[styles.percent, { color: muted }]}>
                    {percent}%
                </ThemedText>
            </View>

            <View style={[styles.track, { borderColor: border }]}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${percent}%`,
                            backgroundColor: color || primary,
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
    },
    track: {
        height: 11,
        borderRadius: 999,
        borderWidth: 1,
        overflow: "hidden",
    },
    fill: {
        height: "100%",
        borderRadius: 999,
    },
});
