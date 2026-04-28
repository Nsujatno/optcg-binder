"use client";

import type { DownloadScope } from "@/lib/binder-export";

type DownloadModalProps = {
  open: boolean;
  downloading: boolean;
  errorMessage: string;
  onClose: () => void;
  onDownload: (scope: DownloadScope) => void;
};

const downloadOptions: Array<{
  scope: DownloadScope;
  label: string;
  description: string;
}> = [
  {
    scope: "current-page",
    label: "This page",
    description: "Download the active page as a single PNG image.",
  },
  {
    scope: "current-binder",
    label: "This binder",
    description: "Download every page in the active binder as separate PNG files.",
  },
  {
    scope: "all-binders",
    label: "All binders",
    description: "Download every page from every binder as separate PNG files.",
  },
];

export function DownloadModal({
  open,
  downloading,
  errorMessage,
  onClose,
  onDownload,
}: DownloadModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur"
      onClick={downloading ? undefined : onClose}
    >
      <div
        className="w-full max-w-xl rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">Download pages</h3>
        <p className="mt-1 text-sm text-slate-400">
          Choose which binder pages to export. Each page downloads as a PNG image.
        </p>

        <div className="mt-4 space-y-3">
          {downloadOptions.map((option) => (
            <button
              key={option.scope}
              className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={downloading}
              onClick={() => onDownload(option.scope)}
              type="button"
            >
              <div className="text-sm font-medium text-white">{option.label}</div>
              <div className="mt-1 text-sm text-slate-400">{option.description}</div>
            </button>
          ))}
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Remote card hosts must allow browser image export or the download can fail.
          </p>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={downloading}
            onClick={onClose}
            type="button"
          >
            {downloading ? "Preparing..." : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
