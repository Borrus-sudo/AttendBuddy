import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

import { useColorScheme } from "@/hooks/use-color-scheme";

type SkeletonProps = {
    width?: number | `${number}%` | "auto";
    height?: number;
    borderRadius?: number;
    /** If true, renders as a circle (width = height = height). */
    circle?: boolean;
    style?: StyleProp<ViewStyle>;
};

export function Skeleton({
    width = "100%",
    height = 20,
    borderRadius = 12,
    circle = false,
    style,
}: SkeletonProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const opacity = useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.35,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]),
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);

    const size = circle ? height : undefined;

    return (
        <Animated.View
            style={[
                {
                    width: circle ? size : width,
                    height,
                    borderRadius: circle ? height / 2 : borderRadius,
                    backgroundColor: isDark ? "#2A2B3A" : "#E4E5EE",
                    opacity,
                },
                style,
            ]}
        />
    );
}
