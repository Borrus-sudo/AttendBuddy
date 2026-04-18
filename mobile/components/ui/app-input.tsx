import { StyleSheet, TextInput, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

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
    const border = useThemeColor({}, "border");

    return (
        <View style={styles.container}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                style={[
                    styles.input,
                    multiline ? styles.multiline : null,
                    { color: text, borderColor: border },
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
        gap: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        lineHeight: 20,
    },
    multiline: {
        minHeight: 92,
        textAlignVertical: "top",
    },
});
