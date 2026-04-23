import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Radii, Shadows, Spacing } from "@/constants/theme";

type AppModalProps = {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
    const card = useThemeColor({}, "card");
    const muted = useThemeColor({}, "muted");
    const insets = useSafeAreaInsets();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: card,
                            paddingBottom: Math.max(insets.bottom, 24) + 8,
                        },
                    ]}
                >
                    <View style={styles.handleBar} />
                    <View style={styles.header}>
                        <ThemedText type="subtitle">{title}</ThemedText>
                        <Pressable
                            onPress={onClose}
                            style={styles.closeButton}
                            hitSlop={12}
                        >
                            <ThemedText
                                style={[styles.closeText, { color: muted }]}
                            >
                                Close
                            </ThemedText>
                        </Pressable>
                    </View>
                    {children}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(2, 6, 23, 0.5)",
    },
    backdrop: {
        flex: 1,
    },
    sheet: {
        borderTopLeftRadius: Radii.xxxl,
        borderTopRightRadius: Radii.xxxl,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        gap: Spacing.lg,
        ...Shadows.lg,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(128, 128, 128, 0.3)",
        alignSelf: "center",
        marginBottom: Spacing.xs,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closeButton: {
        minHeight: 44,
        minWidth: 44,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    closeText: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "700",
    },
});
