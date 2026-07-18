"use client";

export function PlannerHeader() {
  return (
    <header className="relative z-20 overflow-visible border-b border-white/10 bg-slate-950/50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <p className="truncate text-xs uppercase tracking-[0.35em] text-cyan-200/90 sm:text-sm">
          One Piece TCG Binder Planner
        </p>
      </div>
    </header>
  );
}
