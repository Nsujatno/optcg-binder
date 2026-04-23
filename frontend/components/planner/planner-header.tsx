import type { PlannerState } from "@/hooks/use-planner-state";

type PlannerHeaderProps = Pick<
  PlannerState,
  | "createNewLayout"
  | "duplicateLayout"
  | "exportLayouts"
  | "importLayouts"
  | "importInputRef"
>;

export function PlannerHeader({
  createNewLayout,
  duplicateLayout,
  exportLayouts,
  importLayouts,
  importInputRef,
}: PlannerHeaderProps) {
  return (
    <header className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
            One Piece TCG Binder Planner
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Plan binder layouts and Meechi art without an account
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            Browse sets, drag cards into slots, change binder themes, and
            place custom art across multi-slot regions with crop controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
            onClick={createNewLayout}
            type="button"
          >
            New layout
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={duplicateLayout}
            type="button"
          >
            Duplicate layout
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={exportLayouts}
            type="button"
          >
            Export JSON
          </button>
          <button
            className="rounded-full border border-white/20 px-4 py-2 text-sm"
            onClick={() => importInputRef.current?.click()}
            type="button"
          >
            Import JSON
          </button>
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
