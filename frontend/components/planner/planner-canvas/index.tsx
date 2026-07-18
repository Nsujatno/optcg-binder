import type { PlannerState } from "@/hooks/use-planner-state";
import { PlannerCanvasArtLayer } from "@/components/planner/planner-canvas/art-layer";
import { PlannerCanvasNavigation } from "@/components/planner/planner-canvas/navigation";
import { PlannerCanvasSlotGrid } from "@/components/planner/planner-canvas/slot-grid";
import { DEFAULT_THEME } from "@/lib/types";
import {
  CARD_SLOT_HEIGHT,
  CARD_SLOT_WIDTH,
  formatPrice,
  matchesCardPlacementId,
  PAGE_GRID_GAP,
  PAGE_PADDING,
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
  | "openSingleSlotCatalogModal"
  | "editRegionById"
  | "clearSelectedSlot"
  | "clearSlotById"
  | "resolvedCardPool"
  | "occupiedByArt"
  | "selectedSlotId"
  | "handleCardDrop"
  | "handleArtRegionDrop"
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
  openSingleSlotCatalogModal,
  editRegionById,
  clearSelectedSlot,
  clearSlotById,
  resolvedCardPool,
  occupiedByArt,
  selectedSlotId,
  handleCardDrop,
  handleArtRegionDrop,
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
  const activePageTotal = Object.values(activePage?.placements ?? {}).reduce(
    (total, placedCardId) => {
      const placedCard = resolvedCardPool.find((card) => matchesCardPlacementId(card, placedCardId));
      return total + (placedCard?.marketPrice ?? 0);
    },
    0,
  );

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
          <PlannerCanvasNavigation
            canGoNextPage={canGoNextPage}
            canGoPreviousPage={canGoPreviousPage}
            goToNextPage={() =>
              setActivePageIndex((index) => Math.min(totalPages - 1, index + 1))
            }
            goToPreviousPage={() => setActivePageIndex((index) => Math.max(0, index - 1))}
          />
        ) : null}

        <div
          className="relative mx-auto"
          style={{
            width: `${pageWidth}px`,
            minWidth: `${pageWidth}px`,
          }}
        >
          <div
            className="pointer-events-none absolute z-40 py-1.5 text-sm text-white"
            style={{
              top: "-32px",
              left: `${PAGE_PADDING}px`,
            }}
          >
            Page total {formatPrice(activePageTotal)}
          </div>
          <div
            className="relative grid rounded-[30px] border border-black/15 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
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
            <PlannerCanvasArtLayer
              activeLayoutAssets={activeLayoutAssets}
              activePage={activePage}
              deleteRegionById={deleteRegionById}
              selectedRegionId={selectedRegionId}
              selectedSlotId={selectedSlotId}
              setSelectedRegionId={setSelectedRegionId}
              setSelectedSlotId={setSelectedSlotId}
              startDraggingCursor={startDraggingCursor}
              stopDraggingCursor={stopDraggingCursor}
            />

            <PlannerCanvasSlotGrid
              activeLayout={activeLayout}
              activePage={activePage}
              activeTemplate={activeTemplate}
              resolvedCardPool={resolvedCardPool}
              clearSelectedSlot={clearSelectedSlot}
              clearSlotById={clearSlotById}
              deleteRegionById={deleteRegionById}
              editRegionById={editRegionById}
              handleArtRegionDrop={handleArtRegionDrop}
              handleCardDrop={handleCardDrop}
              openSingleSlotCatalogModal={openSingleSlotCatalogModal}
              occupiedByArt={occupiedByArt}
              selectedSlotId={selectedSlotId}
              setSelectedRegionId={setSelectedRegionId}
              setSelectedSlotId={setSelectedSlotId}
              startDraggingCursor={startDraggingCursor}
              stopDraggingCursor={stopDraggingCursor}
              uploadInputRef={uploadInputRef}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
