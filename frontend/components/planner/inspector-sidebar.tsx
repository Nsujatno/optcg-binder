import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type InspectorSidebarProps = Pick<
  PlannerState,
  | "selectedCard"
  | "selectedRegion"
  | "editSelectedRegion"
  | "deleteSelectedRegion"
>;

export function InspectorSidebar({
  selectedCard,
  selectedRegion,
  editSelectedRegion,
  deleteSelectedRegion,
}: InspectorSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
      {selectedRegion ? (
        <div className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold">Meechi art</h4>
              <p className="mt-3 text-xs text-slate-400">
                Span: {selectedRegion.colSpan} x {selectedRegion.rowSpan}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="flex-1 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
              onClick={editSelectedRegion}
              type="button"
            >
              Edit
            </button>
            <button
              className="flex-1 rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
              onClick={deleteSelectedRegion}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>
      ) : null}

      {selectedCard ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <img
              alt={selectedCard.name}
              className="h-24 w-16 rounded-xl object-cover"
              src={selectedCard.imageUrl}
            />
            <div>
              <h4 className="font-semibold">{selectedCard.name}</h4>
              <p className="mt-1 text-xs text-slate-400">
                {selectedCard.cardSetId} - {selectedCard.color} - {selectedCard.type}
              </p>
              <p className="mt-3 text-sm text-emerald-200">
              {formatPrice(selectedCard.marketPrice)}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
