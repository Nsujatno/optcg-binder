"use client";

import { useEffect, useRef, useState } from "react";

import type { PlannerState } from "@/hooks/use-planner-state";

type PlannerHeaderProps = Pick<
  PlannerState,
  | "createNewLayout"
  | "duplicateLayout"
  | "exportLayouts"
  | "importLayouts"
  | "importInputRef"
>;

const menuItems = [
  { label: "New layout", action: "create", tone: "primary" as const },
  { label: "Duplicate layout", action: "duplicate", tone: "default" as const },
  { label: "Export JSON", action: "export", tone: "default" as const },
  { label: "Import JSON", action: "import", tone: "default" as const },
];

export function PlannerHeader({
  createNewLayout,
  duplicateLayout,
  exportLayouts,
  importLayouts,
  importInputRef,
}: PlannerHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const handleMenuAction = (action: (typeof menuItems)[number]["action"]) => {
    setMenuOpen(false);

    if (action === "create") {
      createNewLayout();
      return;
    }

    if (action === "duplicate") {
      duplicateLayout();
      return;
    }

    if (action === "export") {
      exportLayouts();
      return;
    }

    importInputRef.current?.click();
  };

  return (
    <header className="relative z-20 overflow-visible border-b border-white/10 bg-slate-950/50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-[-8rem] w-56 bg-cyan-300/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-[-3rem] h-28 w-48 rounded-full bg-orange-300/12 blur-3xl" />

      <div className="mx-auto flex w-full max-w-[1700px] items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-[0.35em] text-cyan-200/90 sm:text-sm">
            One Piece TCG Binder Planner
          </p>
        </div>

        <div ref={menuRef} className="relative z-30 shrink-0">
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-transparent text-white transition hover:border-white/45 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            <span className="relative flex h-5 w-5 flex-col items-center justify-center">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                  menuOpen ? "translate-y-0.5 rotate-45" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition duration-200 ${
                  menuOpen ? "-translate-y-0.5 -rotate-45" : "translate-y-1.5"
                }`}
              />
            </span>
          </button>

          <div
            className={`absolute right-0 top-[calc(100%+0.9rem)] z-30 w-[min(22rem,calc(100vw-2rem))] origin-top-right transition duration-200 ${
              menuOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-2 scale-95 opacity-0"
            }`}
          >
            <div className="overflow-hidden rounded-[28px] border border-white/20 bg-slate-950 p-3 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.action}
                    className={"flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300/60 border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"}
                    onClick={() => handleMenuAction(item.action)}
                    type="button"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <input
            ref={importInputRef}
            className="hidden"
            accept="application/json"
            onChange={importLayouts}
            type="file"
          />
        </div>
      </div>
    </header>
  );
}
