import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { STORAGE_KEY } from "@/lib/planner";
import {
  applyCardDropToPage,
  clearSlotPlacement,
  placeCardInPageSlot,
  placeCardsInSlots,
} from "@/lib/planner-layout-editor";
import { makeArtRegion, makeCard, makeLayout, makePage } from "@/__tests__/fixtures";

vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

function createDropEvent(data: Record<string, string>) {
  const preventDefault = vi.fn();
  const event = {
    preventDefault,
    dataTransfer: {
      getData: (key: string) => data[key] ?? "",
    },
  } as unknown as DragEvent<HTMLButtonElement>;

  return { event, preventDefault };
}

describe("drag-and-drop card placement and swapping", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe("pure page placement helpers", () => {
    it("places a catalog card into an empty slot without modifying other slots", () => {
      const page = makePage("page-1", { placements: { "0-0": "op01-001" } });

      const updated = applyCardDropToPage(page, "0-1", "op01-002", "");

      expect(updated.placements).toEqual({
        "0-0": "op01-001",
        "0-1": "op01-002",
      });
      expect(page.placements).toEqual({ "0-0": "op01-001" });
    });

    it("replaces an occupied slot when dropping a catalog card without a source slot", () => {
      const page = makePage("page-1", { placements: { "0-0": "op01-001" } });

      const updated = applyCardDropToPage(page, "0-0", "op01-009", "");

      expect(updated.placements).toEqual({ "0-0": "op01-009" });
    });

    it("moves a card from sourceSlotId to an empty targetSlotId and clears the source", () => {
      const page = makePage("page-1", {
        placements: { "0-0": "op01-001", "1-1": "op01-005" },
      });

      const updated = applyCardDropToPage(page, "2-2", "op01-001", "0-0");

      expect(updated.placements).toEqual({
        "1-1": "op01-005",
        "2-2": "op01-001",
      });
      expect(updated.placements["0-0"]).toBeUndefined();
    });

    it("swaps cards when dragging from one occupied slot to another occupied slot", () => {
      const page = makePage("page-1", {
        placements: { "0-0": "op01-001", "1-2": "op01-002" },
      });

      const updated = applyCardDropToPage(page, "1-2", "op01-001", "0-0");

      expect(updated.placements).toEqual({
        "0-0": "op01-002",
        "1-2": "op01-001",
      });
    });

    it("preserves the card when dropped back onto its own source slot", () => {
      const page = makePage("page-1", { placements: { "0-1": "op01-001" } });

      const updated = applyCardDropToPage(page, "0-1", "op01-001", "0-1");

      expect(updated.placements).toEqual({ "0-1": "op01-001" });
    });

    it("places single cards, fills multiple slots in order, and clears a slot immutably", () => {
      const page = makePage("page-1", { placements: { "0-0": "op01-001" } });

      const withSingle = placeCardInPageSlot(page, "0-2", "op01-002");
      const withBatch = placeCardsInSlots(
        withSingle,
        ["1-0", "1-1", "1-2"],
        ["op01-003", "op01-004"],
      );
      const afterClear = clearSlotPlacement(withBatch, "0-0");

      expect(withBatch.placements).toEqual({
        "0-0": "op01-001",
        "0-2": "op01-002",
        "1-0": "op01-003",
        "1-1": "op01-004",
      });
      expect(afterClear.placements).toEqual({
        "0-2": "op01-002",
        "1-0": "op01-003",
        "1-1": "op01-004",
      });
      expect(page.placements).toEqual({ "0-0": "op01-001" });
    });
  });

  describe("useLayoutManager drag-and-drop and slot placement", () => {
    it("handles DragEvent moves, swaps, empty payloads, and blocks slots occupied by Michi art", () => {
      const cards = [makeCard("op01-001"), makeCard("op01-002"), makeCard("op01-003")];
      const layout = makeLayout({
        pages: [
          makePage("page-1", {
            placements: {
              "0-0": "op01-001",
              "0-1": "op01-002",
            },
            artRegions: [
              makeArtRegion({
                id: "art-1",
                originRow: 1,
                originCol: 1,
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

      const { result } = renderHook(() => useLayoutManager(cards));

      // Swap 0-0 and 0-1
      const swapDrop = createDropEvent({
        "text/plain": "op01-001",
        "application/x-source-slot": "0-0",
      });
      act(() => {
        result.current.handleCardDrop(swapDrop.event, "0-1");
      });
      expect(swapDrop.preventDefault).toHaveBeenCalledTimes(1);
      expect(result.current.activePage?.placements).toEqual({
        "0-0": "op01-002",
        "0-1": "op01-001",
      });

      // Move 0-1 to empty 1-0
      const moveDrop = createDropEvent({
        "text/plain": "op01-001",
        "application/x-source-slot": "0-1",
      });
      act(() => {
        result.current.handleCardDrop(moveDrop.event, "1-0");
      });
      expect(result.current.activePage?.placements).toEqual({
        "0-0": "op01-002",
        "1-0": "op01-001",
      });

      // Block drop onto slot covered by Michi art (2-2 is inside 1-1..2-2)
      const artBlockedDrop = createDropEvent({
        "text/plain": "op01-002",
        "application/x-source-slot": "0-0",
      });
      act(() => {
        result.current.handleCardDrop(artBlockedDrop.event, "2-2");
      });
      expect(artBlockedDrop.preventDefault).toHaveBeenCalledTimes(1);
      expect(result.current.activePage?.placements["2-2"]).toBeUndefined();
      expect(result.current.activePage?.placements["0-0"]).toBe("op01-002");

      // Block direct placeCardInSlot on art-occupied slot, allow on empty slot
      act(() => {
        result.current.placeCardInSlot("1-2", "op01-003");
      });
      expect(result.current.activePage?.placements["1-2"]).toBeUndefined();

      act(() => {
        result.current.placeCardInSlot("2-0", "op01-003");
      });
      expect(result.current.activePage?.placements["2-0"]).toBe("op01-003");

      // Ignore empty text/plain payload
      const emptyDrop = createDropEvent({ "application/x-source-slot": "0-0" });
      act(() => {
        result.current.handleCardDrop(emptyDrop.event, "0-2");
      });
      expect(emptyDrop.preventDefault).toHaveBeenCalledTimes(1);
      expect(result.current.activePage?.placements["0-2"]).toBeUndefined();
      expect(result.current.activePage?.placements["0-0"]).toBe("op01-002");
    });
  });
});
