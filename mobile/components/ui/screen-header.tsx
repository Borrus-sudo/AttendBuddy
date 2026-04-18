import { StyleSheet, View, type ViewStyle } from "react-native";
import type { ReactNode } from "react";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type ScreenHeaderProps = {
    title: string;
    subtitle?: string;
    rightSlot?: ReactNode;
    style?: ViewStyle;
};

export function ScreenHeader({
    title,
    subtitle,
    rightSlot,
    style,
}: ScreenHeaderProps) {
    const muted = useThemeColor({}, "muted");

    return (
        <View style={[styles.container, style]}>
            <View style={styles.left}>
                <ThemedText type="title" style={styles.title}>
                    {title}
                </ThemedText>
                {subtitle ? (
                    <ThemedText style={[styles.subtitle, { color: muted }]}>
                        {subtitle}
                    </ThemedText>
                ) : null}
            </View>

            {rightSlot ? <View style={styles.right}>{rightSlot}</View> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 10,
    },
    left: {
        flex: 1,
    },
    title: {
        fontSize: 30,
        lineHeight: 34,
    },
    subtitle: {
        marginTop: 3,
        fontSize: 14,
        lineHeight: 20,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});
