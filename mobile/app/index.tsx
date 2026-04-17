import { Redirect } from "expo-router";

import { useAuth } from "@/providers/auth-provider";

export default function IndexScreen() {
    const user = useAuth();

    if (user === undefined) {
        return null;
    }

    if (user) {
        return <Redirect href="/(tabs)/classes" />;
    }

    return <Redirect href="/sign-in" />;
}
