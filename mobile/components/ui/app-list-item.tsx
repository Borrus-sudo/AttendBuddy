import { Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import type { ReactNode } from "react";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

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
    const border = useThemeColor({}, "border");
    const muted = useThemeColor({}, "muted");
    const card = useThemeColor({}, "card");

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: card,
                    borderColor: border,
                    opacity: pressed ? 0.92 : 1,
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
        borderWidth: 1,
        borderRadius: 14,
        minHeight: 64,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    left: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
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
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
});
