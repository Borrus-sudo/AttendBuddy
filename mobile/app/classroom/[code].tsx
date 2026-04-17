import { Redirect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { getClassroomByCode } from "@/lib/api";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useAuth } from "@/providers/auth-provider";
import type { ClassroomDetailPayload } from "@/types/api";

export default function ClassroomDetailScreen() {
    const { code } = useLocalSearchParams<{ code: string }>();
    const user = useAuth();
    const cardColor = useThemeColor({}, "card");
    const borderColor = useThemeColor({}, "border");
    const mutedColor = useThemeColor({}, "muted");
    const dangerColor = useThemeColor({}, "danger");

    const [classroom, setClassroom] = useState<ClassroomDetailPayload | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const normalizedCode = useMemo(
        () => (Array.isArray(code) ? code[0] : code),
        [code],
    );

    const isCreator = !!classroom && !!user && classroom.creatorId === user.id;

    const loadClassroom = useCallback(async () => {
        if (!normalizedCode) {
            setError("Classroom code missing");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await getClassroomByCode(normalizedCode);
            setClassroom(response.payload);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load classroom",
            );
        } finally {
            setIsLoading(false);
        }
    }, [normalizedCode]);

    useEffect(() => {
        loadClassroom();
    }, [loadClassroom]);

    if (isLoading) {
        return (
            <ThemedView style={styles.centered}>
                <ActivityIndicator />
            </ThemedView>
        );
    }

    if (!user) {
        return <Redirect href="/sign-in" />;
    }

    if (error || !classroom) {
        return (
            <ThemedView style={styles.centered}>
                <ThemedText style={[styles.error, { color: dangerColor }]}>
                    {error || "Classroom not found"}
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <View
                style={[
                    styles.detailCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                <ThemedText type="title">{classroom.name}</ThemedText>
                <ThemedText style={{ color: mutedColor }}>
                    {classroom.description || "No description"}
                </ThemedText>
                <ThemedText>Code: {classroom.code}</ThemedText>
                <ThemedText>
                    Status: {classroom.isActive ? "Active" : "Inactive"}
                </ThemedText>
                <ThemedText>Creator ID: {classroom.creatorId}</ThemedText>
            </View>

            <View
                style={[
                    styles.detailCard,
                    { backgroundColor: cardColor, borderColor },
                ]}
            >
                <ThemedText type="subtitle">
                    {isCreator ? "Members" : "Teacher"}
                </ThemedText>
                <FlatList
                    data={classroom.members}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.memberList}
                    ListEmptyComponent={
                        <ThemedText>No data available.</ThemedText>
                    }
                    renderItem={({ item }) => (
                        <View
                            style={[
                                styles.memberRow,
                                { backgroundColor: cardColor, borderColor },
                            ]}
                        >
                            <ThemedText type="defaultSemiBold">
                                {item.name}
                            </ThemedText>
                            <ThemedText style={{ color: mutedColor }}>
                                {item.email}
                            </ThemedText>
                        </View>
                    )}
                />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 14,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    error: {
        color: "#b00020",
        textAlign: "center",
    },
    detailCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        gap: 6,
    },
    memberList: {
        gap: 8,
        paddingTop: 8,
    },
    memberRow: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        gap: 2,
    },
});
