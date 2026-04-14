import { LogIn } from "lucide-react";

import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Spinner } from "../ui/spinner";

type GoogleSignInCardProps = {
    onSignIn: () => Promise<void>;
    isLoading: boolean;
};

export function GoogleSignInCard({
    onSignIn,
    isLoading,
}: GoogleSignInCardProps) {
    return (
        <Card className="mx-auto w-full max-w-md">
            <CardHeader>
                <CardTitle>Welcome to AttendBuddy</CardTitle>
                <CardDescription>
                    Sign in with your Google account to manage attendance
                    classrooms.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Button
                    className="w-full"
                    onClick={() => {
                        void onSignIn();
                    }}
                    disabled={isLoading}
                >
                    {isLoading ? <Spinner /> : <LogIn className="h-4 w-4" />}
                    {isLoading ? "Redirecting..." : "Sign in with Google"}
                </Button>
            </CardContent>
        </Card>
    );
}
