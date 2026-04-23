import {
    Pressable,
    StyleSheet,
    View,
    type TextStyle,
    type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Spacing, Radii } from "@/constants/theme";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    subtitleStyle?: TextStyle;
    rightSlot?: ReactNode;
    style?: ViewStyle;
    /** Show a back-arrow + label above the title */
    showBack?: boolean;
    /** Custom back label (default "Back") */
    backLabel?: string;
    /** Override the default router.back() behaviour */
    onBack?: () => void;
};

export function ScreenHeader({
    title,
    subtitle,
    subtitleStyle,
    rightSlot,
    style,
    showBack = false,
    backLabel = "Back",
    onBack,
}: ScreenHeaderProps) {
    const muted = useThemeColor({}, "muted");
    const primary = useThemeColor({}, "primary");

    return (
        <View style={[styles.container, style]}>
            {showBack ? (
                <Pressable
                    hitSlop={12}
                    style={({ pressed }) => [
                        styles.backButton,
                        {
                            opacity: pressed ? 0.6 : 1,
                            transform: [{ scale: pressed ? 0.96 : 1 }],
                        },
                    ]}
                    onPress={onBack ?? (() => router.back())}
                >
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={16}
                        color={primary}
                    />
                    <ThemedText style={[styles.backLabel, { color: primary }]}>
                        {backLabel}
                    </ThemedText>
                </Pressable>
            ) : null}

            <View style={styles.row}>
                <View style={styles.left}>
                    <ThemedText type="title" style={styles.title}>
                        {title}
                    </ThemedText>
                    {subtitle ? (
                        <ThemedText
                            style={[
                                styles.subtitle,
                                { color: muted },
                                subtitleStyle,
                            ]}
                        >
                            {subtitle}
                        </ThemedText>
                    ) : null}
                </View>

                {rightSlot ? (
                    <View style={styles.right}>{rightSlot}</View>
                ) : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
        minHeight: 64,
        paddingBottom: Spacing.md,
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        gap: 2,
        paddingVertical: Spacing.xs,
        minHeight: 44,
    },
    backLabel: {
        fontSize: 15,
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: Spacing.md,
    },
    left: {
        flex: 1,
        gap: Spacing.xs,
    },
    title: {
        fontSize: 28,
        lineHeight: 34,
    },
    subtitle: {
        fontSize: 14,
        lineHeight: 20,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
    },
});
