import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
    type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Radii, Shadows, Spacing } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type AppButtonProps = {
    label: string;
    onPress: () => void;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    leftIcon?: ReactNode;
    style?: ViewStyle;
};

export function AppButton({
    label,
    onPress,
    variant = "primary",
    loading = false,
    disabled = false,
    leftIcon,
    style,
}: AppButtonProps) {
    const primary = useThemeColor({}, "primary");
    const border = useThemeColor({}, "border");
    const danger = useThemeColor({}, "danger");
    const text = useThemeColor({}, "text");

    const isDisabled = disabled || loading;

    const palette =
        variant === "primary"
            ? {
                  backgroundColor: primary,
                  borderColor: primary,
                  textColor: "#f8fafc",
              }
            : variant === "secondary"
              ? {
                    backgroundColor: "transparent",
                    borderColor: border,
                    textColor: text,
                }
              : variant === "danger"
                ? {
                      backgroundColor: danger,
                      borderColor: danger,
                      textColor: "#fff1f2",
                  }
                : {
                      backgroundColor: "transparent",
                      borderColor: "transparent",
                      textColor: text,
                  };

    return (
        <Pressable
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: palette.backgroundColor,
                    borderColor: palette.borderColor,
                    opacity: isDisabled ? 0.55 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                },
                variant === "primary" ? Shadows.sm : null,
                style,
            ]}
            onPress={onPress}
        >
            <View style={styles.content}>
                {loading ? (
                    <ActivityIndicator size="small" color={palette.textColor} />
                ) : leftIcon ? (
                    leftIcon
                ) : null}
                <ThemedText
                    style={[styles.label, { color: palette.textColor }]}
                >
                    {label}
                </ThemedText>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        minHeight: 48,
        borderRadius: Radii.lg,
        borderWidth: 1,
        paddingHorizontal: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
    },
    label: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "700",
    },
});
