import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { migrateLayouts, STORAGE_KEY } from "@/lib/planner";
import { buildLayoutExport, parseImportedLayouts } from "@/lib/planner-layout-editor";
import { makeArtRegion, makeAsset, makeCard, makeLayout, makePage } from "@/__tests__/fixtures";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

function makeFileChangeEvent(content: string): ChangeEvent<HTMLInputElement> {
  return {
    target: {
      files: [{ text: async () => content }],
    },
  } as unknown as ChangeEvent<HTMLInputElement>;
}

describe("JSON import and export", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("pure export, parse, and migration", () => {
    it("round-trips layouts, activeLayoutId, pages, art regions, assets, theme, and cardSnapshots", () => {
      const card = makeCard("op01-001");
      const asset = makeAsset("asset-1", { width: 1200, height: 900 });
      const layout = makeLayout({
        id: "layout-export",
        name: "Exported Binder",
        templateId: "4x4",
        assets: [asset],
        pages: [
          makePage("p1", {
            placements: { "0-0": card.id },
            artRegions: [
              makeArtRegion({
                id: "art-1",
                assetId: asset.id,
                originRow: 1,
                originCol: 1,
                rowSpan: 2,
                colSpan: 2,
                crop: { x: 0.4, y: 0.6 },
                zoom: 1.5,
                rotation: 15,
                flipH: true,
                fitMode: "contain",
              }),
            ],
          }),
        ],
      });

      const json = buildLayoutExport([layout], layout.id, [card]);
      const parsed = parseImportedLayouts(json);

      expect(parsed.activeLayoutId).toBe("layout-export");
      expect(parsed.layouts).toEqual([layout]);
      expect(parsed.cardSnapshots).toEqual([card]);
    });

    it("migrates legacy art regions while preserving already-migrated regions", () => {
      const asset = makeAsset("asset-legacy", { width: 800, height: 600 });
      const modernRegion = makeArtRegion({
        id: "modern",
        assetId: asset.id,
        crop: { x: 0.25, y: 0.75 },
        zoom: 1.8,
        rotation: 90,
        flipH: true,
      });

      const legacyLayout = makeLayout({
        assets: [asset],
        pages: [
          makePage("p1", {
            artRegions: [
              modernRegion,
              {
                id: "legacy",
                assetId: asset.id,
                originRow: 1,
                originCol: 1,
                rowSpan: 1,
                colSpan: 1,
                cropX: 10,
                cropY: -5,
                zoom: 1.4,
                fitMode: "fill",
                locked: true,
              } as unknown as ReturnType<typeof makeArtRegion>,
            ],
          }),
        ],
      });

      const [migrated] = migrateLayouts([legacyLayout]);
      const [kept, upgraded] = migrated.pages[0].artRegions;

      expect(kept).toEqual(modernRegion);
      expect(upgraded.crop).toBeDefined();
      expect(typeof upgraded.rotation).toBe("number");
      expect(upgraded.rotation).toBe(0);
      expect(upgraded.flipH).toBe(false);
      expect(upgraded.zoom).toBeCloseTo(1.4, 5);
      expect("cropX" in upgraded).toBe(false);
      expect("cropY" in upgraded).toBe(false);
    });

    it("throws on malformed JSON or payloads with missing or empty layouts", () => {
      expect(() => parseImportedLayouts("{bad json")).toThrow();
      expect(() => parseImportedLayouts(JSON.stringify({ activeLayoutId: "x" }))).toThrow(
        "Invalid layout file",
      );
      expect(() =>
        parseImportedLayouts(JSON.stringify({ layouts: [], activeLayoutId: "x" })),
      ).toThrow("Invalid layout file");
    });
  });

  describe("useLayoutManager.importLayouts", () => {
    it("loads valid imported JSON, updates resolvedCardPool, and resets selection state", async () => {
      const initialCard = makeCard("initial-card");
      const initialLayout = makeLayout({
        id: "initial-layout",
        pages: [makePage("p1", { placements: { "0-0": initialCard.id } }), makePage("p2")],
      });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          layouts: [initialLayout],
          activeLayoutId: initialLayout.id,
          cardSnapshots: [initialCard],
        }),
      );

      const { result } = renderHook(() => useLayoutManager([]));
      act(() => {
        result.current.setActivePageIndex(1);
        result.current.setSelectedSlotId("1-1");
        result.current.setSelectedRegionId("some-region");
      });

      const importedCard = makeCard("imported-card", { name: "Shanks" });
      const importedLayout = makeLayout({
        id: "imported-layout",
        name: "Imported Binder",
        pages: [makePage("imp-p1", { placements: { "0-0": importedCard.id } })],
      });
      const json = buildLayoutExport([importedLayout], importedLayout.id, [importedCard]);

      await act(async () => {
        await result.current.importLayouts(makeFileChangeEvent(json));
      });

      expect(result.current.activeLayoutId).toBe("imported-layout");
      expect(result.current.layouts).toEqual([importedLayout]);
      expect(result.current.resolvedCardPool).toEqual([importedCard]);
      expect(result.current.activePageIndex).toBe(0);
      expect(result.current.selectedSlotId).toBe("0-0");
      expect(result.current.selectedRegionId).toBeNull();
    });

    it("falls back activeLayoutId to the first imported layout when missing", async () => {
      const { result } = renderHook(() => useLayoutManager([]));
      const importedLayout = makeLayout({ id: "fallback-layout", name: "Fallback Binder" });
      const payload = JSON.stringify({ layouts: [importedLayout] });

      await act(async () => {
        await result.current.importLayouts(makeFileChangeEvent(payload));
      });

      expect(result.current.activeLayoutId).toBe("fallback-layout");
      expect(result.current.activeLayout?.name).toBe("Fallback Binder");
    });

    it("rejects invalid JSON imports without mutating existing layouts", async () => {
      const existingLayout = makeLayout({ id: "keep-me", name: "Existing Binder" });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [existingLayout], activeLayoutId: existingLayout.id }),
      );

      const { result } = renderHook(() => useLayoutManager([]));

      await expect(
        act(async () => {
          await result.current.importLayouts(makeFileChangeEvent("{invalid"));
        }),
      ).rejects.toThrow();

      expect(result.current.layouts).toEqual([existingLayout]);
      expect(result.current.activeLayoutId).toBe("keep-me");
    });
  });
});
