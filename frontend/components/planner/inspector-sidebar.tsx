import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type InspectorSidebarProps = Pick<
  PlannerState,
  | "selectedSlotId"
  | "selectedCard"
  | "selectedRegion"
  | "editSelectedRegion"
  | "deleteSelectedRegion"
  | "recommendationFeatureEligible"
  | "recommendationPanelOpen"
  | "recommendationLoading"
  | "recommendationEmptyState"
  | "recommendations"
  | "openRecommendations"
  | "closeRecommendations"
  | "applyRecommendation"
>;

export function InspectorSidebar({
  selectedSlotId,
  selectedCard,
  selectedRegion,
  editSelectedRegion,
  deleteSelectedRegion,
  recommendationFeatureEligible,
  recommendationPanelOpen,
  recommendationLoading,
  recommendationEmptyState,
  recommendations,
  openRecommendations,
  closeRecommendations,
  applyRecommendation,
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

      {!selectedCard && !selectedRegion && selectedSlotId ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-semibold">Empty slot</h4>
              <p className="mt-1 text-xs text-slate-400">Selected slot: {selectedSlotId}</p>
            </div>
            {recommendationPanelOpen ? (
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                onClick={closeRecommendations}
                type="button"
              >
                Close
              </button>
            ) : null}
          </div>

          {recommendationFeatureEligible ? (
            <div className="mt-4">
              {!recommendationPanelOpen ? (
                <button
                  className="w-full rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950"
                  onClick={openRecommendations}
                  type="button"
                >
                  What matches here?
                </button>
              ) : null}

              {recommendationLoading ? (
                <p className="mt-4 text-sm text-slate-300">Finding premium matches...</p>
              ) : null}

              {recommendationEmptyState ? (
                <p className="mt-4 text-sm text-slate-300">
                  No premium matches stood out for this slot.
                </p>
              ) : null}

              {recommendationPanelOpen && !recommendationLoading && recommendations.length ? (
                <div className="mt-4 space-y-3">
                  {recommendations.map((recommendation) => (
                    <button
                      key={recommendation.id}
                      className="flex w-full gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-left transition hover:border-cyan-300/40"
                      onClick={() => applyRecommendation(recommendation.id)}
                      type="button"
                    >
                      <img
                        alt={recommendation.name}
                        className="h-20 w-14 rounded-lg object-cover"
                        src={recommendation.imageUrl}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{recommendation.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {recommendation.cardSetId} - {recommendation.rarity}
                        </p>
                        <p className="mt-2 text-sm text-emerald-200">
                          {formatPrice(recommendation.marketPrice)}
                        </p>
                        <p className="mt-2 text-xs text-slate-300">{recommendation.reason}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              Add at least one card to a 2 x 2 or larger page to get visual matches.
            </p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
