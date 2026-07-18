"use client";

import { track } from "@vercel/analytics";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import type { ToastVariant } from "@/hooks/use-toast";
import type { BinderLayout, BinderPage, BinderTemplateId, CardRecord } from "@/lib/types";
import {
  buildLayoutExport,
  createDuplicatedLayout,
  addPageToLayout,
  applyCardDropToPage,
  applyTemplateToLayout,
  clearSlotPlacement,
  clearPagePlacementsAndArt,
  duplicatePageInLayout,
  markLayoutsUpdated,
  parseImportedLayouts,
  placeCardInPageSlot,
  placeCardsInSlots,
  renameLayout as renameLayoutRecord,
  updateLayoutById,
  updateLayoutTheme,
  updatePageByIndex,
  upsertCardSnapshot as upsertCardSnapshotRecord,
} from "@/lib/planner-layout-editor";
import {
  getActiveLayout,
  getActivePagePlacedCardIds,
  getAvailableSlotIds,
  getCurrentSlotPosition,
  getOccupiedByArt,
  getPlacementCardSnapshots,
  getSelectedCard,
  getSelectedRegion,
  getTemplateValidationById,
  resolveCardPool,
} from "@/lib/planner-layout-selectors";
import {
  createLayout,
  getTemplate,
  loadPersistedState,
  PersistedState,
  STORAGE_KEY,
  validatePageForTemplate,
} from "@/lib/planner";

export function useLayoutManager(
  cards: CardRecord[],
  onError?: (message: string, variant?: ToastVariant) => void,
) {
  const [layouts, setLayouts] = useState<BinderLayout[]>([]);
  const [activeLayoutId, setActiveLayoutId] = useState<string>("");
  const [persistedCardSnapshots, setPersistedCardSnapshots] = useState<CardRecord[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>("0-0");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    const persisted = loadPersistedState();
    setLayouts(persisted.layouts);
    setActiveLayoutId(persisted.activeLayoutId);
    setPersistedCardSnapshots(persisted.cardSnapshots ?? []);
    hasHydrated.current = true;
  }, []);

  const resolvedCardPool = useMemo(() => {
    return resolveCardPool(cards, persistedCardSnapshots);
  }, [cards, persistedCardSnapshots]);

  const placementCardSnapshots = useMemo(
    () => getPlacementCardSnapshots(layouts, resolvedCardPool),
    [layouts, resolvedCardPool],
  );

  useEffect(() => {
    if (!hasHydrated.current || !layouts.length || !activeLayoutId) {
      return;
    }

    const state: PersistedState = {
      layouts,
      activeLayoutId,
      cardSnapshots: placementCardSnapshots,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [activeLayoutId, layouts, placementCardSnapshots]);

  const activeLayout = useMemo(
    () => getActiveLayout(layouts, activeLayoutId),
    [activeLayoutId, layouts],
  );
  const activeTemplate = useMemo(
    () => getTemplate(activeLayout?.templateId ?? "3x3"),
    [activeLayout?.templateId],
  );
  const activePage = activeLayout?.pages[activePageIndex] ?? null;
  const selectedCard = useMemo(
    () => getSelectedCard(activePage, resolvedCardPool, selectedSlotId),
    [activePage?.placements, resolvedCardPool, selectedSlotId],
  );
  const selectedRegion = useMemo(
    () => getSelectedRegion(activePage, selectedRegionId),
    [activePage?.artRegions, selectedRegionId],
  );
  const occupiedByArt = useMemo(() => {
    return getOccupiedByArt(activePage);
  }, [activePage?.artRegions]);
  const currentSlotPosition = useMemo(() => {
    return getCurrentSlotPosition(selectedSlotId);
  }, [selectedSlotId]);
  const activeLayoutAssets = activeLayout?.assets ?? [];
  const activePagePlacedCardIds = useMemo(
    () => getActivePagePlacedCardIds(activePage),
    [activePage?.placements],
  );
  const activePagePlacedCardCount = activePagePlacedCardIds.length;
  const availableSlotIds = useMemo(() => {
    return getAvailableSlotIds(activePage, activeTemplate, occupiedByArt);
  }, [activePage, activeTemplate.cols, activeTemplate.rows, occupiedByArt]);
  const remainingPageCapacity = availableSlotIds.length;
  const templateValidationById = useMemo(() => {
    return getTemplateValidationById(activePage, activeTemplate);
  }, [activePage]);

  function updateLayouts(
    updater: (currentLayouts: BinderLayout[]) => BinderLayout[],
    nextActiveLayoutId?: string,
  ) {
    setLayouts((currentLayouts) => {
      const updatedLayouts = markLayoutsUpdated(updater(currentLayouts));
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
      updateLayoutById(currentLayouts, activeLayout.id, updater),
    );
  }

  function updateActivePage(updater: (page: BinderPage) => BinderPage) {
    if (!activeLayout || !activePage) {
      return;
    }

    updateActiveLayout((layout) => updatePageByIndex(layout, activePageIndex, updater));
  }

  function createNewLayout() {
    const layout = createLayout(`Binder ${layouts.length + 1}`);
    setActivePageIndex(0);
    setSelectedSlotId("0-0");
    updateLayouts((currentLayouts) => [...currentLayouts, layout], layout.id);
    track("binder_created");
  }

  function duplicateLayout() {
    if (!activeLayout) {
      return;
    }

    const duplicate = createDuplicatedLayout(activeLayout);

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

    updateActiveLayout((layout) => renameLayoutRecord(layout, renameDraft.trim()));
    setRenameDraft("");
  }

  function addPage() {
    updateActiveLayout((layout) => addPageToLayout(layout));
    setActivePageIndex(activeLayout?.pages.length ?? 0);
    track("page_added", { method: "new" });
  }

  function duplicatePage() {
    if (!activeLayout || !activePage) {
      return;
    }

    updateActiveLayout((layout) => duplicatePageInLayout(layout, activePageIndex));
    setActivePageIndex(activePageIndex + 1);
    track("page_added", { method: "duplicate" });
  }

  function clearSelectedSlot() {
    if (!activePage || !selectedSlotId) {
      return;
    }

    updateActivePage((page) => clearSlotPlacement(page, selectedSlotId));
  }

  function clearSlotById(slotId: string) {
    if (!activePage || !slotId) {
      return;
    }

    updateActivePage((page) => clearSlotPlacement(page, slotId));
  }

  function clearActivePage() {
    if (!activePage) {
      return;
    }

    updateActivePage((page) => clearPagePlacementsAndArt(page));
    setSelectedRegionId(null);
    setSelectedSlotId("0-0");
  }

  function setTemplate(templateId: BinderTemplateId) {
    const template = getTemplate(templateId);
    if (!activePage) {
      return;
    }

    const validation = validatePageForTemplate(activePage, activeTemplate, template);
    if (!validation.canApply) {
      onError?.(
        validation.reason
          ? `Unable to use ${template.name}: ${validation.reason}`
          : `Unable to use ${template.name}.`,
      );
      return;
    }

    updateActiveLayout((layout) =>
      applyTemplateToLayout(layout, activePageIndex, activeTemplate, templateId),
    );
    setSelectedRegionId(null);
    setSelectedSlotId("0-0");
  }

  function placeCardInSlot(targetSlotId: string, cardId: string) {
    if (!activePage || occupiedByArt.has(targetSlotId)) {
      return;
    }

    updateActivePage((page) => placeCardInPageSlot(page, targetSlotId, cardId));
  }

  function updateTheme<K extends keyof BinderLayout["theme"]>(
    key: K,
    value: BinderLayout["theme"][K],
  ) {
    updateActiveLayout((layout) => updateLayoutTheme(layout, key, value));
  }

  function exportLayouts() {
    const blob = new Blob(
      [buildLayoutExport(layouts, activeLayoutId, placementCardSnapshots)],
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
    const parsed = parseImportedLayouts(text) as PersistedState;
    setLayouts(parsed.layouts);
    setActiveLayoutId(parsed.activeLayoutId ?? parsed.layouts[0].id);
    setPersistedCardSnapshots(parsed.cardSnapshots ?? []);
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

    updateActivePage((page) => applyCardDropToPage(page, targetSlotId, cardId, sourceSlotId));
  }

  function placeCardsInNextEmptySlots(cardIds: string[]) {
    if (!activePage || !cardIds.length) {
      return;
    }

    const targetSlotIds = availableSlotIds.slice(0, cardIds.length);
    if (!targetSlotIds.length) {
      return;
    }

    updateActivePage((page) => placeCardsInSlots(page, targetSlotIds, cardIds));
  }

  function upsertCardSnapshot(card: CardRecord) {
    setPersistedCardSnapshots((current) => upsertCardSnapshotRecord(current, card));
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
    resolvedCardPool,
    activePagePlacedCardIds,
    activePagePlacedCardCount,
    availableSlotIds,
    remainingPageCapacity,
    templateValidationById,
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
    clearSlotById,
    clearActivePage,
    placeCardInSlot,
    setTemplate,
    updateTheme,
    exportLayouts,
    importLayouts,
    handleCardDrop,
    placeCardsInNextEmptySlots,
    upsertCardSnapshot,
  };
}

export type LayoutManager = ReturnType<typeof useLayoutManager>;
