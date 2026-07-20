import { ArtImage } from "@/components/planner/art-image";
import type { PlannerState } from "@/hooks/use-planner-state";
import { getRegionBoxSize, slotKey } from "@/lib/planner";

type PlannerCanvasArtLayerProps = Pick<
  PlannerState,
  | "activePage"
  | "activeLayoutAssets"
  | "selectedRegionId"
  | "selectedSlotId"
  | "setSelectedRegionId"
  | "setSelectedSlotId"
  | "deleteRegionById"
> & {
  startDraggingCursor: () => void;
  stopDraggingCursor: () => void;
};

export function PlannerCanvasArtLayer({
  activePage,
  activeLayoutAssets,
  selectedRegionId,
  selectedSlotId,
  setSelectedRegionId,
  setSelectedSlotId,
  deleteRegionById,
  startDraggingCursor,
  stopDraggingCursor,
}: PlannerCanvasArtLayerProps) {
  return activePage?.artRegions.map((region) => {
    const asset = activeLayoutAssets.find((item) => item.id === region.assetId);
    if (!asset) {
      return null;
    }

    const box = getRegionBoxSize(region.rowSpan, region.colSpan);

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
          draggable
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
          onDragEnd={stopDraggingCursor}
          onDragStart={(event) => {
            event.dataTransfer.setData("application/x-art-region-id", region.id);
            event.dataTransfer.effectAllowed = "move";
            startDraggingCursor();
          }}
          type="button"
        >
          <ArtImage asset={asset} boxH={box.height} boxW={box.width} transform={region} />
          <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0" />
          {selectedRegionId === region.id ? (
            <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-white">
              {region.colSpan} x {region.rowSpan}
            </div>
          ) : null}
        </button>

        {selectedRegionId === region.id ? (
          <button
            aria-label="Remove Michi art"
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
  });
}
