import type { TextareaHTMLAttributes } from "react";

import { cn } from "../../lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
    return (
        <textarea
            className={cn(
                "min-h-24 w-full rounded-xl border border-slate-700 bg-[#0a0d15] px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/20",
                className,
            )}
            {...props}
        />
    );
}
