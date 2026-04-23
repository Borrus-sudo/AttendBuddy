import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Radii, Spacing } from "@/constants/theme";

export type SegmentOption<T extends string> = {
    label: string;
    value: T;
};

type SegmentedControlProps<T extends string> = {
    value: T;
    options: SegmentOption<T>[];
    onChange: (next: T) => void;
};

export function SegmentedControl<T extends string>({
    value,
    options,
    onChange,
}: SegmentedControlProps<T>) {
    const card = useThemeColor({}, "card");
    const primary = useThemeColor({}, "primary");
    const text = useThemeColor({}, "text");
    const muted = useThemeColor({}, "muted");

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: card },
            ]}
        >
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <Pressable
                        key={option.value}
                        style={({ pressed }) => [
                            styles.segment,
                            {
                                backgroundColor: active
                                    ? primary
                                    : "transparent",
                                opacity: pressed ? 0.9 : 1,
                            },
                        ]}
                        onPress={() => onChange(option.value)}
                    >
                        <ThemedText
                            style={{
                                color: active ? "#ecfeff" : muted,
                                fontWeight: active ? "700" : "600",
                                fontSize: 13,
                            }}
                        >
                            {option.label}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radii.xl,
        padding: Spacing.xs + 1,
        flexDirection: "row",
        gap: Spacing.xs,
        shadowColor: "#7C5CFC",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    segment: {
        flex: 1,
        minHeight: 40,
        borderRadius: Radii.lg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Spacing.sm,
    },
});
