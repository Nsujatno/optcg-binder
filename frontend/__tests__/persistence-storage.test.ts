import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { loadPersistedState, STORAGE_KEY } from "@/lib/planner";
import { makeCard, makeLayout, makePage } from "@/__tests__/fixtures";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("persistence and storage failures", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("loadPersistedState", () => {
    it("creates a fresh default layout when storage is empty", () => {
      const state = loadPersistedState();

      expect(state.layouts).toHaveLength(1);
      expect(state.activeLayoutId).toBe(state.layouts[0].id);
      expect(state.cardSnapshots).toEqual([]);
    });

    it("restores valid persisted state, normalizes emptySlotStyle, defaults cardSnapshots, and migrates legacy art", () => {
      const savedLayout = makeLayout({
        id: "saved-1",
        theme: {
          binderBackground: "#111111",
          pageBackground: "#2f2f2f",
          slotAccent: "#1f2937",
          emptySlotStyle: "dashed",
        },
        assets: [{ id: "a1", name: "a1.png", src: "data:image/png;base64,a1", width: 800, height: 600 }],
        pages: [
          makePage("p1", {
            artRegions: [
              {
                id: "legacy-art",
                assetId: "a1",
                originRow: 0,
                originCol: 0,
                rowSpan: 1,
                colSpan: 1,
                cropX: 0,
                cropY: 0,
                zoom: 1,
                fitMode: "fill",
                locked: true,
              } as unknown as ReturnType<typeof makeLayout>["pages"][number]["artRegions"][number],
            ],
          }),
        ],
      });

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [savedLayout], activeLayoutId: savedLayout.id }),
      );

      const restored = loadPersistedState();

      expect(restored.activeLayoutId).toBe("saved-1");
      expect(restored.cardSnapshots).toEqual([]);
      expect(restored.layouts[0].theme.emptySlotStyle).toBe("glass");
      expect(restored.layouts[0].pages[0].artRegions[0].crop).toEqual({ x: 0.5, y: 0.5 });
      expect(restored.layouts[0].pages[0].artRegions[0].rotation).toBe(0);
    });

    it("falls back to a fresh default layout on corrupt JSON, invalid payloads, or thrown reads", () => {
      for (const badValue of ["{not-json", "null", JSON.stringify({ layouts: [], activeLayoutId: "x" }), JSON.stringify({ layouts: [makeLayout()] })]) {
        window.localStorage.setItem(STORAGE_KEY, badValue);
        const state = loadPersistedState();
        expect(state.layouts).toHaveLength(1);
        expect(state.activeLayoutId).toBe(state.layouts[0].id);
      }

      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Access denied", "SecurityError");
      });
      const afterError = loadPersistedState();
      expect(afterError.layouts).toHaveLength(1);
      expect(afterError.activeLayoutId).toBe(afterError.layouts[0].id);
    });

    it("returns a fresh default layout when window is undefined", () => {
      vi.stubGlobal("window", undefined);

      const state = loadPersistedState();
      expect(state.layouts).toHaveLength(1);
      expect(state.activeLayoutId).toBe(state.layouts[0].id);
      expect(state.cardSnapshots).toEqual([]);
    });
  });

  describe("useLayoutManager persistence and write failures", () => {
    it("hydrates from localStorage and persists mutations with matching cardSnapshots", () => {
      const cards = [makeCard("op01-001"), makeCard("op01-002")];
      const layout = makeLayout({ id: "hydrated-1", name: "My Binder" });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] }),
      );

      const { result } = renderHook(() => useLayoutManager(cards));
      expect(result.current.activeLayout?.name).toBe("My Binder");

      act(() => {
        result.current.placeCardInSlot("0-0", "op01-001");
      });

      const savedRaw = window.localStorage.getItem(STORAGE_KEY);
      expect(savedRaw).toBeTruthy();
      const saved = JSON.parse(savedRaw!);
      expect(saved.layouts[0].pages[0].placements).toEqual({ "0-0": "op01-001" });
      expect(saved.cardSnapshots.map((card: { id: string }) => card.id)).toEqual(["op01-001"]);
    });

    it("handles localStorage.setItem QuotaExceededError gracefully via onError without losing in-memory state", () => {
      const cards = [makeCard("op01-001")];
      const layout = makeLayout({ id: "layout-quota" });
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] }),
      );

      const onError = vi.fn();
      const { result } = renderHook(() => useLayoutManager(cards, onError));

      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      });

      expect(() => {
        act(() => {
          result.current.placeCardInSlot("0-0", "op01-001");
        });
      }).not.toThrow();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toMatch(/storage/i);
      expect(result.current.activePage?.placements).toEqual({ "0-0": "op01-001" });
    });
  });
});
