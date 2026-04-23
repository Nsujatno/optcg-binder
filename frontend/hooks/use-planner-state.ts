"use client";

import { useCatalogData } from "@/hooks/use-catalog-data";
import { useLayoutManager } from "@/hooks/use-layout-manager";
import { useArtPlacement } from "@/hooks/use-art-placement";

export function usePlannerState() {
  const catalog = useCatalogData();
  const layout = useLayoutManager(catalog.cards);
  const art = useArtPlacement(layout, catalog.setErrorMessage);

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
    importLayouts,
  };
}

export type PlannerState = ReturnType<typeof usePlannerState>;
