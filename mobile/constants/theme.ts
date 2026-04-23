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
    if (
        lower.includes("math") ||
        lower.includes("calculus") ||
        lower.includes("algebra")
    )
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

/* ------------------------------------------------------------------ */
/*  8-pt Spacing System                                                */
/* ------------------------------------------------------------------ */

export const Spacing = {
    /** 4 */
    xs: 4,
    /** 8 */
    sm: 8,
    /** 12 */
    md: 12,
    /** 16 */
    lg: 16,
    /** 20 — default horizontal page padding */
    xl: 20,
    /** 24 */
    xxl: 24,
    /** 32 */
    xxxl: 32,
    /** 40 */
    huge: 40,
} as const;

/* ------------------------------------------------------------------ */
/*  Border Radius Scale                                                */
/* ------------------------------------------------------------------ */

export const Radii = {
    /** 8 */
    sm: 8,
    /** 12 */
    md: 12,
    /** 16 */
    lg: 16,
    /** 20 */
    xl: 20,
    /** 24 — default for cards */
    xxl: 24,
    /** 32 — large feature cards */
    xxxl: 32,
    /** 999 — pill / fully rounded */
    full: 999,
} as const;

/* ------------------------------------------------------------------ */
/*  Typography Scale                                                   */
/* ------------------------------------------------------------------ */

export const Type = {
    /** 32 / 38 — main screen title */
    title: { fontSize: 32, lineHeight: 38, fontWeight: "800" as const },
    /** 24 / 30 — section heading */
    heading: { fontSize: 24, lineHeight: 30, fontWeight: "700" as const },
    /** 20 / 26 — subtitle */
    subtitle: { fontSize: 20, lineHeight: 26, fontWeight: "700" as const },
    /** 16 / 24 — body */
    body: { fontSize: 16, lineHeight: 24, fontWeight: "400" as const },
    /** 16 / 24 — body semi-bold */
    bodySemiBold: { fontSize: 16, lineHeight: 24, fontWeight: "600" as const },
    /** 14 / 20 — secondary text */
    secondary: { fontSize: 14, lineHeight: 20, fontWeight: "400" as const },
    /** 13 / 18 — label */
    label: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: "600" as const,
        letterSpacing: 0.3,
    },
    /** 12 / 16 — caption */
    caption: { fontSize: 12, lineHeight: 16, fontWeight: "500" as const },
    /** 11 / 14 — tiny label */
    tiny: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const },
} as const;

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

/** Estimated tab bar height used for bottom padding.
 *  The actual tab bar height is 56 + safeArea bottom inset.
 *  Use this as a minimum bottom padding for scrollable content. */
export const TAB_BAR_HEIGHT = 56;
export const CONTENT_BOTTOM_PAD = 96;

/* ------------------------------------------------------------------ */
/*  Shadow Presets                                                     */
/* ------------------------------------------------------------------ */

export const Shadows = {
    /** Low elevation — subtle lift */
    sm: {
        shadowColor: "#7C5CFC",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    /** Medium — default card */
    md: {
        shadowColor: "#7C5CFC",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    /** High — feature cards, modals */
    lg: {
        shadowColor: "#7C5CFC",
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 8,
    },
} as const;
