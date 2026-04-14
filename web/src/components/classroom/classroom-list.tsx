import { Trash2, UserMinus } from "lucide-react";

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

type ClassroomListProps = {
    classrooms: Classroom[];
    selectedCode: string | null;
    onSelect: (code: string) => void;
    onLeave: (code: string) => Promise<void>;
    onDelete: (code: string) => Promise<void>;
    loadingCode?: string;
};

export function ClassroomList({
    classrooms,
    selectedCode,
    onSelect,
    onLeave,
    onDelete,
    loadingCode,
}: ClassroomListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Classrooms</CardTitle>
                <CardDescription>
                    Manage attendance spaces you created or joined.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {classrooms.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-300">
                        No classrooms yet. Create one or join with a class code.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {classrooms.map((classroomItem) => (
                            <li
                                key={classroomItem.code}
                                className={`rounded-xl border p-4 transition ${
                                    selectedCode === classroomItem.code
                                        ? "border-cyan-300/50 bg-cyan-500/10"
                                        : "border-white/10 bg-white/5"
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className="font-semibold text-slate-100 hover:text-cyan-100"
                                                onClick={() => {
                                                    onSelect(
                                                        classroomItem.code,
                                                    );
                                                }}
                                            >
                                                {classroomItem.name}
                                            </button>
                                            <Badge>{classroomItem.code}</Badge>
                                        </div>
                                        {classroomItem.description ? (
                                            <p className="text-sm text-slate-300">
                                                {classroomItem.description}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {classroomItem.role === "creator" ? (
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => {
                                                    void onDelete(
                                                        classroomItem.code,
                                                    );
                                                }}
                                                disabled={
                                                    loadingCode ===
                                                    classroomItem.code
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    void onLeave(
                                                        classroomItem.code,
                                                    );
                                                }}
                                                disabled={
                                                    loadingCode ===
                                                    classroomItem.code
                                                }
                                            >
                                                <UserMinus className="h-4 w-4" />
                                                Leave
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
