import type { TextareaHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
    return (
        <textarea
            className={cn(
                "min-h-24 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/30",
                className,
            )}
            {...props}
        />
    )
}
