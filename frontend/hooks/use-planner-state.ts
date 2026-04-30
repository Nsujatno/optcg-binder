"use client";

import { useCatalogData } from "@/hooks/use-catalog-data";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { useArtPlacement } from "@/hooks/use-art-placement";
import { useSlotRecommendations } from "@/hooks/use-slot-recommendations";

export function usePlannerState() {
  const catalog = useCatalogData();
  const layout = useLayoutManager(catalog.allLoadedCards);
  const art = useArtPlacement(layout, catalog.setErrorMessage);
  const recommendations = useSlotRecommendations({
    activePage: layout.activePage,
    activeTemplate: layout.activeTemplate,
    resolvedCardPool: layout.resolvedCardPool,
    selectedSlotId: layout.selectedSlotId,
    selectedCard: layout.selectedCard,
    setErrorMessage: catalog.setErrorMessage,
    placeCardInSlot: layout.placeCardInSlot,
  });

  async function importLayouts(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      await layout.importLayouts(event);
      catalog.setErrorMessage("");
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
