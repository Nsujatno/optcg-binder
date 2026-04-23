import type { PlannerState } from "@/hooks/use-planner-state";
import { BINDER_TEMPLATES, DEFAULT_THEME } from "@/lib/types";
import {
  CARD_SLOT_HEIGHT,
  CARD_SLOT_WIDTH,
  matchesCardPlacementId,
  PAGE_GRID_GAP,
  PAGE_PADDING,
  slotKey,
} from "@/lib/planner";

type PlannerCanvasProps = Pick<
  PlannerState,
  | "layouts"
  | "activeLayoutId"
  | "setActiveLayoutId"
  | "activeLayout"
  | "activeTemplate"
  | "activePageIndex"
  | "setActivePageIndex"
  | "activePage"
  | "renameDraft"
  | "setRenameDraft"
  | "renameLayout"
  | "deleteLayout"
  | "setTemplate"
  | "addPage"
  | "duplicatePage"
  | "activeLayoutAssets"
  | "selectedRegionId"
  | "setSelectedRegionId"
  | "setSelectedSlotId"
  | "cards"
  | "occupiedByArt"
  | "selectedSlotId"
  | "handleCardDrop"
>;

export function PlannerCanvas({
  layouts,
  activeLayoutId,
  setActiveLayoutId,
  activeLayout,
  activeTemplate,
  activePageIndex,
  setActivePageIndex,
  activePage,
  renameDraft,
  setRenameDraft,
  renameLayout,
  deleteLayout,
  setTemplate,
  addPage,
  duplicatePage,
  activeLayoutAssets,
  selectedRegionId,
  setSelectedRegionId,
  setSelectedSlotId,
  cards,
  occupiedByArt,
  selectedSlotId,
  handleCardDrop,
}: PlannerCanvasProps) {
  const pageWidth =
    activeTemplate.cols * CARD_SLOT_WIDTH +
    (activeTemplate.cols - 1) * PAGE_GRID_GAP +
    PAGE_PADDING * 2;
  const pageHeight =
    activeTemplate.rows * CARD_SLOT_HEIGHT +
    (activeTemplate.rows - 1) * PAGE_GRID_GAP +
    PAGE_PADDING * 2;

  return (
    <main className="rounded-[32px] border border-white/10 bg-slate-950/50 p-4 backdrop-blur">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <label className="text-xs uppercase tracking-[0.25em] text-slate-400">
            Active layout
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
              onChange={(event) => {
                setActiveLayoutId(event.target.value);
                setActivePageIndex(0);
                setSelectedRegionId(null);
              }}
              value={activeLayoutId}
            >
              {layouts.map((layout) => (
                <option key={layout.id} value={layout.id}>
                  {layout.name}
                </option>
              ))}
            </select>
            <input
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm"
              onChange={(event) => setRenameDraft(event.target.value)}
              placeholder={activeLayout?.name ?? "Rename layout"}
              value={renameDraft}
            />
            <button
              className="rounded-full border border-white/10 px-4 py-2 text-sm"
              onClick={renameLayout}
              type="button"
            >
              Rename
            </button>
            <button
              className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200"
              onClick={deleteLayout}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {BINDER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeLayout?.templateId === template.id
                  ? "bg-cyan-300 text-slate-950"
                  : "border border-white/10 bg-white/5"
              }`}
              onClick={() => setTemplate(template.id)}
              type="button"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
          onClick={() => setActivePageIndex((index) => Math.max(0, index - 1))}
          type="button"
        >
          Previous page
        </button>
        <span className="rounded-full bg-white/5 px-4 py-2 text-sm">
          Page {activePageIndex + 1} / {activeLayout?.pages.length ?? 0}
        </span>
        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
          onClick={() =>
            setActivePageIndex((index) =>
              Math.min((activeLayout?.pages.length ?? 1) - 1, index + 1),
            )
          }
          type="button"
        >
          Next page
        </button>
        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
          onClick={addPage}
          type="button"
        >
          Add page
        </button>
        <button
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
          onClick={duplicatePage}
          type="button"
        >
          Duplicate page
        </button>
      </div>

      <div className="overflow-auto pb-2">
        <div
          className="mx-auto grid rounded-[36px] border border-black/15 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          style={{
            backgroundColor: activeLayout?.theme.pageBackground ?? DEFAULT_THEME.pageBackground,
            gridTemplateColumns: `repeat(${activeTemplate.cols}, ${CARD_SLOT_WIDTH}px)`,
            gridTemplateRows: `repeat(${activeTemplate.rows}, ${CARD_SLOT_HEIGHT}px)`,
            gap: `${PAGE_GRID_GAP}px`,
            width: `${pageWidth}px`,
            minWidth: `${pageWidth}px`,
            height: `${pageHeight}px`,
          }}
        >
          {activePage?.artRegions.map((region) => {
            const asset = activeLayoutAssets.find((item) => item.id === region.assetId);
            if (!asset) {
              return null;
            }

            return (
              <button
                key={region.id}
                className={`group relative overflow-hidden rounded-[24px] border border-white/25 ${
                  selectedRegionId === region.id ? "ring-2 ring-cyan-300" : "ring-0"
                }`}
                onClick={() => {
                  setSelectedRegionId(region.id);
                  setSelectedSlotId(slotKey(region.originRow, region.originCol));
                }}
                style={{
                  gridColumn: `${region.originCol + 1} / span ${region.colSpan}`,
                  gridRow: `${region.originRow + 1} / span ${region.rowSpan}`,
                  zIndex: 10,
                }}
                type="button"
              >
                <img
                  alt={asset.name}
                  className="absolute inset-0 h-full w-full"
                  src={asset.src}
                  style={{
                    objectFit: region.fitMode === "fill" ? "cover" : "contain",
                    transform: `translate(${region.cropX}%, ${region.cropY}%) scale(${region.zoom})`,
                  }}
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0" />
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white">
                  {region.colSpan} x {region.rowSpan}
                </div>
              </button>
            );
          })}

          {Array.from({ length: activeTemplate.rows }).map((_, row) =>
            Array.from({ length: activeTemplate.cols }).map((__, col) => {
              const key = slotKey(row, col);
              const placedCardId = activePage?.placements[key];
              const placedCard =
                cards.find((card) => matchesCardPlacementId(card, placedCardId)) ?? undefined;
              const artRegion = occupiedByArt.get(key);
              const isSelected = selectedSlotId === key;
              const slotStyle = activeLayout?.theme.emptySlotStyle ?? "glass";
              const baseBackground =
                artRegion && !placedCard
                  ? "rgba(255,255,255,0.08)"
                  : slotStyle === "solid"
                    ? "rgba(255,255,255,0.18)"
                    : slotStyle === "dashed"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.12)";

              return (
                <button
                  key={key}
                  className={`relative overflow-hidden rounded-[24px] border text-left transition ${
                    artRegion?.locked && !placedCard ? "cursor-not-allowed" : "cursor-pointer"
                  } ${isSelected ? "ring-2 ring-cyan-300" : "ring-0"}`}
                  draggable={Boolean(placedCardId)}
                  onClick={() => {
                    setSelectedSlotId(key);
                    setSelectedRegionId(artRegion?.id ?? null);
                  }}
                  onDragOver={(event) => {
                    if (!artRegion?.locked) {
                      event.preventDefault();
                    }
                  }}
                  onDragStart={(event) => {
                    if (!placedCardId) {
                      return;
                    }

                    event.dataTransfer.setData("text/plain", placedCardId);
                    event.dataTransfer.setData("application/x-source-slot", key);
                  }}
                  onDrop={(event) => handleCardDrop(event, key)}
                  style={{
                    backgroundColor: baseBackground,
                    borderColor: activeLayout?.theme.slotAccent ?? DEFAULT_THEME.slotAccent,
                    borderStyle: slotStyle === "dashed" && !placedCard ? "dashed" : "solid",
                    zIndex: placedCard ? 30 : 20,
                  }}
                  type="button"
                >
                  {placedCard ? (
                    <img
                      alt={placedCard.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      src={placedCard.imageUrl}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-end justify-between p-3 text-[11px] uppercase tracking-[0.18em] text-slate-100">
                      <span>{row + 1}</span>
                      <span>{col + 1}</span>
                    </div>
                  )}

                  {artRegion && !placedCard ? (
                    <div className="absolute inset-0 border border-white/15" />
                  ) : null}
                </button>
              );
            }),
          )}
        </div>
      </div>
    </main>
  );
}
