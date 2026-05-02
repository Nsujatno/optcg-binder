import type { PlannerState } from "@/hooks/use-planner-state";
import { DEFAULT_THEME } from "@/lib/types";
import { matchesCardPlacementId, slotKey } from "@/lib/planner";

type PlannerCanvasSlotGridProps = Pick<
  PlannerState,
  | "activeLayout"
  | "activeTemplate"
  | "activePage"
  | "uploadInputRef"
  | "clearSelectedSlot"
  | "resolvedCardPool"
  | "occupiedByArt"
  | "selectedSlotId"
  | "setSelectedSlotId"
  | "setSelectedRegionId"
  | "handleCardDrop"
  | "handleArtRegionDrop"
> & {
  startDraggingCursor: () => void;
  stopDraggingCursor: () => void;
};

export function PlannerCanvasSlotGrid({
  activeLayout,
  activeTemplate,
  activePage,
  uploadInputRef,
  clearSelectedSlot,
  resolvedCardPool,
  occupiedByArt,
  selectedSlotId,
  setSelectedSlotId,
  setSelectedRegionId,
  handleCardDrop,
  handleArtRegionDrop,
  startDraggingCursor,
  stopDraggingCursor,
}: PlannerCanvasSlotGridProps) {
  return Array.from({ length: activeTemplate.rows }).map((_, row) =>
    Array.from({ length: activeTemplate.cols }).map((__, col) => {
      const key = slotKey(row, col);
      const placedCardId = activePage?.placements[key];
      const placedCard =
        resolvedCardPool.find((card) => matchesCardPlacementId(card, placedCardId)) ?? undefined;
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
            onDragEnd={stopDraggingCursor}
            onDragOver={(event) => {
              const isArtDrag = event.dataTransfer.types.includes("application/x-art-region-id");
              if (isArtDrag) {
                if (!placedCard && !artRegion) {
                  event.preventDefault();
                }
                return;
              }

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
            onDrop={(event) => {
              if (event.dataTransfer.types.includes("application/x-art-region-id")) {
                handleArtRegionDrop(event, key);
                stopDraggingCursor();
                return;
              }

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
              aria-label="Upload Michi art"
              className="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-slate-950/80 text-sm text-white transition hover:border-white/40 hover:bg-slate-900"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedSlotId(key);
                uploadInputRef.current?.click();
              }}
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
  );
}
