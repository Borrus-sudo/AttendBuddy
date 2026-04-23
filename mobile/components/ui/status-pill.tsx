import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";

type StatusPillProps = {
    label: string;
    tone: "success" | "danger" | "muted" | "primary" | "warning";
};

const lightTones: Record<string, { bg: string; fg: string }> = {
    success: { bg: "#E5FAF6", fg: "#5C766D" },
    danger: { bg: "#FFE8E8", fg: "#E53E3E" },
    muted: { bg: "#EAE5E0", fg: "#8E8279" },
    primary: { bg: "#F5EFE9", fg: "#C9996B" },
    warning: { bg: "#FFF4E0", fg: "#D97706" },
};

export function StatusPill({ label, tone }: StatusPillProps) {
    const palette = lightTones[tone] || lightTones.muted;

    return (
        <View style={[styles.pill, { backgroundColor: palette.bg }]}>
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
