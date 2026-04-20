import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";

type StatusPillProps = {
    label: string;
    tone: "success" | "danger" | "muted" | "primary" | "warning";
};

const lightTones: Record<string, { bg: string; fg: string }> = {
    success: { bg: "#E5FAF6", fg: "#0F9B6F" },
    danger: { bg: "#FFE8E8", fg: "#E53E3E" },
    muted: { bg: "#F0F1F5", fg: "#6B7280" },
    primary: { bg: "#F0EAFF", fg: "#7C5CFC" },
    warning: { bg: "#FFF4E0", fg: "#D97706" },
};

const darkTones: Record<string, { bg: string; fg: string }> = {
    success: { bg: "#1A3A32", fg: "#6BE0D8" },
    danger: { bg: "#3A1A1A", fg: "#FF8585" },
    muted: { bg: "#2A2B3A", fg: "#9CA3AF" },
    primary: { bg: "#2A2240", fg: "#9B7FFF" },
    warning: { bg: "#3A3220", fg: "#FFC76B" },
};

export function StatusPill({ label, tone }: StatusPillProps) {
    const colorScheme = useColorScheme();
    const palette = (colorScheme === "dark" ? darkTones : lightTones)[tone] ||
        lightTones.muted;

    return (
        <View
            style={[styles.pill, { backgroundColor: palette.bg }]}
        >
            <ThemedText style={[styles.label, { color: palette.fg }]}>
                {label}
            </ThemedText>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    label: {
        fontSize: 12,
        lineHeight: 14,
        fontWeight: "700",
    },
});
