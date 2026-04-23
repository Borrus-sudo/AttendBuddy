import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
    Circle as SvgCircle,
    Defs,
    LinearGradient as SvgLinearGradient,
    Stop,
} from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";

type CircularProgressProps = {
    /** Outer dimension in px. */
    size?: number;
    /** Ring thickness in px. */
    strokeWidth?: number;
    /** 0-100. */
    progress: number;
    /** Gradient start/end colours. Falls back to theme primary. */
    gradientColors?: [string, string];
    /** Track (unfilled) colour override. */
    trackColor?: string;
    /** Show the animated percentage label. */
    showPercentage?: boolean;
    /** Font-size for the percentage text. */
    percentageSize?: number;
    /** Small label below the percentage, e.g. "Attendance". */
    label?: string;
    labelSize?: number;
    /** Animation length in ms. */
    duration?: number;
};

export function CircularProgress({
    size = 120,
    strokeWidth = 10,
    progress,
    gradientColors,
    trackColor,
    showPercentage = true,
    percentageSize = 28,
    label,
    labelSize = 12,
    duration = 1200,
}: CircularProgressProps) {
    const colors: [string, string] = gradientColors || ["#C9996B", "#C9996B"];
    const track = trackColor || "#EAE5E0";

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    const clamped = Math.max(0, Math.min(100, isNaN(progress) ? 0 : progress));

    /* ---------- animation ---------- */
    const scaleAnim = useRef(new Animated.Value(0.85)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [displayProgress, setDisplayProgress] = useState(0);

    // Unique gradient id for multiple instances on the same screen.
    const gradientId = useMemo(
        () => `cpGrad_${Math.random().toString(36).slice(2, 8)}`,
        [],
    );

    useEffect(() => {
        const listener = progressAnim.addListener(({ value }) => {
            setDisplayProgress(value);
        });

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }),
            Animated.timing(progressAnim, {
                toValue: clamped,
                duration,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
        ]).start();

        return () => {
            progressAnim.removeListener(listener);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clamped]);

    const dashOffset = circumference - (displayProgress / 100) * circumference;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    width: size,
                    height: size,
                    transform: [{ scale: scaleAnim }],
                },
            ]}
        >
            <Svg width={size} height={size}>
                <Defs>
                    <SvgLinearGradient
                        id={gradientId}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                    >
                        <Stop offset="0%" stopColor={colors[0]} />
                        <Stop offset="100%" stopColor={colors[1]} />
                    </SvgLinearGradient>
                </Defs>

                {/* Track */}
                <SvgCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={track}
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Filled arc */}
                <SvgCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    rotation={-90}
                    originX={center}
                    originY={center}
                />
            </Svg>

            {showPercentage && (
                <View style={styles.labelWrap}>
                    <ThemedText
                        style={[
                            styles.percentText,
                            { fontSize: percentageSize },
                        ]}
                    >
                        {Math.round(displayProgress)}%
                    </ThemedText>
                    {label ? (
                        <ThemedText
                            style={[
                                styles.label,
                                {
                                    fontSize: labelSize,
                                    color: "#8E8279",
                                },
                            ]}
                        >
                            {label}
                        </ThemedText>
                    ) : null}
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
    labelWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
    },
    percentText: {
        fontWeight: "800",
    },
    label: {
        marginTop: 2,
        fontWeight: "600",
    },
});
