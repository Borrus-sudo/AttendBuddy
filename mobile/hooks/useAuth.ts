import { authClient } from "@/lib/auth";

export async function useAuth() {
    const user = (await authClient.getSession()).data;
    if (!user) {
        return // we are gonn 
    }

}