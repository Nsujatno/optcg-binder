"use client";

type ClearPageModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearPageModal({ open, onCancel, onConfirm }: ClearPageModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
    >
      <div
        className="w-full max-w-md rounded-[28px] border border-rose-300/30 bg-slate-950 p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-rose-100">Clear this page?</h2>
        <p className="mt-2 text-sm text-slate-300">
          This removes all placed cards and Michi art from the current page.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-full border border-rose-300/50 bg-rose-500/20 px-4 py-2 text-sm text-rose-100"
            onClick={onConfirm}
            type="button"
          >
            Yes, clear page
          </button>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
