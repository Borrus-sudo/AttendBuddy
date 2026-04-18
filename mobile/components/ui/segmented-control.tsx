import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

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
    const border = useThemeColor({}, "border");
    const card = useThemeColor({}, "card");
    const primary = useThemeColor({}, "primary");
    const text = useThemeColor({}, "text");

    return (
        <View
            style={[
                styles.container,
                { borderColor: border, backgroundColor: card },
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
                                color: active ? "#ecfeff" : text,
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
        borderWidth: 1,
        borderRadius: 14,
        padding: 4,
        flexDirection: "row",
        gap: 4,
    },
    segment: {
        flex: 1,
        minHeight: 34,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 6,
    },
});
