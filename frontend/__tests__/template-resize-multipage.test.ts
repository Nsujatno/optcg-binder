import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import {
  getTemplate,
  STORAGE_KEY,
  validateLayoutForTemplate,
  validatePageForTemplate,
} from "@/lib/planner";
import { applyTemplateToLayout } from "@/lib/planner-layout-editor";
import { getTemplateValidationById } from "@/lib/planner-layout-selectors";
import { countOccupiedSlots, resizePageForTemplate } from "@/lib/template-resize";
import { makeArtRegion, makeCard, makeLayout, makePage } from "@/__tests__/fixtures";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

function buildPlacements(slots: string[], prefix = "card"): Record<string, string> {
  return Object.fromEntries(slots.map((slot, index) => [slot, `${prefix}-${index + 1}`]));
}

describe("multi-page layout resizing and template validation", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("single-page resize and validation", () => {
    it("counts card slots and multi-slot art coverage", () => {
      const page = makePage("p1", {
        placements: { "0-0": "c1", "3-3": "c2" },
        artRegions: [
          makeArtRegion({
            id: "a1",
            originRow: 1,
            originCol: 1,
            rowSpan: 2,
            colSpan: 2,
          }),
        ],
      });

      expect(countOccupiedSlots(page)).toBe(6);
    });

    it("reflows out-of-bounds cards and art from 4x4 into 3x3 in slot order", () => {
      const page = makePage("p1", {
        placements: { "0-3": "c1", "3-1": "c2" },
        artRegions: [
          makeArtRegion({
            id: "a1",
            originRow: 2,
            originCol: 2,
            rowSpan: 2,
            colSpan: 2,
          }),
        ],
      });

      const result = resizePageForTemplate(page, getTemplate("4x4"), getTemplate("3x3"));

      expect(result.canApply).toBe(true);
      expect(result.page.placements).toEqual({
        "0-0": "c1",
        "1-0": "c2",
      });
      expect(result.page.artRegions[0]).toMatchObject({
        id: "a1",
        originRow: 0,
        originCol: 1,
        rowSpan: 2,
        colSpan: 2,
      });
    });

    it("rejects resizing when occupied slots exceed target capacity or art span cannot fit", () => {
      const crowdedPage = makePage("p1", {
        placements: buildPlacements([
          "0-0", "0-1", "0-2", "0-3",
          "1-0", "1-1", "1-2", "1-3",
          "2-0", "2-1",
        ]),
      });
      const crowdedValidation = validatePageForTemplate(
        crowdedPage,
        getTemplate("4x4"),
        getTemplate("3x3"),
      );
      expect(crowdedValidation.canApply).toBe(false);
      expect(crowdedValidation.hasTooManyCards).toBe(true);
      expect(crowdedValidation.reason).toBe("10 cards exceed 9 slots.");

      const wideArtPage = makePage("p2", {
        artRegions: [
          makeArtRegion({
            id: "wide",
            originRow: 0,
            originCol: 0,
            rowSpan: 1,
            colSpan: 4,
          }),
        ],
      });
      const wideArtValidation = validatePageForTemplate(
        wideArtPage,
        getTemplate("4x4"),
        getTemplate("3x3"),
      );
      expect(wideArtValidation.canApply).toBe(false);
      expect(wideArtValidation.hasTooManyCards).toBe(false);
      expect(wideArtValidation.hasOutOfBoundsArt).toBe(true);
    });
  });

  describe("binder-wide validation and atomic multi-page resizing", () => {
    it("reports the blocking non-active page when validating a multi-page binder", () => {
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1"),
          makePage("p2", {
            placements: buildPlacements([
              "0-0", "0-1", "0-2", "0-3",
              "1-0", "1-1", "1-2", "1-3",
              "2-0", "2-1",
            ]),
          }),
          makePage("p3"),
        ],
      });

      const validation = validateLayoutForTemplate(layout, getTemplate("3x3"));
      expect(validation.canApply).toBe(false);
      expect(validation.reason).toBe("Page 2: 10 cards exceed 9 slots.");

      const artBlockedLayout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1"),
          makePage("p2", { placements: { "0-0": "c1" } }),
          makePage("p3", {
            artRegions: [
              makeArtRegion({
                id: "wide",
                originRow: 0,
                originCol: 0,
                rowSpan: 1,
                colSpan: 4,
              }),
            ],
          }),
        ],
      });

      const artValidation = validateLayoutForTemplate(artBlockedLayout, getTemplate("3x3"));
      expect(artValidation.canApply).toBe(false);
      expect(artValidation.reason).toContain("Page 3:");
    });

    it("allows the binder's current template even on sparse multi-art arrangements", () => {
      const sparseLayout = makeLayout({
        templateId: "3x3",
        pages: [
          makePage("p1", {
            placements: { "0-1": "c1" },
            artRegions: [
              makeArtRegion({ id: "a1", originRow: 0, originCol: 2, rowSpan: 2, colSpan: 1 }),
              makeArtRegion({ id: "a2", originRow: 1, originCol: 0, rowSpan: 1, colSpan: 2 }),
              makeArtRegion({ id: "a3", originRow: 2, originCol: 0, rowSpan: 1, colSpan: 3 }),
            ],
          }),
        ],
      });

      expect(validateLayoutForTemplate(sparseLayout, getTemplate("3x3")).canApply).toBe(true);
      expect(getTemplateValidationById(sparseLayout).get("3x3")?.canApply).toBe(true);
      expect(applyTemplateToLayout(sparseLayout, "3x3")).toBe(sparseLayout);
    });

    it("disables templates in getTemplateValidationById when any page blocks them", () => {
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1"),
          makePage("p2", {
            placements: buildPlacements(["0-0", "0-1", "0-2", "0-3", "1-0"]),
          }),
        ],
      });

      const map = getTemplateValidationById(layout);
      expect(map.get("1x1")?.canApply).toBe(false);
      expect(map.get("2x2")?.canApply).toBe(false);
      expect(map.get("3x3")?.canApply).toBe(true);
      expect(map.get("4x4")?.canApply).toBe(true);
    });

    it("resizes every page in a 3-page 4x4 binder when switching to 3x3", () => {
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1", { placements: { "3-3": "p1-card" } }),
          makePage("p2", { placements: { "3-2": "p2-card-1", "3-3": "p2-card-2" } }),
          makePage("p3", {
            placements: { "3-0": "p3-card" },
            artRegions: [
              makeArtRegion({
                id: "p3-art",
                originRow: 2,
                originCol: 2,
                rowSpan: 2,
                colSpan: 2,
              }),
            ],
          }),
        ],
      });

      const resized = applyTemplateToLayout(layout, "3x3");

      expect(resized.templateId).toBe("3x3");
      expect(resized.pages[0].placements).toEqual({ "0-0": "p1-card" });
      expect(resized.pages[1].placements).toEqual({
        "0-0": "p2-card-1",
        "0-1": "p2-card-2",
      });
      expect(resized.pages[2].artRegions[0]).toMatchObject({
        id: "p3-art",
        originRow: 0,
        originCol: 0,
        rowSpan: 2,
        colSpan: 2,
      });
      expect(resized.pages[2].placements).toEqual({ "0-2": "p3-card" });

      for (const page of resized.pages) {
        for (const slot of Object.keys(page.placements)) {
          const [r, c] = slot.split("-").map(Number);
          expect(r).toBeLessThan(3);
          expect(c).toBeLessThan(3);
        }
        for (const region of page.artRegions) {
          expect(region.originRow + region.rowSpan).toBeLessThanOrEqual(3);
          expect(region.originCol + region.colSpan).toBeLessThanOrEqual(3);
        }
      }
    });

    it("is atomic: leaves all pages unchanged if any page fails to fit the target template", () => {
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1", { placements: { "3-3": "p1-card" } }),
          makePage("p2", {
            placements: buildPlacements([
              "0-0", "0-1", "0-2", "0-3",
              "1-0", "1-1", "1-2", "1-3",
              "2-0", "2-1",
            ]),
          }),
        ],
      });

      const result = applyTemplateToLayout(layout, "3x3");

      expect(result).toBe(layout);
      expect(result.templateId).toBe("4x4");
      expect(result.pages[0].placements).toEqual({ "3-3": "p1-card" });
    });
  });

  describe("useLayoutManager.setTemplate regression checks", () => {
    it("blocks shrinking a 4x4 binder to 3x3 from page 1 when page 2 has 12 cards", () => {
      const cards = Array.from({ length: 12 }, (_, i) => makeCard(`c-${i + 1}`));
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1"),
          makePage("p2", {
            placements: buildPlacements([
              "0-0", "0-1", "0-2", "0-3",
              "1-0", "1-1", "1-2", "1-3",
              "2-0", "2-1", "2-2", "2-3",
            ]),
          }),
          makePage("p3"),
        ],
      });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [layout], activeLayoutId: layout.id, cardSnapshots: cards }),
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useLayoutManager(cards, onError));

      expect(result.current.activePageIndex).toBe(0);
      expect(result.current.templateValidationById.get("3x3")?.canApply).toBe(false);

      act(() => {
        result.current.setTemplate("3x3");
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toContain("3 x 3");
      expect(onError.mock.calls[0][0]).toContain("Page 2");
      expect(result.current.activeLayout?.templateId).toBe("4x4");
      expect(Object.keys(result.current.activeLayout?.pages[1].placements ?? {})).toHaveLength(12);
    });

    it("resizes all 3 pages and resets selection when switching a 4x4 binder to 3x3", () => {
      const cards = [makeCard("c-1"), makeCard("c-2")];
      const layout = makeLayout({
        templateId: "4x4",
        pages: [
          makePage("p1"),
          makePage("p2", { placements: { "3-2": "c-1", "3-3": "c-2" } }),
          makePage("p3", {
            artRegions: [
              makeArtRegion({
                id: "art-p3",
                originRow: 2,
                originCol: 2,
                rowSpan: 2,
                colSpan: 2,
              }),
            ],
          }),
        ],
      });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [layout], activeLayoutId: layout.id, cardSnapshots: cards }),
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useLayoutManager(cards, onError));

      act(() => {
        result.current.setSelectedSlotId("2-2");
        result.current.setSelectedRegionId("art-p3");
      });

      act(() => {
        result.current.setTemplate("3x3");
      });

      expect(onError).not.toHaveBeenCalled();
      expect(result.current.activeLayout?.templateId).toBe("3x3");
      expect(result.current.activeLayout?.pages[1].placements).toEqual({
        "0-0": "c-1",
        "0-1": "c-2",
      });
      expect(result.current.activeLayout?.pages[2].artRegions[0]).toMatchObject({
        originRow: 0,
        originCol: 0,
        rowSpan: 2,
        colSpan: 2,
      });
      expect(result.current.selectedSlotId).toBe("0-0");
      expect(result.current.selectedRegionId).toBeNull();
    });
  });
});
