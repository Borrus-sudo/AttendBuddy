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
        borderRadius: 20,
        shadowColor: "#7C5CFC",
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    padded: {
        padding: 16,
    },
});
