import { ChevronDown, ChevronRight, GraduationCap, PlusCircle, QrCode } from "lucide-react"
import { useMemo, useState } from "react"

import type { Classroom } from "../../types/classroom"
import { cn } from "../../lib/utils"

type ClassroomSidebarProps = {
    classrooms: Classroom[]
    selectedCode: string | null
    onSelect: (code: string) => void
}

export function ClassroomSidebar({
    classrooms,
    selectedCode,
    onSelect,
}: ClassroomSidebarProps) {
    const creatorsCount = classrooms.filter((item) => item.role === "creator").length
    const [showCreated, setShowCreated] = useState(true)
    const [showJoined, setShowJoined] = useState(true)

    const createdClassrooms = useMemo(
        () => classrooms.filter((item) => item.role === "creator"),
        [classrooms],
    )

    const joinedClassrooms = useMemo(
        () => classrooms.filter((item) => item.role !== "creator"),
        [classrooms],
    )

    function renderClassroomItem(classroomItem: Classroom) {
        return (
            <button
                key={classroomItem.code}
                type="button"
                className={cn(
                    "w-full rounded-xl border p-3 text-left transition",
                    selectedCode === classroomItem.code
                        ? "border-cyan-400/45 bg-cyan-500/8"
                        : "border-slate-800 bg-[#0f1119] hover:border-slate-700 hover:bg-[#131724]",
                )}
                onClick={() => {
                    onSelect(classroomItem.code)
                }}
            >
                <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-slate-100">
                        {classroomItem.name}
                    </p>
                    <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-200">
                        {classroomItem.code}
                    </span>
                </div>

                <p className="mb-2 line-clamp-2 text-xs text-slate-400">
                    {classroomItem.description || "No class description provided yet."}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-300">
                    {classroomItem.role === "creator" ? (
                        <>
                            <QrCode className="h-3.5 w-3.5" />
                            Teacher view
                        </>
                    ) : (
                        <>
                            <PlusCircle className="h-3.5 w-3.5" />
                            Student view
                        </>
                    )}
                </div>
            </button>
        )
    }

    return (
        <aside className="w-full border-b border-slate-900 bg-[#0d1019] p-4 lg:w-80 lg:border-b-0 lg:border-r">
            <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/12 p-2 text-cyan-200">
                    <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                        AttendBuddy
                    </p>
                    <h2 className="text-lg font-semibold text-slate-100">
                        My Classrooms
                    </h2>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Total
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-100">
                        {classrooms.length}
                    </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#111624] p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        You Lead
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-100">
                        {creatorsCount}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {classrooms.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-400">
                        No classes yet. Create or join a classroom to begin.
                    </div>
                ) : (
                    <>
                        <section className="space-y-2">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg bg-slate-900/60 px-2 py-1 text-left text-sm font-semibold text-slate-200"
                                onClick={() => {
                                    setShowCreated((value) => !value)
                                }}
                            >
                                <span>Created by You ({createdClassrooms.length})</span>
                                {showCreated ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {showCreated ? (
                                <div className="space-y-2">
                                    {createdClassrooms.length > 0 ? (
                                        createdClassrooms.map(renderClassroomItem)
                                    ) : (
                                        <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
                                            No classrooms created yet.
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </section>

                        <section className="space-y-2">
                            <button
                                type="button"
                                className="flex w-full items-center justify-between rounded-lg bg-slate-900/60 px-2 py-1 text-left text-sm font-semibold text-slate-200"
                                onClick={() => {
                                    setShowJoined((value) => !value)
                                }}
                            >
                                <span>Joined as Student ({joinedClassrooms.length})</span>
                                {showJoined ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>

                            {showJoined ? (
                                <div className="space-y-2">
                                    {joinedClassrooms.length > 0 ? (
                                        joinedClassrooms.map(renderClassroomItem)
                                    ) : (
                                        <p className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs text-slate-500">
                                            No classrooms joined yet.
                                        </p>
                                    )}
                                </div>
                            ) : null}
                        </section>
                    </>
                )}
            </div>
        </aside>
    )
}
