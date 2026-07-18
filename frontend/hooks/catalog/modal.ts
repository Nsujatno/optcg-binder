"use client";

import { useMemo, useState } from "react";
import type { CardRecord, SetRecord } from "@/lib/types";

type UseCatalogModalArgs = {
  sets: SetRecord[];
  cardsBySetId: Record<string, CardRecord[]>;
  loadingBySetId: Record<string, boolean>;
  ensureSetCardsLoaded: (setId: string) => Promise<void>;
  ensureNameSearchLoaded: (sourceId: string, cardName: string) => Promise<void>;
};

export function useCatalogModal({
  sets,
  cardsBySetId,
  loadingBySetId,
  ensureSetCardsLoaded,
  ensureNameSearchLoaded,
}: UseCatalogModalArgs) {
  const [selectedSetId, setSelectedSetId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [catalogMode, setCatalogMode] = useState<"bulk" | "single-slot">("bulk");
  const [singleSlotId, setSingleSlotId] = useState<string | null>(null);

  const selectedSet = useMemo(() => sets.find((set) => set.id === selectedSetId) ?? null, [
    selectedSetId,
    sets,
  ]);
  const cards = selectedSetId ? cardsBySetId[selectedSetId] ?? [] : [];
  const cardLoading = selectedSetId ? loadingBySetId[selectedSetId] ?? false : false;

  async function selectModalSet(setId: string) {
    setSelectedSetId(setId);
    await ensureSetCardsLoaded(setId);
  }

  async function submitModalSearch(cardName: string) {
    const trimmed = cardName.trim();
    if (!trimmed) {
      return;
    }

    const syntheticSetId = `name-search:${trimmed.toLowerCase()}`;
    setSelectedSetId(syntheticSetId);
    await ensureNameSearchLoaded(syntheticSetId, trimmed);
  }

  function resetModalContext(mode: "bulk" | "single-slot", slotId: string | null) {
    setCatalogMode(mode);
    setSingleSlotId(slotId);
    setSelectedSetId("");
    setModalSearch("");
  }

  function openBulkCatalogModal() {
    resetModalContext("bulk", null);
    setModalOpen(true);
  }

  function openSingleSlotCatalogModal(slotId: string) {
    resetModalContext("single-slot", slotId);
    setModalOpen(true);
  }

  function closeSetModal() {
    setModalOpen(false);
    resetModalContext("bulk", null);
  }

  return {
    selectedSetId,
    selectedSet,
    modalOpen,
    modalSearch,
    filteredCards: cards,
    cardLoading,
    catalogMode,
    singleSlotId,
    openBulkCatalogModal,
    openSingleSlotCatalogModal,
    selectModalSet,
    submitModalSearch,
    closeSetModal,
    setModalSearch,
  };
}
