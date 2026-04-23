"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import type {
  ArtRegion,
  BinderLayout,
  BinderPage,
  BinderTemplateId,
  CardRecord,
} from "@/lib/types";
import {
  createId,
  createLayout,
  createPage,
  getSlotsCovered,
  getTemplate,
  loadPersistedState,
  matchesCardPlacementId,
  PersistedState,
  sanitizePageForTemplate,
  slotKey,
  STORAGE_KEY,
} from "@/lib/planner";

export function useLayoutManager(cards: CardRecord[]) {
  const [layouts, setLayouts] = useState<BinderLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string>("");
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState("0-0");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const persisted = loadPersistedState();
    setLayouts(persisted.layouts);
    setActiveLayoutId(persisted.activeLayoutId);
    hasHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hasHydrated.current || !layouts.length || !activeLayoutId) {
      return;
    }

    const state: PersistedState = { layouts, activeLayoutId };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [activeLayoutId, layouts]);

  const activeLayout = useMemo(
    () => layouts.find((layout) => layout.id === activeLayoutId) ?? null,
    [activeLayoutId, layouts],
  );
  const activeTemplate = useMemo(
    () => getTemplate(activeLayout?.templateId ?? "3x3"),
    [activeLayout?.templateId],
  );
  const activePage = activeLayout?.pages[activePageIndex] ?? null;
  const selectedCard = useMemo(
    () =>
      cards.find((card) =>
        matchesCardPlacementId(card, activePage?.placements[selectedSlotId]),
      ) ?? null,
    [activePage?.placements, cards, selectedSlotId],
  );
  const selectedRegion = useMemo(
    () => activePage?.artRegions.find((region) => region.id === selectedRegionId) ?? null,
    [activePage?.artRegions, selectedRegionId],
  );
  const occupiedByArt = useMemo(() => {
    const slots = new Map<string, ArtRegion>();
    activePage?.artRegions.forEach((region) => {
      getSlotsCovered(region).forEach((coveredSlot) => slots.set(coveredSlot, region));
    });
    return slots;
  }, [activePage?.artRegions]);
  const currentSlotPosition = useMemo(() => {
    const [row = "0", col = "0"] = selectedSlotId.split("-");
    return {
      row: Number.parseInt(row, 10),
      col: Number.parseInt(col, 10),
    };
  }, [selectedSlotId]);
  const activeLayoutAssets = activeLayout?.assets ?? [];
  const activePagePlacedCardIds = useMemo(
    () => Object.values(activePage?.placements ?? {}),
    [activePage?.placements],
  );
  const availableSlotIds = useMemo(() => {
    if (!activePage) {
      return [];
    }

    const slots: string[] = [];
    for (let row = 0; row < activeTemplate.rows; row += 1) {
      for (let col = 0; col < activeTemplate.cols; col += 1) {
        const currentSlotId = slotKey(row, col);
        if (activePage.placements[currentSlotId] || occupiedByArt.has(currentSlotId)) {
          continue;
        }
        slots.push(currentSlotId);
      }
    }
    return slots;
  }, [activePage, activeTemplate.cols, activeTemplate.rows, occupiedByArt]);
  const remainingPageCapacity = availableSlotIds.length;

  function updateLayouts(
    updater: (currentLayouts: BinderLayout[]) => BinderLayout[],
    nextActiveLayoutId?: string,
  ) {
    setLayouts((currentLayouts) => {
      const updatedLayouts = updater(currentLayouts).map((layout) => ({
        ...layout,
        updatedAt: new Date().toISOString(),
      }));
      const targetLayoutId =
        nextActiveLayoutId ?? activeLayoutId ?? updatedLayouts[0]?.id ?? "";
      if (targetLayoutId) {
        setActiveLayoutId(targetLayoutId);
      }
      return updatedLayouts;
    });
  }

  function updateActiveLayout(updater: (layout: BinderLayout) => BinderLayout) {
    if (!activeLayout) {
      return;
    }

    updateLayouts((currentLayouts) =>
      currentLayouts.map((layout) =>
        layout.id === activeLayout.id ? updater(layout) : layout,
      ),
    );
  }

  function updateActivePage(updater: (page: BinderPage) => BinderPage) {
    if (!activeLayout || !activePage) {
      return;
    }

    updateActiveLayout((layout) => ({
      ...layout,
      pages: layout.pages.map((page, index) =>
        index === activePageIndex ? updater(page) : page,
      ),
    }));
  }

  function createNewLayout() {
    const layout = createLayout(`Binder ${layouts.length + 1}`);
    setActivePageIndex(0);
    setSelectedSlotId("0-0");
    updateLayouts((currentLayouts) => [...currentLayouts, layout], layout.id);
  }

  function duplicateLayout() {
    if (!activeLayout) {
      return;
    }

    const duplicate: BinderLayout = {
      ...structuredClone(activeLayout),
      id: createId("layout"),
      name: `${activeLayout.name} Copy`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateLayouts((currentLayouts) => [...currentLayouts, duplicate], duplicate.id);
  }

  function deleteLayout() {
    if (!activeLayout || layouts.length === 1) {
      return;
    }

    const remainingLayouts = layouts.filter((layout) => layout.id !== activeLayout.id);
    setActivePageIndex(0);
    setSelectedRegionId(null);
    updateLayouts(() => remainingLayouts, remainingLayouts[0]?.id ?? "");
  }

  function renameLayout() {
    if (!activeLayout || !renameDraft.trim()) {
      return;
    }

    updateActiveLayout((layout) => ({
      ...layout,
      name: renameDraft.trim(),
    }));
    setRenameDraft("");
  }

  function addPage() {
    updateActiveLayout((layout) => ({
      ...layout,
      pages: [...layout.pages, createPage()],
    }));
    setActivePageIndex(activeLayout?.pages.length ?? 0);
  }

  function duplicatePage() {
    if (!activeLayout || !activePage) {
      return;
    }

    const duplicate = structuredClone(activePage);
    duplicate.id = createId("page");
    updateActiveLayout((layout) => ({
      ...layout,
      pages: [
        ...layout.pages.slice(0, activePageIndex + 1),
        duplicate,
        ...layout.pages.slice(activePageIndex + 1),
      ],
    }));
    setActivePageIndex(activePageIndex + 1);
  }

  function clearSelectedSlot() {
    if (!activePage) {
      return;
    }

    updateActivePage((page) => {
      const nextPlacements = { ...page.placements };
      delete nextPlacements[selectedSlotId];
      return {
        ...page,
        placements: nextPlacements,
      };
    });
  }

  function setTemplate(templateId: BinderTemplateId) {
    const template = getTemplate(templateId);
    updateActiveLayout((layout) => ({
      ...layout,
      templateId,
      pages: layout.pages.map((page) => sanitizePageForTemplate(page, template)),
    }));
    setSelectedRegionId(null);
    setSelectedSlotId("0-0");
  }

  function updateTheme<K extends keyof BinderLayout["theme"]>(
    key: K,
    value: BinderLayout["theme"][K],
  ) {
    updateActiveLayout((layout) => ({
      ...layout,
      theme: {
        ...layout.theme,
        [key]: value,
      },
    }));
  }

  function exportLayouts() {
    const blob = new Blob(
      [JSON.stringify({ layouts, activeLayoutId }, null, 2)],
      { type: "application/json" },
    );
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "one-piece-binder-layouts.json";
    link.click();
    window.URL.revokeObjectURL(url);
  }

  async function importLayouts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = JSON.parse(text) as PersistedState;
    if (!parsed.layouts?.length) {
      throw new Error("Invalid layout file");
    }
    setLayouts(parsed.layouts);
    setActiveLayoutId(parsed.activeLayoutId ?? parsed.layouts[0].id);
    setActivePageIndex(0);
    setSelectedSlotId("0-0");
    setSelectedRegionId(null);
  }

  function handleCardDrop(event: DragEvent<HTMLButtonElement>, targetSlotId: string) {
    event.preventDefault();

    if (!activePage || occupiedByArt.has(targetSlotId)) {
      return;
    }

    const cardId = event.dataTransfer.getData("text/plain");
    const sourceSlotId = event.dataTransfer.getData("application/x-source-slot");
    if (!cardId) {
      return;
    }

    updateActivePage((page) => {
      const nextPlacements = { ...page.placements };
      const targetCardId = nextPlacements[targetSlotId];

      nextPlacements[targetSlotId] = cardId;

      if (sourceSlotId) {
        if (targetCardId) {
          nextPlacements[sourceSlotId] = targetCardId;
        } else {
          delete nextPlacements[sourceSlotId];
        }
      }

      return {
        ...page,
        placements: nextPlacements,
      };
    });
  }

  function placeCardsInNextEmptySlots(cardIds: string[]) {
    if (!activePage || !cardIds.length) {
      return;
    }

    const targetSlotIds = availableSlotIds.slice(0, cardIds.length);
    if (!targetSlotIds.length) {
      return;
    }

    updateActivePage((page) => {
      const nextPlacements = { ...page.placements };
      targetSlotIds.forEach((targetSlotId, index) => {
        const cardId = cardIds[index];
        if (cardId) {
          nextPlacements[targetSlotId] = cardId;
        }
      });

      return {
        ...page,
        placements: nextPlacements,
      };
    });
  }

  return {
    layouts,
    activeLayoutId,
    setActiveLayoutId,
    activePageIndex,
    setActivePageIndex,
    selectedSlotId,
    setSelectedSlotId,
    selectedRegionId,
    setSelectedRegionId,
    renameDraft,
    setRenameDraft,
    importInputRef,
    activeLayout,
    activeTemplate,
    activePage,
    selectedCard,
    selectedRegion,
    occupiedByArt,
    currentSlotPosition,
    activeLayoutAssets,
    activePagePlacedCardIds,
    availableSlotIds,
    remainingPageCapacity,
    updateLayouts,
    updateActiveLayout,
    updateActivePage,
    createNewLayout,
    duplicateLayout,
    deleteLayout,
    renameLayout,
    addPage,
    duplicatePage,
    clearSelectedSlot,
    setTemplate,
    updateTheme,
    exportLayouts,
    importLayouts,
    handleCardDrop,
    placeCardsInNextEmptySlots,
  };
}

export type LayoutManager = ReturnType<typeof useLayoutManager>;
