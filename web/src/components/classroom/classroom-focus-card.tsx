import { ShieldCheck, Trash2, UserMinus } from "lucide-react";

import type { Classroom } from "../../types/classroom";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";

type ClassroomFocusCardProps = {
    classroom: Classroom | null;
    loadingCode?: string;
    onLeave: (code: string) => Promise<void>;
    onDelete: (code: string) => Promise<void>;
};

export function ClassroomFocusCard({
    classroom,
    loadingCode,
    onLeave,
    onDelete,
}: ClassroomFocusCardProps) {
    if (!classroom) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Classroom Workspace</CardTitle>
                    <CardDescription>
                        Select a classroom from the left panel to view details.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="mb-1 flex items-center gap-2">
                    <CardTitle>{classroom.name}</CardTitle>
                    <Badge>{classroom.code}</Badge>
                </div>
                <CardDescription>
                    {classroom.description ||
                        "No classroom description has been provided."}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {classroom.role === "creator"
                        ? "Teacher access: launch and manage attendance sessions"
                        : "Student access: mark and track attendance insights"}
                </div>

                {classroom.role === "creator" ? (
                    <Button
                        variant="danger"
                        size="sm"
                        disabled={loadingCode === classroom.code}
                        onClick={() => {
                            void onDelete(classroom.code);
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Classroom
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loadingCode === classroom.code}
                        onClick={() => {
                            void onLeave(classroom.code);
                        }}
                    >
                        <UserMinus className="h-4 w-4" />
                        Leave Classroom
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
