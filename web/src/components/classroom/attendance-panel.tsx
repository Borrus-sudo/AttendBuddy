import { useMemo, useState } from "react";
import { Clock3, QrCode, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import type { AttendanceSession, Classroom } from "../../types/classroom";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

type AttendancePanelProps = {
    classroom: Classroom | null;
    activeSession: AttendanceSession | null;
    onStartSession: (args: {
        classroomCode: string;
        durationMinutes: number;
    }) => Promise<void>;
    onCloseSession: (args: {
        classroomCode: string;
        attendanceSessionId: string;
    }) => Promise<void>;
    loading: boolean;
};

const durationOptions = [5, 10, 15, 30, 45];

export function AttendancePanel({
    classroom,
    activeSession,
    onStartSession,
    onCloseSession,
    loading,
}: AttendancePanelProps) {
    const [durationMinutes, setDurationMinutes] = useState(10);

    const expiresLabel = useMemo(() => {
        if (!activeSession) {
            return null;
        }

        const expiry = new Date(activeSession.expiresAt);
        return new Intl.DateTimeFormat("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(expiry);
    }, [activeSession]);

    if (!classroom) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Attendance Session</CardTitle>
                    <CardDescription>
                        Select a classroom from the left panel to manage
                        attendance.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (classroom.role !== "creator") {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Teacher Attendance Session</CardTitle>
                    <CardDescription>
                        Teachers generate QR sessions. Students can mark
                        attendance below using token entry.
                    </CardDescription>
                </CardHeader>
                <CardContent className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                    Ask your instructor to start attendance. Once the QR is
                    shown, scan it from your member app and your presence will
                    be marked.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-cyan-300" />
                    Start Attendance with QR
                </CardTitle>
                <CardDescription>
                    Generate a time-bound QR for {classroom.name}. Members can
                    scan and auto-mark attendance.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {activeSession ? (
                    <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-cyan-100">
                                    Live Attendance Session
                                </p>
                                <p className="text-xs text-cyan-200/80">
                                    Token: {activeSession.token.slice(0, 10)}...
                                </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-md bg-cyan-400/20 px-2 py-1 text-xs font-medium text-cyan-100">
                                <Clock3 className="h-3.5 w-3.5" />
                                Ends by {expiresLabel}
                            </span>
                        </div>

                        <div className="mx-auto mb-3 w-fit rounded-xl bg-white p-3">
                            <QRCodeSVG
                                value={JSON.stringify({
                                    token: activeSession.token,
                                    classroomCode: activeSession.classroomCode,
                                    endpoint: "/api/attendance/scan",
                                })}
                                size={170}
                                includeMargin
                            />
                        </div>

                        <p className="mb-3 text-xs text-cyan-100/90">
                            Members should scan this QR from AttendBuddy
                            attendance scanner. The token is single-session and
                            time-limited.
                        </p>

                        <Button
                            variant="outline"
                            className="w-full"
                            disabled={loading}
                            onClick={() => {
                                void onCloseSession({
                                    classroomCode: classroom.code,
                                    attendanceSessionId: activeSession.id,
                                });
                            }}
                        >
                            {loading ? (
                                <Spinner />
                            ) : (
                                <ShieldCheck className="h-4 w-4" />
                            )}
                            {loading ? "Closing..." : "Close Session"}
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="attendance-duration">
                                Session Duration
                            </Label>
                            <div
                                id="attendance-duration"
                                className="grid grid-cols-5 gap-2"
                            >
                                {durationOptions.map((duration) => (
                                    <button
                                        key={duration}
                                        type="button"
                                        className={`rounded-lg border px-2 py-2 text-sm font-medium transition ${
                                            duration === durationMinutes
                                                ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                                                : "border-slate-700 bg-[#10141f] text-slate-300 hover:border-slate-600"
                                        }`}
                                        onClick={() => {
                                            setDurationMinutes(duration);
                                        }}
                                    >
                                        {duration}m
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full"
                            disabled={loading}
                            onClick={() => {
                                void onStartSession({
                                    classroomCode: classroom.code,
                                    durationMinutes,
                                });
                            }}
                        >
                            {loading ? (
                                <Spinner />
                            ) : (
                                <QrCode className="h-4 w-4" />
                            )}
                            {loading
                                ? "Generating..."
                                : "Generate Attendance QR"}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
