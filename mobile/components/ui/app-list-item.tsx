import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { ReactNode } from "react";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Radii, Shadows, Spacing } from "@/constants/theme";

type AppListItemProps = {
    title: string;
    subtitle?: string;
    avatarUri?: string | null;
    rightSlot?: ReactNode;
    onPress?: () => void;
};

export function AppListItem({
    title,
    subtitle,
    avatarUri,
    rightSlot,
    onPress,
}: AppListItemProps) {
    const muted = useThemeColor({}, "muted");
    const card = useThemeColor({}, "card");

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: card,
                    opacity: pressed ? 0.92 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                },
            ]}
        >
            <View style={styles.left}>
                {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                        <ThemedText style={styles.avatarText}>
                            {title.slice(0, 1).toUpperCase()}
                        </ThemedText>
                    </View>
                )}

                <View style={styles.textBlock}>
                    <ThemedText type="defaultSemiBold">{title}</ThemedText>
                    {subtitle ? (
                        <ThemedText style={[styles.subtitle, { color: muted }]}>
                            {subtitle}
                        </ThemedText>
                    ) : null}
                </View>
            </View>

            {rightSlot ? <View>{rightSlot}</View> : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radii.xl,
        minHeight: 64,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.md,
        ...Shadows.sm,
    },
    left: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarFallback: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#334155",
    },
    avatarText: {
        color: "#e2e8f0",
        fontWeight: "700",
    },
    textBlock: {
        flex: 1,
        gap: 2,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
});
