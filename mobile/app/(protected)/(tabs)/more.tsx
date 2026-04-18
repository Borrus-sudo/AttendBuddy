import { StyleSheet } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function MoreScreen() {
    return (
        <ThemedView style={styles.container}>
            <ThemedText type="title">More</ThemedText>
            <ThemedText>Coming soon.</ThemedText>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 12,
    },
});
