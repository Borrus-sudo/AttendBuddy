import type { ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
    {
        variants: {
            variant: {
                default:
                    "bg-emerald-700 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500",
                secondary:
                    "bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-slate-500",
                ghost: "bg-transparent text-slate-300 hover:bg-slate-800/80 focus-visible:ring-slate-500",
                danger: "bg-red-700 text-white hover:bg-red-600 focus-visible:ring-red-500",
                outline:
                    "border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 focus-visible:ring-slate-500",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-9 px-3 text-xs",
                lg: "h-11 px-5",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
    return (
        <button
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}
