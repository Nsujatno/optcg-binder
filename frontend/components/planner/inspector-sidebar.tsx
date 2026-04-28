import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type InspectorSidebarProps = Pick<PlannerState, "selectedCard">;

export function InspectorSidebar({ selectedCard }: InspectorSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
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
