import type { InputHTMLAttributes } from "react"

import { cn } from "../../lib/utils"

type InputProps = InputHTMLAttributes<HTMLInputElement>

export function Input({ className, ...props }: InputProps) {
    return (
        <input
            className={cn(
                "h-10 w-full rounded-xl border border-slate-700 bg-[#0a0d15] px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/20",
                className,
            )}
            {...props}
        />
    )
}
