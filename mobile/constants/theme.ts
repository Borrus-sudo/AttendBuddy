/**
 * Attend Buddy — Premium Aesthetic Theme
 *
 * Sophisticated, earthy palette with a focus on elegance and clarity.
 * Dark Mode is disabled to enforce this premium light aesthetic.
 */

import { Platform } from "react-native";

const tintColorLight = "#C9996B";

export const Colors = {
    light: {
        text: "#5C4F4A",
        background: "#EDE9E6",
        tint: tintColorLight,
        icon: "#8E8279",
        tabIconDefault: "#B1A8A1",
        tabIconSelected: tintColorLight,
        card: "#F8F6F4",
        border: "#DCD5CF",
        muted: "#8E8279",
        primary: "#C9996B",
        secondary: "#5C766D",
        accent: "#C9996B",
        mint: "#5C766D",
        danger: "#E07A5F",
        warning: "#E2A862",
        success: "#5C766D",
        surfaceElevated: "#FFFFFF",
        gradientStart: "#C9996B",
        gradientEnd: "#DFB892",
    },
    dark: {
        // Dark mode disabled; mapping to light
        text: "#5C4F4A",
        background: "#EDE9E6",
        tint: tintColorLight,
        icon: "#8E8279",
        tabIconDefault: "#B1A8A1",
        tabIconSelected: tintColorLight,
        card: "#F8F6F4",
        border: "#DCD5CF",
        muted: "#8E8279",
        primary: "#C9996B",
        secondary: "#5C766D",
        accent: "#C9996B",
        mint: "#5C766D",
        danger: "#E07A5F",
        warning: "#E2A862",
        success: "#5C766D",
        surfaceElevated: "#FFFFFF",
        gradientStart: "#C9996B",
        gradientEnd: "#DFB892",
    },
};

/** Per-card earthy accent colors. */
export const ClassAccentColors = {
    light: [
        { bg: "#F0EAE3", accent: "#C9996B" }, // Warm Beige / Gold
        { bg: "#E6EBE8", accent: "#5C766D" }, // Soft Sage / Deep Sage
        { bg: "#F3EAE8", accent: "#BE7F72" }, // Soft Blush / Terracotta
        { bg: "#EBEAE6", accent: "#7B746E" }, // Warm Gray / Charcoal
        { bg: "#F1EEDB", accent: "#B6A75E" }, // Ivory / Ochre
        { bg: "#E9EDEE", accent: "#63808B" }, // Dust Blue / Steel
    ],
    dark: [
        { bg: "#F0EAE3", accent: "#C9996B" },
        { bg: "#E6EBE8", accent: "#5C766D" },
        { bg: "#F3EAE8", accent: "#BE7F72" },
        { bg: "#EBEAE6", accent: "#7B746E" },
        { bg: "#F1EEDB", accent: "#B6A75E" },
        { bg: "#E9EDEE", accent: "#63808B" },
    ],
};

/** Map a class name to a friendly emoji icon. */
export function getClassEmoji(name: string): string {
    const lower = name.toLowerCase();
    if (
        lower.includes("math") ||
        lower.includes("calculus") ||
        lower.includes("algebra")
    )
        return "📐";
    if (lower.includes("physics")) return "🔭";
    if (lower.includes("chem")) return "🧪";
    if (lower.includes("bio")) return "🌿";
    if (lower.includes("english") || lower.includes("literature")) return "🖋️";
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
    if (lower.includes("music")) return "🎼";
    if (lower.includes("econ")) return "📈";
    if (lower.includes("psych")) return "🧠";
    if (lower.includes("philo")) return "🏛️";
    return "📚";
}

export const Fonts = Platform.select({
    ios: {
        sans: "Avenir Next",
        serif: "Georgia",
        rounded: "Avenir Next",
        mono: "Menlo",
    },
    default: {
        sans: "sans-serif",
        serif: "serif",
        rounded: "sans-serif",
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

/* ------------------------------------------------------------------ */
/*  8-pt Spacing System                                                */
/* ------------------------------------------------------------------ */

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
} as const;

/* ------------------------------------------------------------------ */
/*  Border Radius Scale                                                */
/* ------------------------------------------------------------------ */

export const Radii = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    full: 999,
} as const;

/* ------------------------------------------------------------------ */
/*  Typography Scale                                                   */
/* ------------------------------------------------------------------ */

export const Type = {
    title: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: "600" as const,
        letterSpacing: -0.5,
    },
    heading: {
        fontSize: 24,
        lineHeight: 30,
        fontWeight: "500" as const,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 20,
        lineHeight: 26,
        fontWeight: "500" as const,
        letterSpacing: -0.2,
    },
    body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    bodySemiBold: { fontSize: 16, lineHeight: 24, fontWeight: "500" as const },
    secondary: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
    label: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "500" as const,
        letterSpacing: 0.5,
        textTransform: "uppercase" as const,
    },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
    tiny: { fontSize: 11, lineHeight: 14, fontWeight: "500" as const },
} as const;

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export const TAB_BAR_HEIGHT = 56;
export const CONTENT_BOTTOM_PAD = 96;

/* ------------------------------------------------------------------ */
/*  Shadow Presets                                                     */
/* ------------------------------------------------------------------ */

export const Shadows = {
    sm: {
        shadowColor: "#5C4F4A",
        shadowOpacity: 0.04,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    md: {
        shadowColor: "#5C4F4A",
        shadowOpacity: 0.06,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    lg: {
        shadowColor: "#5C4F4A",
        shadowOpacity: 0.08,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 12 },
        elevation: 8,
    },
} as const;
