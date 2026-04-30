import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type EmptySlotPanelProps = Pick<
  PlannerState,
  | "selectedSlotId"
  | "recommendationFeatureEligible"
  | "recommendationPanelOpen"
  | "recommendationLoading"
  | "recommendationEmptyState"
  | "recommendations"
  | "openRecommendations"
  | "closeRecommendations"
  | "applyRecommendation"
>;

export function EmptySlotPanel({
  selectedSlotId,
  recommendationFeatureEligible,
  recommendationPanelOpen,
  recommendationLoading,
  recommendationEmptyState,
  recommendations,
  openRecommendations,
  closeRecommendations,
  applyRecommendation,
}: EmptySlotPanelProps) {
  if (!selectedSlotId) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">Empty slot</h4>
          <p className="mt-1 text-xs text-slate-400">Selected slot: {selectedSlotId}</p>
        </div>
        <div className="flex items-start gap-2">
          <div className="group relative">
            <span
              aria-label="AI matching info"
              className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-white/20 bg-white/5 text-xs font-semibold text-slate-300"
              role="img"
            >
              ?
            </span>
            <div className="pointer-events-none absolute right-0 top-7 z-10 w-56 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              We use AI-powered features to determine what cards match best on your page.
            </div>
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
  );
}
