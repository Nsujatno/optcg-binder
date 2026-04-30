"use client";

type Toast = {
  id: string;
  message: string;
  variant: "error" | "warning" | "info";
};

type ToastStackProps = {
  toasts: Toast[];
  dismissToast: (id: string) => void;
};

export function ToastStack({ toasts, dismissToast }: ToastStackProps) {
  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl px-4 py-3 text-sm shadow-[0_16px_45px_rgba(0,0,0,0.45)] backdrop-blur ${
            toast.variant === "warning"
              ? "border border-amber-300/40 bg-slate-950/95 text-amber-100"
              : toast.variant === "info"
                ? "border border-cyan-300/40 bg-slate-950/95 text-cyan-100"
                : "border border-rose-300/35 bg-slate-950/95 text-rose-100"
          }`}
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <p>{toast.message}</p>
            <button
              aria-label="Dismiss notification"
              className={`text-xs transition ${
                toast.variant === "warning"
                  ? "text-amber-200/80 hover:text-amber-100"
                  : toast.variant === "info"
                    ? "text-cyan-200/80 hover:text-cyan-100"
                    : "text-rose-200/80 hover:text-rose-100"
              }`}
              onClick={() => dismissToast(toast.id)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
