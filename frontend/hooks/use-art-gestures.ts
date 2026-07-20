"use client";

import { KeyboardEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_ART_TRANSFORM,
  MAX_ZOOM,
  panBy,
  zoomAt,
} from "@/lib/art-transform";
import type { ArtTransform, FitMode, UploadedAsset } from "@/lib/types";

type UseArtGesturesArgs = {
  asset: UploadedAsset;
  /** Nominal box size in page pixels. */
  boxW: number;
  boxH: number;
  fitMode: FitMode;
  /**
   * Updater-style so every gesture step composes off the newest transform.
   * Passing a plain value here would drop moves, since pointermove fires faster
   * than React commits.
   */
  onChange: (update: (current: ArtTransform) => ArtTransform) => void;
};

const KEYBOARD_NUDGE = 4;
const KEYBOARD_NUDGE_COARSE = 24;
const KEYBOARD_ZOOM_STEP = 1.15;
const WHEEL_SENSITIVITY = 0.0015;
/** deltaMode 1 reports lines, not pixels; roughly one text line. */
const LINE_HEIGHT = 16;

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Drag-to-pan, wheel/pinch-to-zoom, double-click reset, and keyboard nudging for
 * an art region preview.
 *
 * All positions are converted from client pixels into the nominal box space the
 * transform math works in, so the preview can render at any size.
 */
export function useArtGestures({
  asset,
  boxW,
  boxH,
  fitMode,
  onChange,
}: UseArtGesturesArgs) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; midpoint: { x: number; y: number } } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Read through refs so the non-passive wheel listener never closes over stale
  // values and does not need re-binding on every change. Written in an effect
  // rather than during render; handlers only fire on interaction, long after
  // effects have flushed.
  const configRef = useRef({ asset, boxW, boxH, fitMode, onChange });
  useEffect(() => {
    configRef.current = { asset, boxW, boxH, fitMode, onChange };
  });

  /** Client coordinates -> nominal box coordinates. */
  const toBoxSpace = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 0, y: 0, scaleX: 1, scaleY: 1 };
    }
    const { boxW: width, boxH: height } = configRef.current;
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      scaleX,
      scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointersRef.current.size === 1) {
      setIsDragging(true);
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { distance: distance(a, b), midpoint: midpoint(a, b) };
    }
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      const pointers = pointersRef.current;
      const previous = pointers.get(event.pointerId);
      if (!previous) {
        return;
      }

      const current = { x: event.clientX, y: event.clientY };
      pointers.set(event.pointerId, current);
      const { asset: image, boxW: width, boxH: height, fitMode: fit, onChange: emit } =
        configRef.current;

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const start = pinchRef.current;
        const nextDistance = distance(a, b);
        const nextMidpoint = midpoint(a, b);
        if (!start || start.distance === 0) {
          pinchRef.current = { distance: nextDistance, midpoint: nextMidpoint };
          return;
        }

        const ratio = nextDistance / start.distance;
        const anchor = toBoxSpace(nextMidpoint.x, nextMidpoint.y);
        const panX = (nextMidpoint.x - start.midpoint.x) * anchor.scaleX;
        const panY = (nextMidpoint.y - start.midpoint.y) * anchor.scaleY;
        pinchRef.current = { distance: nextDistance, midpoint: nextMidpoint };

        emit((transform) => {
          const zoomed = zoomAt(
            transform,
            image,
            width,
            height,
            fit,
            transform.zoom * ratio,
            anchor.x,
            anchor.y,
          );
          return panBy(zoomed, image, width, height, fit, panX, panY);
        });
        return;
      }

      const { scaleX, scaleY } = toBoxSpace(current.x, current.y);
      const dx = (current.x - previous.x) * scaleX;
      const dy = (current.y - previous.y) * scaleY;
      if (dx === 0 && dy === 0) {
        return;
      }

      emit((transform) => panBy(transform, image, width, height, fit, dx, dy));
    },
    [toBoxSpace],
  );

  const handlePointerUp = useCallback((event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setIsDragging(false);
    }
  }, []);

  // React's onWheel is passive, so it cannot preventDefault -- without this the
  // page scrolls behind the modal while zooming.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const { asset: image, boxW: width, boxH: height, fitMode: fit, onChange: emit } =
        configRef.current;
      const delta = event.deltaMode === 1 ? event.deltaY * LINE_HEIGHT : event.deltaY;
      const factor = Math.exp(-delta * WHEEL_SENSITIVITY);
      const anchor = toBoxSpace(event.clientX, event.clientY);

      emit((transform) =>
        zoomAt(transform, image, width, height, fit, transform.zoom * factor, anchor.x, anchor.y),
      );
    }

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, [toBoxSpace]);

  const reset = useCallback(() => {
    configRef.current.onChange(() => ({ ...DEFAULT_ART_TRANSFORM }));
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const { asset: image, boxW: width, boxH: height, fitMode: fit, onChange: emit } =
      configRef.current;
    const step = event.shiftKey ? KEYBOARD_NUDGE_COARSE : KEYBOARD_NUDGE;

    const pan = (dx: number, dy: number) => {
      event.preventDefault();
      emit((transform) => panBy(transform, image, width, height, fit, dx, dy));
    };
    const zoom = (factor: number) => {
      event.preventDefault();
      emit((transform) =>
        zoomAt(
          transform,
          image,
          width,
          height,
          fit,
          transform.zoom * factor,
          width / 2,
          height / 2,
        ),
      );
    };

    switch (event.key) {
      case "ArrowLeft":
        return pan(-step, 0);
      case "ArrowRight":
        return pan(step, 0);
      case "ArrowUp":
        return pan(0, -step);
      case "ArrowDown":
        return pan(0, step);
      case "+":
      case "=":
        return zoom(KEYBOARD_ZOOM_STEP);
      case "-":
      case "_":
        return zoom(1 / KEYBOARD_ZOOM_STEP);
      case "0":
        event.preventDefault();
        return reset();
      default:
        return undefined;
    }
  }, [reset]);

  return {
    containerRef,
    isDragging,
    reset,
    maxZoom: MAX_ZOOM,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onDoubleClick: reset,
      onKeyDown: handleKeyDown,
    },
  };
}
