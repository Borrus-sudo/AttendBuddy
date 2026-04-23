import { StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Radii, Spacing } from "@/constants/theme";

type AppInputProps = {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export function AppInput({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    autoCapitalize = "sentences",
}: AppInputProps) {
    const text = useThemeColor({}, "text");
    const muted = useThemeColor({}, "muted");
    const colorScheme = useColorScheme();

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={[
                    styles.input,
                    multiline ? styles.multiline : null,
                    {
                        color: text,
                        backgroundColor: "rgba(240, 241, 245, 0.6)",
                    },
                ]}
                placeholder={placeholder}
                placeholderTextColor={muted}
                multiline={multiline}
                autoCapitalize={autoCapitalize}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
    input: {
        borderRadius: Radii.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: 15,
        lineHeight: 20,
        minHeight: 48,
        fontFamily: "Outfit-Regular",
    },
    multiline: {
        minHeight: 92,
        textAlignVertical: "top",
        paddingTop: Spacing.md,
    },
});
