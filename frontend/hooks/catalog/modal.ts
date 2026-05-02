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
  const [modalSelectedSetOverride, setModalSelectedSetOverride] = useState<SetRecord | null>(null);

  const selectedSet = useMemo(
    () => modalSelectedSetOverride ?? sets.find((set) => set.id === selectedSetId) ?? null,
    [modalSelectedSetOverride, selectedSetId, sets],
  );
  const cards = selectedSetId ? cardsBySetId[selectedSetId] ?? [] : [];
  const cardLoading = selectedSetId ? loadingBySetId[selectedSetId] ?? false : false;
  const filteredCards = useMemo(() => {
    const query = modalSearch.trim().toLowerCase();
    if (!query) {
      return cards;
    }

    return cards.filter((card) =>
      [card.name, card.cardSetId, card.color, card.type, card.rarity, card.text]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [cards, modalSearch]);

  async function openSetModal(setId: string) {
    setSelectedSetId(setId);
    setModalSelectedSetOverride(null);
    setModalSearch("");
    setModalOpen(true);
    await ensureSetCardsLoaded(setId);
  }

  async function openCardNameModal(cardName: string) {
    const trimmed = cardName.trim();
    if (!trimmed) {
      return;
    }

    const syntheticSetId = `name-search:${trimmed.toLowerCase()}`;
    setSelectedSetId(syntheticSetId);
    setModalSelectedSetOverride({
      id: syntheticSetId,
      code: "Search",
      name: `Results for "${trimmed}"`,
      cardCount: 0,
    });
    setModalSearch("");
    setModalOpen(true);
    await ensureNameSearchLoaded(syntheticSetId, trimmed);
  }

  function closeSetModal() {
    setModalOpen(false);
    setModalSearch("");
    setModalSelectedSetOverride(null);
  }

  return {
    selectedSetId,
    selectedSet,
    modalOpen,
    modalSearch,
    filteredCards,
    cardLoading,
    openSetModal,
    openCardNameModal,
    closeSetModal,
    setModalSearch,
  };
}
