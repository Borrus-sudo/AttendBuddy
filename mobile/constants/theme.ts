/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0f766e";
const tintColorDark = "#34d399";

export const Colors = {
    light: {
        text: "#102a43",
        background: "#f4f8fb",
        tint: tintColorLight,
        icon: "#486581",
        tabIconDefault: "#829ab1",
        tabIconSelected: tintColorLight,
        card: "#ffffff",
        border: "#d9e2ec",
        muted: "#486581",
        primary: "#0f766e",
        danger: "#b42318",
    },
    dark: {
        text: "#e4f0fb",
        background: "#0f1720",
        tint: tintColorDark,
        icon: "#94a3b8",
        tabIconDefault: "#64748b",
        tabIconSelected: tintColorDark,
        card: "#1b2532",
        border: "#2f3b4a",
        muted: "#9fb3c8",
        primary: "#34d399",
        danger: "#f87171",
    },
};

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
