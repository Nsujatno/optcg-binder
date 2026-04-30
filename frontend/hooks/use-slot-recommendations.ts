"use client";

import { useMemo, useState } from "react";
import { getSlotRecommendationsClient } from "@/lib/api-client";
import type {
  BinderPage,
  BinderTemplate,
  CardRecord,
  RecommendationPlacementRecord,
  SlotRecommendationRecord,
} from "@/lib/types";
import { matchesCardPlacementId } from "@/lib/planner";

type UseSlotRecommendationsArgs = {
  activePage: BinderPage | null;
  activeTemplate: BinderTemplate;
  resolvedCardPool: CardRecord[];
  selectedSlotId: string | null;
  selectedCard: CardRecord | null;
  setErrorMessage: (message: string) => void;
  placeCardInSlot: (slotId: string, cardId: string) => void;
};

function buildPlacementRecords(
  activePage: BinderPage | null,
  resolvedCardPool: CardRecord[],
): RecommendationPlacementRecord[] {
  if (!activePage) {
    return [];
  }

  return Object.entries(activePage.placements)
    .map(([slotId, placementId]) => {
      const card = resolvedCardPool.find((entry) => matchesCardPlacementId(entry, placementId));
      if (!card) {
        return null;
      }

      return {
        slotId,
        id: card.id,
        setId: card.setId,
        setName: card.setName,
        cardSetId: card.cardSetId,
        name: card.name,
        imageUrl: card.imageUrl,
        marketPrice: card.marketPrice,
        rarity: card.rarity,
        color: card.color,
        type: card.type,
        subTypes: card.subTypes,
      };
    })
    .filter((item): item is RecommendationPlacementRecord => item !== null);
}

export function useSlotRecommendations({
  activePage,
  activeTemplate,
  resolvedCardPool,
  selectedSlotId,
  selectedCard,
  setErrorMessage,
  placeCardInSlot,
}: UseSlotRecommendationsArgs) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SlotRecommendationRecord[]>([]);
  const [emptyState, setEmptyState] = useState(false);
  const [requestedSlotId, setRequestedSlotId] = useState<string | null>(null);

  const placementRecords = useMemo(
    () => buildPlacementRecords(activePage, resolvedCardPool),
    [activePage, resolvedCardPool],
  );
  const featureEligible = Boolean(
    selectedSlotId &&
      !selectedCard &&
      activeTemplate.rows >= 2 &&
      activeTemplate.cols >= 2 &&
      placementRecords.length >= 1,
  );
  const panelVisible = Boolean(
    panelOpen &&
      featureEligible &&
      selectedSlotId &&
      requestedSlotId === selectedSlotId,
  );

  async function openRecommendations() {
    if (!selectedSlotId || !featureEligible) {
      return;
    }

    setRequestedSlotId(selectedSlotId);
    setLoading(true);
    setPanelOpen(true);
    setRecommendations([]);
    setEmptyState(false);

    try {
      const payload = await getSlotRecommendationsClient({
        selectedSlotId,
        templateId: activeTemplate.id,
        placements: placementRecords,
      });
      setRecommendations(payload.recommendations);
      setEmptyState(payload.recommendations.length === 0);
      setErrorMessage("");
    } catch {
      setRequestedSlotId(null);
      setPanelOpen(false);
      setRecommendations([]);
      setEmptyState(false);
      setErrorMessage("Could not load matches right now.");
    } finally {
      setLoading(false);
    }
  }

  function applyRecommendation(cardId: string) {
    if (!selectedSlotId) {
      return;
    }

    placeCardInSlot(selectedSlotId, cardId);
    setRequestedSlotId(null);
    setLoading(false);
    setPanelOpen(false);
    setRecommendations([]);
    setEmptyState(false);
  }

  return {
    recommendationPanelOpen: panelVisible,
    recommendationLoading: loading,
    recommendationEmptyState: emptyState,
    recommendations,
    recommendationFeatureEligible: featureEligible,
    openRecommendations,
    closeRecommendations: () => {
      setRequestedSlotId(null);
      setLoading(false);
      setPanelOpen(false);
      setRecommendations([]);
      setEmptyState(false);
    },
    applyRecommendation,
  };
}
