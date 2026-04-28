import type { PlannerState } from "@/hooks/use-planner-state";
import { DEFAULT_THEME } from "@/lib/types";
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
  | "activeLayout"
  | "activeTemplate"
  | "activePage"
  | "activePageIndex"
  | "activeLayoutAssets"
  | "selectedRegionId"
  | "setSelectedRegionId"
  | "setSelectedSlotId"
  | "setActivePageIndex"
  | "uploadInputRef"
  | "handleUploadImage"
  | "deleteRegionById"
  | "clearSelectedSlot"
  | "cards"
  | "occupiedByArt"
  | "selectedSlotId"
  | "handleCardDrop"
>;

export function PlannerCanvas({
  activeLayout,
  activeTemplate,
  activePage,
  activePageIndex,
  activeLayoutAssets,
  selectedRegionId,
  setSelectedRegionId,
  setSelectedSlotId,
  setActivePageIndex,
  uploadInputRef,
  handleUploadImage,
  deleteRegionById,
  clearSelectedSlot,
  cards,
  occupiedByArt,
  selectedSlotId,
  handleCardDrop,
}: PlannerCanvasProps) {
  function startDraggingCursor() {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.add("is-dragging-card");
  }

  function stopDraggingCursor() {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.remove("is-dragging-card");
  }

  const totalPages = activeLayout?.pages.length ?? 0;
  const canGoPreviousPage = activePageIndex > 0;
  const canGoNextPage = activePageIndex < totalPages - 1;
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
      <input
        ref={uploadInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUploadImage}
        type="file"
      />

      <div className="relative overflow-auto pt-8 pb-2">
        {totalPages > 1 ? (
          <button
            className={`absolute top-1/2 left-2 z-40 -translate-y-1/2 rounded-full border px-3 py-2 text-xl leading-none backdrop-blur transition ${
              canGoPreviousPage
                ? "border-white/20 bg-slate-950/75 text-white hover:bg-slate-950"
                : "cursor-not-allowed border-white/10 bg-slate-950/45 text-slate-500"
            }`}
            disabled={!canGoPreviousPage}
            onClick={() =>
              setActivePageIndex((index) => Math.max(0, index - 1))
            }
            type="button"
          >
            ‹
          </button>
        ) : null}

        {totalPages > 1 ? (
          <button
            className={`absolute top-1/2 right-2 z-40 -translate-y-1/2 rounded-full border px-3 py-2 text-xl leading-none backdrop-blur transition ${
              canGoNextPage
                ? "border-white/20 bg-slate-950/75 text-white hover:bg-slate-950"
                : "cursor-not-allowed border-white/10 bg-slate-950/45 text-slate-500"
            }`}
            disabled={!canGoNextPage}
            onClick={() =>
              setActivePageIndex((index) =>
                Math.min(totalPages - 1, index + 1),
              )
            }
            type="button"
          >
            ›
          </button>
        ) : null}

        <div
          className="mx-auto grid rounded-[30px] border border-black/15 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
          onClick={() => {
            setSelectedSlotId(null);
            setSelectedRegionId(null);
          }}
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
              <div
                key={region.id}
                className={`group relative overflow-hidden rounded-[24px] border border-white/25 ${
                  selectedRegionId === region.id ? "ring-2 ring-cyan-300" : "ring-0"
                }`}
                style={{
                  gridColumn: `${region.originCol + 1} / span ${region.colSpan}`,
                  gridRow: `${region.originRow + 1} / span ${region.rowSpan}`,
                  zIndex: 50,
                }}
              >
                <button
                  className="absolute inset-0"
                  onClick={(event) => {
                    event.stopPropagation();
                    const regionSlotId = slotKey(region.originRow, region.originCol);
                    if (selectedSlotId === regionSlotId && selectedRegionId === region.id) {
                      setSelectedSlotId(null);
                      setSelectedRegionId(null);
                      return;
                    }

                    setSelectedRegionId(region.id);
                    setSelectedSlotId(regionSlotId);
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
                  {selectedRegionId === region.id ? (
                    <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white">
                      {region.colSpan} x {region.rowSpan}
                    </div>
                  ) : null}
                </button>

                {selectedRegionId === region.id ? (
                  <button
                    aria-label="Remove Meechi art"
                    className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white transition hover:border-rose-300/60 hover:bg-rose-500/30"
                    onClick={(event) => {
                      event.stopPropagation();
                      deleteRegionById(region.id);
                    }}
                    type="button"
                  >
                    x
                  </button>
                ) : null}
              </div>
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
              const canUploadArt = isSelected && !placedCard && !artRegion;
              const canClearCard = isSelected && Boolean(placedCardId);
              const slotStyle = activeLayout?.theme.emptySlotStyle ?? "glass";
              const slotCursorClass = placedCardId
                ? "cursor-grab active:cursor-grabbing"
                : artRegion?.locked && !placedCard
                  ? "cursor-not-allowed"
                  : "cursor-pointer";
              const baseBackground =
                artRegion && !placedCard
                  ? "rgba(255,255,255,0.08)"
                  : slotStyle === "solid"
                    ? "rgba(255,255,255,0.18)"
                    : slotStyle === "dashed"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.12)";

              return (
                <div
                  key={key}
                  className="relative"
                  style={{
                    gridColumn: `${col + 1}`,
                    gridRow: `${row + 1}`,
                    zIndex: placedCard ? 30 : 20,
                  }}
                >
                  <button
                    className={`relative h-full w-full overflow-hidden rounded-[15px] border text-left transition ${slotCursorClass} ${
                      isSelected ? "ring-2 ring-cyan-300" : "ring-0"
                    }`}
                    draggable={Boolean(placedCardId)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isSelected) {
                        setSelectedSlotId(null);
                        setSelectedRegionId(null);
                        return;
                      }

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
                      startDraggingCursor();
                    }}
                    onDragEnd={stopDraggingCursor}
                    onDrop={(event) => {
                      handleCardDrop(event, key);
                      stopDraggingCursor();
                    }}
                    style={{
                      backgroundColor: baseBackground,
                      borderColor: activeLayout?.theme.slotAccent ?? DEFAULT_THEME.slotAccent,
                      borderStyle: slotStyle === "dashed" && !placedCard ? "dashed" : "solid",
                    }}
                    type="button"
                  >
                    {placedCard ? (
                      <img
                        alt={placedCard.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        src={placedCard.imageUrl}
                      />
                    ) : null}

                    {artRegion && !placedCard ? (
                      <div className="absolute inset-0 border border-white/15" />
                    ) : null}
                  </button>

                  {canUploadArt ? (
                    <button
                      aria-label="Upload Meechi art"
                      className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-sm text-white transition hover:border-white/40 hover:bg-slate-900"
                      onClick={() => uploadInputRef.current?.click()}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 3v11" />
                        <path d="M8.5 6.5 12 3l3.5 3.5" />
                        <path d="M4.5 13.5v4A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-4" />
                      </svg>
                    </button>
                  ) : null}

                  {canClearCard ? (
                    <button
                      aria-label="Remove card from slot"
                      className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-white transition hover:border-rose-300/60 hover:bg-rose-500/30"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedSlotId(key);
                        setSelectedRegionId(null);
                        clearSelectedSlot();
                      }}
                      type="button"
                    >
                      x
                    </button>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </main>
  );
}
