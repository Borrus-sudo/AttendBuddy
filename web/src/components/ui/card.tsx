import type { HTMLAttributes } from "react"

import { cn } from "../../lib/utils"

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-2xl border border-white/15 bg-slate-950/50 p-6 shadow-[0_30px_60px_-20px_rgba(15,23,42,0.8)] backdrop-blur",
                className,
            )}
            {...props}
        />
    )
}

export function CardHeader({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("mb-4 space-y-1", className)} {...props} />
}

export function CardTitle({
    className,
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn("text-lg font-semibold tracking-tight text-slate-100", className)}
            {...props}
        />
    )
}

export function CardDescription({
    className,
    ...props
}: HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm text-slate-300", className)} {...props} />
}

export function CardContent({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("space-y-4", className)} {...props} />
}
