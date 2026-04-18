import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";

type StatusPillProps = {
    label: string;
    tone: "success" | "danger" | "muted";
};

const toneMap = {
    success: {
        backgroundColor: "#14532d",
        color: "#bbf7d0",
    },
    danger: {
        backgroundColor: "#7f1d1d",
        color: "#fecaca",
    },
    muted: {
        backgroundColor: "#334155",
        color: "#e2e8f0",
    },
};

export function StatusPill({ label, tone }: StatusPillProps) {
    return (
        <View
            style={[
                styles.pill,
                { backgroundColor: toneMap[tone].backgroundColor },
            ]}
        >
            <ThemedText style={[styles.label, { color: toneMap[tone].color }]}>
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
