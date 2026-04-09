import type { InputHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
    return (
        <input
            className={cn(
                "h-10 w-full rounded-xl border border-white/15 bg-white/5 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/70 focus:ring-2 focus:ring-cyan-300/30",
                className,
            )}
            {...props}
        />
    )
}
