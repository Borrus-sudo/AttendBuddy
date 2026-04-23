import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";
import { Radii, Shadows, Spacing } from "@/constants/theme";

type AppCardProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    padded?: boolean;
};

export function AppCard({ children, style, padded = true }: AppCardProps) {
    const cardColor = useThemeColor({}, "card");

    return (
        <View
            style={[
                styles.card,
                padded ? styles.padded : null,
                { backgroundColor: cardColor },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Radii.xxl,
        ...Shadows.md,
    },
    padded: {
        padding: Spacing.lg,
    },
});
