/**
 * Attend Buddy — Premium Pastel Theme
 *
 * Soft, friendly palette inspired by modern EdTech dashboards.
 * Every existing key is preserved for backward compatibility.
 */

import { Platform } from "react-native";

const tintColorLight = "#7C5CFC";
const tintColorDark = "#9B7FFF";

export const Colors = {
    light: {
        text: "#2D3142",
        background: "#F7F8FC",
        tint: tintColorLight,
        icon: "#9094A6",
        tabIconDefault: "#BFC2D0",
        tabIconSelected: tintColorLight,
        card: "#FFFFFF",
        border: "#EDEDF5",
        muted: "#9094A6",
        primary: "#7C5CFC",
        secondary: "#5B8DEF",
        accent: "#FF6B9D",
        mint: "#4ECDC4",
        danger: "#FF6B6B",
        warning: "#FFB84D",
        success: "#4ECDC4",
        surfaceElevated: "#FFFFFF",
        gradientStart: "#7C5CFC",
        gradientEnd: "#5B8DEF",
    },
    dark: {
        text: "#E8E9F0",
        background: "#13141B",
        tint: tintColorDark,
        icon: "#6B6F82",
        tabIconDefault: "#4A4D5E",
        tabIconSelected: tintColorDark,
        card: "#1E1F2B",
        border: "#2A2B3A",
        muted: "#6B6F82",
        primary: "#9B7FFF",
        secondary: "#7BA4F7",
        accent: "#FF85B1",
        mint: "#6BE0D8",
        danger: "#FF8585",
        warning: "#FFC76B",
        success: "#6BE0D8",
        surfaceElevated: "#252636",
        gradientStart: "#9B7FFF",
        gradientEnd: "#7BA4F7",
    },
};

/** Per-card pastel accent colors — cycle through by index. */
export const ClassAccentColors = {
    light: [
        { bg: "#F0EAFF", accent: "#7C5CFC" },
        { bg: "#E8F4FD", accent: "#5B8DEF" },
        { bg: "#E5FAF6", accent: "#4ECDC4" },
        { bg: "#FFF0F5", accent: "#FF6B9D" },
        { bg: "#FFF7E8", accent: "#FFB84D" },
        { bg: "#F0FBF0", accent: "#6BCB77" },
    ],
    dark: [
        { bg: "#22203A", accent: "#9B7FFF" },
        { bg: "#1C2A3C", accent: "#7BA4F7" },
        { bg: "#1C322F", accent: "#6BE0D8" },
        { bg: "#3A1C2A", accent: "#FF85B1" },
        { bg: "#3A3220", accent: "#FFC76B" },
        { bg: "#1E3322", accent: "#7FDF8A" },
    ],
};

/** Map a class name to a friendly emoji icon. */
export function getClassEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes("math") || lower.includes("calculus") || lower.includes("algebra"))
        return "📐";
    if (lower.includes("physics")) return "🔬";
    if (lower.includes("chem")) return "🧪";
    if (lower.includes("bio")) return "🧬";
    if (lower.includes("english") || lower.includes("literature")) return "📝";
    if (lower.includes("history")) return "📜";
    if (lower.includes("geo")) return "🌍";
    if (
        lower.includes("computer") ||
        lower.includes("cs ") ||
        lower.includes("programming") ||
        lower.includes("dsa")
    )
        return "💻";
    if (lower.includes("art") || lower.includes("design")) return "🎨";
    if (lower.includes("music")) return "🎵";
    if (lower.includes("econ")) return "📊";
    if (lower.includes("psych")) return "🧠";
    if (lower.includes("philo")) return "💭";
    return "📚";
}

export const Fonts = Platform.select({
    ios: {
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: "system-ui",
        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: "ui-serif",
        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: "ui-rounded",
        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: "ui-monospace",
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace",
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded:
            "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});
