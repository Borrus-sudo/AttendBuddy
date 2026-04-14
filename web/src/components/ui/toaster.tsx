/* eslint-disable react-refresh/only-export-components */

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

import { cn } from "../../lib/utils";

type ToastVariant = "success" | "error";

type Toast = {
    id: number;
    title: string;
    message?: string;
    variant: ToastVariant;
};

type ToastInput = Omit<Toast, "id">;

type ToastContextValue = {
    notify: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToasterProvider");
    }
    return context;
}

type ToasterProviderProps = {
    children: ReactNode;
};

export function ToasterProvider({ children }: ToasterProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const dismiss = useCallback((id: number) => {
        setToasts((previousToasts) =>
            previousToasts.filter((toast) => toast.id !== id),
        );
    }, []);

    const notify = useCallback(
        (input: ToastInput) => {
            const id = Date.now() + Math.floor(Math.random() * 10000);
            setToasts((previousToasts) => [
                ...previousToasts,
                { ...input, id },
            ]);

            setTimeout(() => {
                dismiss(id);
            }, 3500);
        },
        [dismiss],
    );

    const contextValue = useMemo(
        () => ({
            notify,
        }),
        [notify],
    );

    return (
        <ToastContext.Provider value={contextValue}>
            {children}

            <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto rounded-xl border p-3 shadow-2xl backdrop-blur",
                            toast.variant === "success"
                                ? "border-emerald-400/40 bg-[#102117]"
                                : "border-red-400/40 bg-[#2a1212]",
                        )}
                        role="status"
                    >
                        <div className="flex items-start gap-2">
                            {toast.variant === "success" ? (
                                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                            ) : (
                                <AlertCircle className="mt-0.5 h-4 w-4 text-red-200" />
                            )}

                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-white">
                                    {toast.title}
                                </p>
                                {toast.message ? (
                                    <p className="text-xs text-white/80">
                                        {toast.message}
                                    </p>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                className="rounded-md p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
                                onClick={() => {
                                    dismiss(toast.id);
                                }}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
