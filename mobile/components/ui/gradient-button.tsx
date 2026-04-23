import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";

type GradientButtonProps = {
    label: string;
    onPress: () => void;
    colors?: [string, string, ...string[]];
    style?: ViewStyle;
    disabled?: boolean;
    loading?: boolean;
};

export function GradientButton({
    label,
    onPress,
    colors,
    style,
    disabled = false,
    loading = false,
}: GradientButtonProps) {
    const defaultColors: [string, string] = ["#C9996B", "#DFB892"];

    const isDisabled = disabled || loading;

    return (
        <Pressable
            disabled={isDisabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.pressable,
                {
                    opacity: isDisabled ? 0.55 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                },
                style,
            ]}
        >
            <LinearGradient
                colors={colors || defaultColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                    <ThemedText style={styles.label}>{label}</ThemedText>
                )}
            </LinearGradient>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        borderRadius: 16,
        overflow: "hidden",
    },
    gradient: {
        minHeight: 52,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    label: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
