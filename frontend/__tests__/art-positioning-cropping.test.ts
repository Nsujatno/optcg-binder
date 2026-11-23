import { describe, expect, it } from "vitest";
import { canPlaceArtRegion } from "@/lib/art-region-placement";
import {
  clampCrop,
  clampZoom,
  computeArtDraw,
  containZoom,
  coverScale,
  DEFAULT_ART_TRANSFORM,
  MAX_ZOOM,
  migrateArtTransform,
  MIN_ZOOM_CONTAIN,
  MIN_ZOOM_FILL,
  panBy,
  rotateTo,
  zoomAt,
} from "@/lib/art-transform";
import {
  doesArtRegionFitTemplate,
  getRegionBoxSize,
  getSlotsCovered,
  getTemplate,
  PAGE_GRID_GAP,
  CARD_SLOT_HEIGHT,
  CARD_SLOT_WIDTH,
  regionContainsSlot,
} from "@/lib/planner";
import type { ArtTransform } from "@/lib/types";
import { makeArtRegion, makePage } from "@/__tests__/fixtures";

describe("artwork positioning, cropping, and geometry", () => {
  describe("canPlaceArtRegion", () => {
    const template3x3 = getTemplate("3x3");

    it("accepts valid 1x1 and multi-slot spans inside the grid", () => {
      const page = makePage("p1");

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 0,
          originCol: 0,
          rowSpan: 2,
          colSpan: 2,
        }),
      ).toBe(true);
    });

    it("rejects spans exceeding template rows or columns", () => {
      const page = makePage("p1");

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 2,
          originCol: 0,
          rowSpan: 2,
          colSpan: 1,
        }),
      ).toBe(false);

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 0,
          originCol: 1,
          rowSpan: 1,
          colSpan: 3,
        }),
      ).toBe(false);
    });

    it("rejects spans overlapping cards or other art regions, unless ignored", () => {
      const existing = makeArtRegion({
        id: "art-existing",
        originRow: 1,
        originCol: 1,
        rowSpan: 2,
        colSpan: 2,
      });
      const page = makePage("p1", {
        placements: { "0-0": "op01-001" },
        artRegions: [existing],
      });

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 0,
          originCol: 0,
          rowSpan: 1,
          colSpan: 2,
        }),
      ).toBe(false);

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 0,
          originCol: 1,
          rowSpan: 2,
          colSpan: 1,
        }),
      ).toBe(false);

      expect(
        canPlaceArtRegion({
          page,
          template: template3x3,
          originRow: 1,
          originCol: 1,
          rowSpan: 2,
          colSpan: 2,
          ignoreRegionId: "art-existing",
        }),
      ).toBe(true);
    });
  });

  describe("art-transform math", () => {
    const landscape = { width: 1000, height: 500 };

    it("computes coverScale, containZoom, and clampZoom across fit modes", () => {
      expect(coverScale({ width: 0, height: 100 }, 200, 300, 0)).toBe(1);
      expect(coverScale(landscape, 200, 200, 0)).toBeCloseTo(0.4, 6);
      expect(coverScale(landscape, 200, 200, 45)).toBeGreaterThan(
        coverScale(landscape, 200, 200, 0),
      );

      expect(containZoom(landscape, 200, 200, 0)).toBeCloseTo(0.5, 6);
      expect(containZoom({ width: 0, height: 100 }, 200, 200, 0)).toBe(1);

      expect(clampZoom(0.2, "fill")).toBe(MIN_ZOOM_FILL);
      expect(clampZoom(0.01, "contain")).toBe(MIN_ZOOM_CONTAIN);
      expect(clampZoom(15, "fill")).toBe(MAX_ZOOM);
      expect(clampZoom(2.5, "fill")).toBe(2.5);
    });

    it("computes draw geometry from focal crop, rotation, and horizontal flip", () => {
      const centered = computeArtDraw(DEFAULT_ART_TRANSFORM, { width: 400, height: 400 }, 200, 200);
      expect(centered).toEqual({
        centerX: 100,
        centerY: 100,
        drawW: 200,
        drawH: 200,
        rotationRad: 0,
        flipH: false,
      });

      const shifted = computeArtDraw(
        { crop: { x: 0.75, y: 0.25 }, zoom: 2, rotation: 0, flipH: false },
        { width: 400, height: 400 },
        200,
        200,
      );
      expect(shifted.drawW).toBe(400);
      expect(shifted.centerX).toBeCloseTo(0, 6);
      expect(shifted.centerY).toBeCloseTo(200, 6);

      const flipped = computeArtDraw(
        { crop: { x: 0.75, y: 0.5 }, zoom: 2, rotation: 90, flipH: true },
        { width: 400, height: 400 },
        200,
        200,
      );
      expect(flipped.flipH).toBe(true);
      expect(flipped.rotationRad).toBeCloseTo(Math.PI / 2, 6);
      expect(flipped.centerX).toBeCloseTo(100, 6);
      expect(flipped.centerY).toBeCloseTo(200, 6);
    });

    it("clamps focal crop in fill mode, preserves in contain mode, and strips extra caller fields", () => {
      const draftWithExtra = {
        crop: { x: 5, y: -4 },
        zoom: 1,
        rotation: 0,
        flipH: false,
        rowSpan: 2,
      } as ArtTransform & { rowSpan: number };

      const clampedFill = clampCrop(draftWithExtra, { width: 400, height: 400 }, 200, 200, "fill");
      expect(clampedFill).toEqual({
        crop: { x: 0.5, y: 0.5 },
        zoom: 1,
        rotation: 0,
        flipH: false,
      });
      expect("rowSpan" in clampedFill).toBe(false);

      const clampedRotated = clampCrop(
        { crop: { x: 2, y: 2 }, zoom: 1.5, rotation: 30, flipH: false },
        { width: 400, height: 400 },
        200,
        200,
        "fill",
      );
      expect(clampedRotated.crop.x).toBeLessThan(2);
      expect(clampedRotated.crop.y).toBeLessThan(2);

      const containResult = clampCrop(
        { crop: { x: 2, y: -1 }, zoom: 0.5, rotation: 0, flipH: false },
        { width: 400, height: 400 },
        200,
        200,
        "contain",
      );
      expect(containResult.crop).toEqual({ x: 2, y: -1 });
    });

    it("pans inversely with drag deltas, respects rotation and flipH, and clamps only in fill mode", () => {
      const square = { width: 400, height: 400 };
      const pannedRight = panBy(
        { crop: { x: 0.5, y: 0.5 }, zoom: 2, rotation: 0, flipH: false },
        square,
        200,
        200,
        "fill",
        50,
        0,
      );
      expect(pannedRight.crop.x).toBeCloseTo(0.375, 6);
      expect(pannedRight.crop.y).toBeCloseTo(0.5, 6);

      const pannedFlipped = panBy(
        { crop: { x: 0.5, y: 0.5 }, zoom: 2, rotation: 0, flipH: true },
        square,
        200,
        200,
        "fill",
        50,
        0,
      );
      expect(pannedFlipped.crop.x).toBeCloseTo(0.625, 6);

      const pannedRotated = panBy(
        { crop: { x: 0.5, y: 0.5 }, zoom: 2, rotation: 90, flipH: false },
        square,
        200,
        200,
        "fill",
        50,
        0,
      );
      expect(pannedRotated.crop.x).toBeCloseTo(0.5, 6);
      expect(pannedRotated.crop.y).toBeCloseTo(0.625, 6);

      const pannedContain = panBy(
        { crop: { x: 0.5, y: 0.5 }, zoom: 1, rotation: 0, flipH: false },
        square,
        200,
        200,
        "contain",
        1000,
        0,
      );
      expect(pannedContain.crop.x).toBeLessThan(0);
    });

    it("keeps the source pixel under the pointer stationary during zoomAt", () => {
      const square = { width: 1000, height: 1000 };
      const pointerX = 150;
      const pointerY = 120;
      const initial = { ...DEFAULT_ART_TRANSFORM };

      const beforeDraw = computeArtDraw(initial, square, 200, 200);
      const beforeNormX = (pointerX - beforeDraw.centerX) / beforeDraw.drawW + 0.5;
      const beforeNormY = (pointerY - beforeDraw.centerY) / beforeDraw.drawH + 0.5;

      const zoomed = zoomAt(initial, square, 200, 200, "fill", 2, pointerX, pointerY);
      const afterDraw = computeArtDraw(zoomed, square, 200, 200);
      const afterNormX = (pointerX - afterDraw.centerX) / afterDraw.drawW + 0.5;
      const afterNormY = (pointerY - afterDraw.centerY) / afterDraw.drawH + 0.5;

      expect(zoomed.zoom).toBe(2);
      expect(afterNormX).toBeCloseTo(beforeNormX, 6);
      expect(afterNormY).toBeCloseTo(beforeNormY, 6);

      const zeroZoomFallback = zoomAt(
        { crop: { x: 0.5, y: 0.5 }, zoom: 0, rotation: 0, flipH: false },
        square,
        200,
        200,
        "fill",
        2,
        100,
        100,
      );
      expect(zeroZoomFallback.zoom).toBe(2);
      expect(zeroZoomFallback.crop).toEqual({ x: 0.5, y: 0.5 });
    });

    it("rotates and re-clamps in fill mode and migrates legacy transforms", () => {
      const rotated = rotateTo(
        { crop: { x: 0.9, y: 0.9 }, zoom: 1, rotation: 0, flipH: false },
        { width: 400, height: 400 },
        200,
        200,
        "fill",
        45,
      );
      expect(rotated.rotation).toBe(45);
      expect(rotated.crop.x).toBeCloseTo(0.5, 6);
      expect(rotated.crop.y).toBeCloseTo(0.5, 6);

      const legacyFill = migrateArtTransform(
        { cropX: 10, cropY: -10, zoom: 1.5 },
        { width: 1000, height: 800 },
        200,
        200,
        "fill",
      );
      expect(legacyFill.zoom).toBeCloseTo(1.5, 6);
      expect(legacyFill.rotation).toBe(0);
      expect(legacyFill.flipH).toBe(false);
      expect(legacyFill.crop.x).toBeLessThan(0.5);
      expect(legacyFill.crop.y).toBeGreaterThan(0.5);

      const legacyContain = migrateArtTransform(
        { cropX: 0, cropY: 0, zoom: 1 },
        { width: 1000, height: 500 },
        200,
        200,
        "contain",
      );
      expect(legacyContain.zoom).toBeCloseTo(0.5, 6);
      expect(legacyContain.crop).toEqual({ x: 0.5, y: 0.5 });
    });
  });

  describe("planner art geometry helpers", () => {
    it("computes box sizes, covered slots, containment, and template bounds", () => {
      expect(getRegionBoxSize(2, 3)).toEqual({
        width: 3 * CARD_SLOT_WIDTH + 2 * PAGE_GRID_GAP,
        height: 2 * CARD_SLOT_HEIGHT + PAGE_GRID_GAP,
      });

      const region = makeArtRegion({
        originRow: 1,
        originCol: 1,
        rowSpan: 2,
        colSpan: 2,
      });
      expect(getSlotsCovered(region)).toEqual(["1-1", "1-2", "2-1", "2-2"]);
      expect(regionContainsSlot(region, 2, 2)).toBe(true);
      expect(regionContainsSlot(region, 0, 1)).toBe(false);
      expect(doesArtRegionFitTemplate(region, getTemplate("3x3"))).toBe(true);
      expect(doesArtRegionFitTemplate(region, getTemplate("2x2"))).toBe(false);
    });
  });
});
