import { StyleSheet, Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
    lightColor?: string;
    darkColor?: string;
    type?:
        | "default"
        | "title"
        | "defaultSemiBold"
        | "subtitle"
        | "link"
        | "heading"
        | "caption"
        | "label";
};

export function ThemedText({
    style,
    lightColor,
    darkColor,
    type = "default",
    ...rest
}: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

    return (
        <Text
            style={[
                { color },
                type === "default" ? styles.default : undefined,
                type === "title" ? styles.title : undefined,
                type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
                type === "subtitle" ? styles.subtitle : undefined,
                type === "link" ? styles.link : undefined,
                type === "heading" ? styles.heading : undefined,
                type === "caption" ? styles.caption : undefined,
                type === "label" ? styles.label : undefined,
                style,
            ]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    default: {
        fontSize: 16,
        lineHeight: 24,
    },
    defaultSemiBold: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: "600",
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 38,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "bold",
        lineHeight: 26,
    },
    link: {
        lineHeight: 30,
        fontSize: 16,
        color: "#7C5CFC",
    },
    heading: {
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 30,
    },
    caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "500",
    },
    label: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
