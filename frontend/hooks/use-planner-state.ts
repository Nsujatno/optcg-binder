"use client";

import { useCatalogData } from "@/hooks/catalog";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { useArtPlacement } from "@/hooks/use-art-placement";
import { useSlotRecommendations } from "@/hooks/use-slot-recommendations";
import type { ToastVariant } from "@/hooks/use-toast";

export function usePlannerState(onError?: (message: string, variant?: ToastVariant) => void) {
  const catalog = useCatalogData(onError);
  const layout = useLayoutManager(catalog.allLoadedCards, onError);
  const art = useArtPlacement(layout, catalog.setErrorMessage);
  const recommendations = useSlotRecommendations({
    activePage: layout.activePage,
    activeTemplate: layout.activeTemplate,
    resolvedCardPool: layout.resolvedCardPool,
    selectedSlotId: layout.selectedSlotId,
    selectedCard: layout.selectedCard,
    setErrorMessage: catalog.setErrorMessage,
    placeCardInSlot: layout.placeCardInSlot,
    upsertCardSnapshot: layout.upsertCardSnapshot,
  });

  async function importLayouts(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      await layout.importLayouts(event);
    } catch {
      catalog.setErrorMessage("That JSON file could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  return {
    ...catalog,
    ...layout,
    ...art,
    ...recommendations,
    importLayouts,
  };
}

export type PlannerState = ReturnType<typeof usePlannerState>;
