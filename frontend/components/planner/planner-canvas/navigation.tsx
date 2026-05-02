type PlannerCanvasNavigationProps = {
  canGoPreviousPage: boolean;
  canGoNextPage: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export function PlannerCanvasNavigation({
  canGoPreviousPage,
  canGoNextPage,
  goToPreviousPage,
  goToNextPage,
}: PlannerCanvasNavigationProps) {
  return (
    <>
      <button
        className={`absolute top-1/2 left-2 z-40 -translate-y-1/2 rounded-full border px-3 py-2 text-xl leading-none backdrop-blur transition ${
          canGoPreviousPage
            ? "border-white/20 bg-slate-950/75 text-white hover:bg-slate-950"
            : "cursor-not-allowed border-white/10 bg-slate-950/45 text-slate-500"
        }`}
        disabled={!canGoPreviousPage}
        onClick={goToPreviousPage}
        type="button"
      >
        &lt;
      </button>

      <button
        className={`absolute top-1/2 right-2 z-40 -translate-y-1/2 rounded-full border px-3 py-2 text-xl leading-none backdrop-blur transition ${
          canGoNextPage
            ? "border-white/20 bg-slate-950/75 text-white hover:bg-slate-950"
            : "cursor-not-allowed border-white/10 bg-slate-950/45 text-slate-500"
        }`}
        disabled={!canGoNextPage}
        onClick={goToNextPage}
        type="button"
      >
        &gt;
      </button>
    </>
  );
}
