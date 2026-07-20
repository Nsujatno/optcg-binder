"use client";

import { PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArtImage } from "@/components/planner/art-image";
import { useArtGestures } from "@/hooks/use-art-gestures";
import type { PlannerState } from "@/hooks/use-planner-state";
import { canPlaceArtRegion } from "@/lib/art-region-placement";
import {
  clampCrop,
  clampZoom,
  containZoom,
  DEFAULT_ART_TRANSFORM,
  MAX_ZOOM,
  minZoomFor,
  rotateTo,
  zoomAt,
} from "@/lib/art-transform";
import { getRegionBoxSize, PAGE_GRID_GAP, slotLabel } from "@/lib/planner";
import type { ArtTransform, FitMode } from "@/lib/types";

type CropModalProps = Pick<
  PlannerState,
  | "cropDraft"
  | "setCropDraft"
  | "activeTemplate"
  | "activePage"
  | "currentSlotPosition"
  | "confirmCropPlacement"
>;

/** Straighten is a fine adjustment; whole turns are the rotate buttons' job. */
const STRAIGHTEN_RANGE = 15;

function normalizeRotation(rotation: number) {
  return ((rotation % 360) + 360) % 360;
}

/** Split rotation into its quarter-turn and straighten parts. */
function splitRotation(rotation: number) {
  const normalized = normalizeRotation(rotation);
  const quarter = Math.round(normalized / 90) % 4;
  return { quarter, straighten: normalized - quarter * 90 };
}

export function CropModal({
  cropDraft,
  setCropDraft,
  activeTemplate,
  activePage,
  currentSlotPosition,
  confirmCropPlacement,
}: CropModalProps) {
  const [resizing, setResizing] = useState(false);

  const maxHorizontalSlots = activeTemplate.cols - currentSlotPosition.col;
  const maxVerticalSlots = activeTemplate.rows - currentSlotPosition.row;
  const rowSpan = cropDraft?.rowSpan ?? 1;
  const colSpan = cropDraft?.colSpan ?? 1;
  const box = useMemo(() => getRegionBoxSize(rowSpan, colSpan), [rowSpan, colSpan]);

  // Read by the resize handles, which outlive the render that started the drag.
  const spanRef = useRef({ rowSpan, colSpan });
  useEffect(() => {
    spanRef.current = { rowSpan, colSpan };
  });

  /** Whether a candidate span still fits the page without overlapping anything. */
  const spanFits = useCallback(
    (nextRowSpan: number, nextColSpan: number) => {
      if (!activePage) {
        return true;
      }
      return canPlaceArtRegion({
        page: activePage,
        template: activeTemplate,
        originRow: currentSlotPosition.row,
        originCol: currentSlotPosition.col,
        rowSpan: nextRowSpan,
        colSpan: nextColSpan,
        ignoreRegionId: cropDraft?.editingRegionId,
      });
    },
    [activePage, activeTemplate, currentSlotPosition, cropDraft?.editingRegionId],
  );

  const spanIsValid = spanFits(rowSpan, colSpan);

  const applyTransform = useCallback(
    (update: (current: ArtTransform) => ArtTransform) => {
      setCropDraft((current) => (current ? { ...current, ...update(current) } : current));
    },
    [setCropDraft],
  );

  /**
   * Resizing the span changes the box the transform is measured against, so the
   * crop is re-clamped or the image could end up stranded off-frame.
   */
  const setSpan = useCallback(
    (nextRowSpan: number, nextColSpan: number) => {
      setCropDraft((current) => {
        if (!current) {
          return current;
        }
        const clampedRows = Math.max(1, Math.min(maxVerticalSlots, nextRowSpan));
        const clampedCols = Math.max(1, Math.min(maxHorizontalSlots, nextColSpan));
        if (clampedRows === current.rowSpan && clampedCols === current.colSpan) {
          return current;
        }
        const nextBox = getRegionBoxSize(clampedRows, clampedCols);
        return {
          ...current,
          rowSpan: clampedRows,
          colSpan: clampedCols,
          ...clampCrop(current, current.asset, nextBox.width, nextBox.height, current.fitMode),
        };
      });
    },
    [maxHorizontalSlots, maxVerticalSlots, setCropDraft],
  );

  const { containerRef, isDragging, handlers } = useArtGestures({
    asset: cropDraft?.asset ?? { id: "", name: "", src: "", width: 1, height: 1 },
    boxW: box.width,
    boxH: box.height,
    fitMode: cropDraft?.fitMode ?? "fill",
    onChange: applyTransform,
  });

  const startSpanResize = useCallback(
    (event: PointerEvent<HTMLButtonElement>, axis: "x" | "y" | "both") => {
      event.preventDefault();
      event.stopPropagation();
      const handle = event.currentTarget;
      handle.setPointerCapture(event.pointerId);
      setResizing(true);

      // Re-measure on every move: changing the span resizes and re-centers the
      // preview, so a rect captured at drag start would drift immediately.
      const handleMove = (moveEvent: globalThis.PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) {
          return;
        }
        const { rowSpan: currentRows, colSpan: currentCols } = spanRef.current;
        const nextCols =
          axis === "y"
            ? currentCols
            : Math.round((moveEvent.clientX - rect.left) / (rect.width / currentCols));
        const nextRows =
          axis === "x"
            ? currentRows
            : Math.round((moveEvent.clientY - rect.top) / (rect.height / currentRows));
        setSpan(nextRows, nextCols);
      };

      const handleUp = () => {
        setResizing(false);
        handle.removeEventListener("pointermove", handleMove);
        handle.removeEventListener("pointerup", handleUp);
        handle.removeEventListener("pointercancel", handleUp);
      };

      handle.addEventListener("pointermove", handleMove);
      handle.addEventListener("pointerup", handleUp);
      handle.addEventListener("pointercancel", handleUp);
    },
    [containerRef, setSpan],
  );

  if (!cropDraft) {
    return null;
  }

  const { quarter, straighten } = splitRotation(cropDraft.rotation);
  const minZoom = minZoomFor(cropDraft.fitMode);

  function setZoom(nextZoom: number) {
    applyTransform((transform) =>
      zoomAt(
        transform,
        cropDraft!.asset,
        box.width,
        box.height,
        cropDraft!.fitMode,
        nextZoom,
        box.width / 2,
        box.height / 2,
      ),
    );
  }

  function setRotation(nextRotation: number) {
    applyTransform((transform) =>
      rotateTo(
        transform,
        cropDraft!.asset,
        box.width,
        box.height,
        cropDraft!.fitMode,
        nextRotation,
      ),
    );
  }

  function setFitMode(fitMode: FitMode) {
    setCropDraft((current) => {
      if (!current) {
        return current;
      }
      // Leaving "contain" can leave the image below the cover floor, so pull the
      // zoom back up before re-clamping.
      const zoom = clampZoom(current.zoom, fitMode);
      return {
        ...current,
        fitMode,
        ...clampCrop({ ...current, zoom }, current.asset, box.width, box.height, fitMode),
      };
    });
  }

  function fitWholeImage() {
    setCropDraft((current) => {
      if (!current) {
        return current;
      }
      const zoom = containZoom(current.asset, box.width, box.height, current.rotation);
      return {
        ...current,
        fitMode: "contain",
        ...clampCrop({ ...current, zoom }, current.asset, box.width, box.height, "contain"),
      };
    });
  }

  function resetTransform() {
    applyTransform(() => ({ ...DEFAULT_ART_TRANSFORM }));
  }

  const spanStepper = (
    label: string,
    value: number,
    max: number,
    onChange: (next: number) => void,
  ) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-1">
        <button
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="h-7 w-7 rounded-full border border-white/10 text-xs disabled:opacity-30"
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
          type="button"
        >
          -
        </button>
        <span className="w-10 text-center text-sm tabular-nums">{value}</span>
        <button
          aria-label={`Increase ${label.toLowerCase()}`}
          className="h-7 w-7 rounded-full border border-white/10 text-xs disabled:opacity-30"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="grid max-h-[95vh] w-full max-w-6xl gap-4 overflow-auto rounded-[32px] border border-white/10 bg-slate-950 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col justify-center rounded-[28px] border border-white/10 bg-white/5 p-6">
          {/* The width lives here, not on the preview: the preview sizes itself
              at 100% of this wrapper, so the wrapper needs a definite width or
              the two resolve circularly and collapse to zero. The vh cap keeps
              tall spans inside the modal. */}
          <div
            className="relative mx-auto w-full"
            style={{ maxWidth: `${Math.round((box.width / box.height) * 58)}vh` }}
          >
            <div
              aria-label="Drag to reposition the art. Scroll to zoom. Arrow keys nudge, plus and minus zoom, zero resets."
              className={`relative w-full overflow-hidden rounded-[24px] border bg-black/50 outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                spanIsValid ? "border-white/10" : "border-rose-400"
              } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              ref={containerRef}
              role="application"
              style={{
                aspectRatio: `${box.width} / ${box.height}`,
                touchAction: "none",
              }}
              tabIndex={0}
              {...handlers}
            >
              <ArtImage
                asset={cropDraft.asset}
                boxH={box.height}
                boxW={box.width}
                transform={cropDraft}
              />

              {/* Slot gutters, so the user can see where the cards will sit. */}
              <div
                className="pointer-events-none absolute inset-0 grid"
                style={{
                  gridTemplateColumns: `repeat(${colSpan}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${rowSpan}, minmax(0, 1fr))`,
                  gap: `${PAGE_GRID_GAP}px`,
                }}
              >
                {Array.from({ length: rowSpan * colSpan }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[12px] border border-white/25 shadow-[0_0_0_9999px_rgba(0,0,0,0)]"
                  />
                ))}
              </div>
            </div>

            {/* Span handles. Right/bottom only -- growing from the top or left
                would move the region's origin, which the modal does not own. */}
            <button
              aria-label="Drag to change horizontal span"
              className={`absolute top-1/2 -right-3 h-12 w-6 -translate-y-1/2 cursor-ew-resize rounded-full border transition ${
                resizing ? "border-cyan-300 bg-cyan-300/30" : "border-white/20 bg-slate-900/90"
              } ${colSpan >= maxHorizontalSlots ? "opacity-40" : ""}`}
              onPointerDown={(event) => startSpanResize(event, "x")}
              type="button"
            />
            <button
              aria-label="Drag to change vertical span"
              className={`absolute -bottom-3 left-1/2 h-6 w-12 -translate-x-1/2 cursor-ns-resize rounded-full border transition ${
                resizing ? "border-cyan-300 bg-cyan-300/30" : "border-white/20 bg-slate-900/90"
              } ${rowSpan >= maxVerticalSlots ? "opacity-40" : ""}`}
              onPointerDown={(event) => startSpanResize(event, "y")}
              type="button"
            />
            <button
              aria-label="Drag to change both spans"
              className={`absolute -right-3 -bottom-3 h-6 w-6 cursor-nwse-resize rounded-full border transition ${
                resizing ? "border-cyan-300 bg-cyan-300/30" : "border-white/20 bg-slate-900/90"
              }`}
              onPointerDown={(event) => startSpanResize(event, "both")}
              type="button"
            />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Drag to reposition · scroll to zoom · double-click to reset
          </p>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-4">
          <div>
            <h3 className="text-lg font-semibold">Michi crop</h3>
            <p className="mt-1 text-sm text-slate-400">
              Position the art across the slots it should span.
            </p>
          </div>

          <div className="space-y-2 rounded-2xl border border-white/10 bg-black/20 p-3">
            {spanStepper("Columns", colSpan, maxHorizontalSlots, (next) =>
              setSpan(rowSpan, next),
            )}
            {spanStepper("Rows", rowSpan, maxVerticalSlots, (next) => setSpan(next, colSpan))}
          </div>

          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-slate-300">
              <span>Zoom</span>
              <span className="text-xs tabular-nums text-slate-400">
                {cropDraft.zoom.toFixed(2)}x
              </span>
            </div>
            <input
              className="w-full"
              max={MAX_ZOOM}
              min={minZoom}
              onChange={(event) => setZoom(Number.parseFloat(event.target.value))}
              step={0.01}
              type="range"
              value={cropDraft.zoom}
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Rotate</span>
              <span className="text-xs tabular-nums text-slate-400">
                {normalizeRotation(cropDraft.rotation).toFixed(1)}°
              </span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-full border border-white/10 px-3 py-2 text-sm"
                onClick={() => setRotation(cropDraft.rotation - 90)}
                type="button"
              >
                ↺ 90°
              </button>
              <button
                className="flex-1 rounded-full border border-white/10 px-3 py-2 text-sm"
                onClick={() => setRotation(cropDraft.rotation + 90)}
                type="button"
              >
                ↻ 90°
              </button>
              <button
                aria-pressed={cropDraft.flipH}
                className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                  cropDraft.flipH
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-black/10"
                }`}
                onClick={() => applyTransform((t) => ({ ...t, flipH: !t.flipH }))}
                type="button"
              >
                ⇄ Flip
              </button>
            </div>
          </div>

          <label className="block text-sm">
            <div className="mb-1 flex items-center justify-between text-slate-300">
              <span>Straighten</span>
              <span className="text-xs tabular-nums text-slate-400">
                {straighten > 180 ? straighten - 360 : straighten}°
              </span>
            </div>
            <input
              className="w-full"
              max={STRAIGHTEN_RANGE}
              min={-STRAIGHTEN_RANGE}
              onChange={(event) =>
                setRotation(quarter * 90 + Number.parseFloat(event.target.value))
              }
              step={0.5}
              type="range"
              value={straighten > 180 ? straighten - 360 : straighten}
            />
          </label>

          <div>
            <p className="mb-2 text-sm text-slate-300">Fit</p>
            <div className="flex gap-2">
              <button
                className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                  cropDraft.fitMode === "fill"
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-black/10"
                }`}
                onClick={() => setFitMode("fill")}
                type="button"
              >
                Fill slots
              </button>
              <button
                className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                  cropDraft.fitMode === "contain"
                    ? "border-cyan-300 bg-cyan-300/10"
                    : "border-white/10 bg-black/10"
                }`}
                onClick={fitWholeImage}
                type="button"
              >
                Whole image
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {cropDraft.fitMode === "fill"
                ? "The art always covers every slot it spans."
                : "The whole image is visible; empty space may show around it."}
            </p>
          </div>

          <button
            className="w-full rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
            onClick={resetTransform}
            type="button"
          >
            ↺ Reset position
          </button>

          <div
            className={`rounded-2xl border p-3 text-sm ${
              spanIsValid
                ? "border-white/10 bg-black/20 text-slate-300"
                : "border-rose-400/60 bg-rose-500/10 text-rose-200"
            }`}
          >
            {spanIsValid ? (
              <>
                <div>
                  Placement starts at{" "}
                  {slotLabel(currentSlotPosition.row, currentSlotPosition.col)}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Spanning {colSpan} x {rowSpan} slot{colSpan * rowSpan === 1 ? "" : "s"}.
                </div>
              </>
            ) : (
              <div>This span overlaps cards or art already on the page.</div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              className="flex-1 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!spanIsValid}
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
