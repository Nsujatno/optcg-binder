"use client";

import type { ReactNode } from "react";

type ActionRailButtonProps = {
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

export function ActionRailButton({ label, onClick, children, className }: ActionRailButtonProps) {
  return (
    <div className="group relative">
      <button
        aria-label={label}
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10 ${className ?? ""}`}
        onClick={onClick}
        type="button"
      >
        {children}
      </button>
      <div className="pointer-events-none absolute top-1/2 left-[calc(100%+0.6rem)] z-[200] -translate-y-1/2 whitespace-nowrap rounded-md border border-white/15 bg-slate-950/95 px-2.5 py-1 text-xs text-slate-100 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition group-hover:opacity-100">
        {label}
      </div>
    </div>
  );
}
