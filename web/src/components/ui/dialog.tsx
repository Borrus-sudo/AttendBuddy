import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type DialogProps = {
    open: boolean;
    title: string;
    description?: string;
    onClose: () => void;
    children: ReactNode;
};

export function Dialog({
    open,
    title,
    description,
    onClose,
    children,
}: DialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        window.addEventListener("keydown", handleEscape);
        return () => {
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose, open]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close dialog"
            />

            <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0d111b] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-100">
                            {title}
                        </h3>
                        {description ? (
                            <p className="mt-1 text-sm text-slate-300">
                                {description}
                            </p>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        className="rounded-md p-1 text-slate-300 transition hover:bg-slate-800/80 hover:text-white"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}
