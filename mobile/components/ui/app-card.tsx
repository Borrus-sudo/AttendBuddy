import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

type AppCardProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    padded?: boolean;
};

export function AppCard({ children, style, padded = true }: AppCardProps) {
    const cardColor = useThemeColor({}, "card");
    const borderColor = useThemeColor({}, "border");

    return (
        <View
            style={[
                styles.card,
                padded ? styles.padded : null,
                { backgroundColor: cardColor, borderColor },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
        borderRadius: 16,
        shadowColor: "#020617",
        shadowOpacity: 0.25,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
    },
    padded: {
        padding: 14,
    },
});
