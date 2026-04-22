import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const palette = Colors[colorScheme ?? "light"];
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: palette.tint,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarStyle: {
                    backgroundColor: palette.card,
                    borderTopWidth: 0,
                    elevation: 12,
                    shadowColor: isDark ? "#000" : "#7C5CFC",
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: -4 },
                    height: 56 + Math.max(insets.bottom, 8),
                    paddingBottom: Math.max(insets.bottom, 8),
                    paddingTop: 6,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                tabBarInactiveTintColor: palette.tabIconDefault,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            name="home-filled"
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="classes"
                options={{
                    title: "Classes",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            name="menu-book"
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="timetable"
                options={{
                    title: "Timetable",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            name="calendar-today"
                            size={22}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons name="person" size={26} color={color} />
                    ),
                }}
            />
            {/* Hide the old "more" tab — file still exists but is unlisted */}
            <Tabs.Screen
                name="more"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
