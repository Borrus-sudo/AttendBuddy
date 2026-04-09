import type { HTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type BadgeProps = HTMLAttributes<HTMLSpanElement>

export function Badge({ className, ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border border-emerald-300/35 bg-emerald-300/10 px-2.5 py-1 text-xs font-semibold text-emerald-100",
                className,
            )}
            {...props}
        />
    )
}
