import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { ReactNode } from "react";

import { ThemedText } from "@/components/themed-text";
import { useThemeColor } from "@/hooks/use-theme-color";

type AppModalProps = {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
};

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
    const card = useThemeColor({}, "card");
    const border = useThemeColor({}, "border");

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
                        { backgroundColor: card, borderColor: border },
                    ]}
                >
                    <View style={styles.header}>
                        <ThemedText type="subtitle">{title}</ThemedText>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <ThemedText style={styles.closeText}>
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
        backgroundColor: "rgba(2, 6, 23, 0.45)",
    },
    backdrop: {
        flex: 1,
    },
    sheet: {
        borderTopWidth: 1,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 24,
        gap: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    closeButton: {
        minHeight: 30,
        justifyContent: "center",
    },
    closeText: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "700",
    },
});
