import type { PlannerState } from "@/hooks/use-planner-state";
import {
  CARD_SLOT_HEIGHT,
  CARD_SLOT_WIDTH,
  PAGE_GRID_GAP,
  slotLabel,
} from "@/lib/planner";

type CropModalProps = Pick<
  PlannerState,
  | "cropDraft"
  | "setCropDraft"
  | "activeTemplate"
  | "currentSlotPosition"
  | "confirmCropPlacement"
>;

export function CropModal({
  cropDraft,
  setCropDraft,
  activeTemplate,
  currentSlotPosition,
  confirmCropPlacement,
}: CropModalProps) {
  if (!cropDraft) {
    return null;
  }

  const maxHorizontalSlots = activeTemplate.cols - currentSlotPosition.col;
  const maxVerticalSlots = activeTemplate.rows - currentSlotPosition.row;
  const previewWidth =
    cropDraft.colSpan * CARD_SLOT_WIDTH + (cropDraft.colSpan - 1) * PAGE_GRID_GAP;
  const previewHeight =
    cropDraft.rowSpan * CARD_SLOT_HEIGHT + (cropDraft.rowSpan - 1) * PAGE_GRID_GAP;

  function updateColSpan(nextValue: number) {
    setCropDraft((current) =>
      current
        ? {
            ...current,
            colSpan: Math.max(1, Math.min(maxHorizontalSlots, nextValue)),
          }
        : current,
    );
  }

  function updateRowSpan(nextValue: number) {
    setCropDraft((current) =>
      current
        ? {
            ...current,
            rowSpan: Math.max(1, Math.min(maxVerticalSlots, nextValue)),
          }
        : current,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="grid max-h-[95vh] w-full max-w-6xl gap-4 overflow-auto rounded-[32px] border border-white/10 bg-slate-950 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
          <div
            className="grid w-1/2 max-w-full overflow-hidden rounded-[24px] border border-white/10 bg-black/50"
            style={{
              aspectRatio: `${previewWidth} / ${previewHeight}`,
              gridTemplateColumns: `repeat(${cropDraft.colSpan}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${cropDraft.rowSpan}, minmax(0, 1fr))`,
              gap: `${PAGE_GRID_GAP}px`,
            }}
          >
            <div className="relative col-span-full row-span-full">
              <img
                alt={cropDraft.asset.name}
                className="absolute inset-0 h-full w-full"
                src={cropDraft.asset.src}
                style={{
                  objectFit: cropDraft.fitMode === "fill" ? "cover" : "contain",
                  transform: `translate(${cropDraft.cropX}%, ${cropDraft.cropY}%) scale(${cropDraft.zoom})`,
                }}
              />
              <div
                className="absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${cropDraft.colSpan}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${cropDraft.rowSpan}, minmax(0, 1fr))`,
                  gap: `${PAGE_GRID_GAP}px`,
                }}
              >
                {Array.from({ length: cropDraft.rowSpan * cropDraft.colSpan }).map(
                  (_, index) => (
                    <div key={index} className="border border-white/25" />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
          <div>
            <h3 className="text-lg font-semibold">Meechi crop</h3>
            <p className="mt-1 text-sm text-slate-400">
              Set the span, crop, and fit mode before placing the art.
            </p>
          </div>

          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-slate-300">
              <span>Horizontal slots</span>
              <span className="text-xs text-slate-400">
                {cropDraft.colSpan} / {maxHorizontalSlots}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs"
                onClick={() => updateColSpan(cropDraft.colSpan - 1)}
                type="button"
              >
                -
              </button>
              <input
                className="w-full"
                max={maxHorizontalSlots}
                min={1}
                onChange={(event) => updateColSpan(Number.parseInt(event.target.value, 10))}
                onInput={(event) =>
                  updateColSpan(
                    Number.parseInt((event.target as HTMLInputElement).value, 10),
                  )
                }
                step={1}
                type="range"
                value={cropDraft.colSpan}
              />
              <button
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs"
                onClick={() => updateColSpan(cropDraft.colSpan + 1)}
                type="button"
              >
                +
              </button>
            </div>
          </label>

          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-slate-300">
              <span>Vertical slots</span>
              <span className="text-xs text-slate-400">
                {cropDraft.rowSpan} / {maxVerticalSlots}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs"
                onClick={() => updateRowSpan(cropDraft.rowSpan - 1)}
                type="button"
              >
                -
              </button>
              <input
                className="w-full"
                max={maxVerticalSlots}
                min={1}
                onChange={(event) => updateRowSpan(Number.parseInt(event.target.value, 10))}
                onInput={(event) =>
                  updateRowSpan(
                    Number.parseInt((event.target as HTMLInputElement).value, 10),
                  )
                }
                step={1}
                type="range"
                value={cropDraft.rowSpan}
              />
              <button
                className="rounded-full border border-white/10 px-3 py-1.5 text-xs"
                onClick={() => updateRowSpan(cropDraft.rowSpan + 1)}
                type="button"
              >
                +
              </button>
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Horizontal crop</span>
            <input
              className="w-full"
              max={40}
              min={-40}
              onChange={(event) =>
                setCropDraft((current) =>
                  current
                    ? { ...current, cropX: Number.parseInt(event.target.value, 10) }
                    : current,
                )
              }
              type="range"
              value={cropDraft.cropX}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Vertical crop</span>
            <input
              className="w-full"
              max={40}
              min={-40}
              onChange={(event) =>
                setCropDraft((current) =>
                  current
                    ? { ...current, cropY: Number.parseInt(event.target.value, 10) }
                    : current,
                )
              }
              type="range"
              value={cropDraft.cropY}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-300">Zoom</span>
            <input
              className="w-full"
              max={2}
              min={0.75}
              onChange={(event) =>
                setCropDraft((current) =>
                  current
                    ? { ...current, zoom: Number.parseFloat(event.target.value) }
                    : current,
                )
              }
              step={0.05}
              type="range"
              value={cropDraft.zoom}
            />
            <span className="text-xs text-slate-400">{cropDraft.zoom.toFixed(2)}x</span>
          </label>

          <div>
            <p className="mb-2 text-sm text-slate-300">Fit mode</p>
            <div className="flex gap-2">
              {(["fill", "contain"] as const).map((fitMode) => (
                <button
                  key={fitMode}
                  className={`rounded-full border px-3 py-2 text-sm ${
                    cropDraft.fitMode === fitMode
                      ? "border-cyan-300 bg-cyan-300/10"
                      : "border-white/10 bg-black/10"
                  }`}
                  onClick={() =>
                    setCropDraft((current) => (current ? { ...current, fitMode } : current))
                  }
                  type="button"
                >
                  {fitMode}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300">
            <div>
              Placement starts at{" "}
              {slotLabel(currentSlotPosition.row, currentSlotPosition.col)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              The region must fit inside the current binder page and cannot overlap
              cards or existing art.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950"
              onClick={confirmCropPlacement}
              type="button"
            >
              {cropDraft.editingRegionId ? "Update art" : "Place art"}
            </button>
            <button
              className="rounded-full border border-white/10 px-4 py-3 text-sm"
              onClick={() => setCropDraft(null)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
