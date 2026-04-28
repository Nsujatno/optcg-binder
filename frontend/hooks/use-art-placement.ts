"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import type { LayoutManager } from "@/hooks/use-layout-manager";
import { canPlaceArtRegion } from "@/lib/art-region-placement";
import { CropDraft, createId, fileToAsset } from "@/lib/planner";
import type { ArtRegion } from "@/lib/types";

export function useArtPlacement(layout: LayoutManager, setErrorMessage: (value: string) => void) {
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const asset = await fileToAsset(file);
      setCropDraft({
        asset,
        rowSpan: 1,
        colSpan: 1,
        cropX: 0,
        cropY: 0,
        zoom: 1,
        fitMode: "fill",
      });
    } catch {
      setErrorMessage("Image upload failed. Try another image.");
    } finally {
      event.target.value = "";
    }
  }

  function confirmCropPlacement() {
    if (!cropDraft || !layout.activePage) {
      return;
    }

    if (
      !canPlaceArtRegion({
        page: layout.activePage,
        template: layout.activeTemplate,
        originRow: layout.currentSlotPosition.row,
        originCol: layout.currentSlotPosition.col,
        rowSpan: cropDraft.rowSpan,
        colSpan: cropDraft.colSpan,
        ignoreRegionId: cropDraft.editingRegionId,
      })
    ) {
      setErrorMessage("That image span overlaps cards, art, or exceeds the page.");
      return;
    }

    const nextRegion: ArtRegion = {
      id: cropDraft.editingRegionId ?? createId("art"),
      assetId: cropDraft.asset.id,
      originRow: layout.currentSlotPosition.row,
      originCol: layout.currentSlotPosition.col,
      rowSpan: cropDraft.rowSpan,
      colSpan: cropDraft.colSpan,
      cropX: cropDraft.cropX,
      cropY: cropDraft.cropY,
      zoom: cropDraft.zoom,
      fitMode: cropDraft.fitMode,
      locked: true,
    };

    layout.updateActiveLayout((activeLayout) => {
      const hasAsset = activeLayout.assets.some((asset) => asset.id === cropDraft.asset.id);
      return {
        ...activeLayout,
        assets: hasAsset ? activeLayout.assets : [...activeLayout.assets, cropDraft.asset],
        pages: activeLayout.pages.map((page, index) => {
          if (index !== layout.activePageIndex) {
            return page;
          }

          const artRegions = cropDraft.editingRegionId
            ? page.artRegions.map((region) =>
                region.id === cropDraft.editingRegionId ? nextRegion : region,
              )
            : [...page.artRegions, nextRegion];

          return {
            ...page,
            artRegions,
          };
        }),
      };
    });

    layout.setSelectedRegionId(nextRegion.id);
    setCropDraft(null);
    setErrorMessage("");
  }

  function handleArtRegionDrop(event: DragEvent<HTMLButtonElement>, targetSlotId: string) {
    event.preventDefault();

    if (!layout.activePage) {
      return;
    }

    const regionId = event.dataTransfer.getData("application/x-art-region-id");
    if (!regionId) {
      return;
    }

    const region = layout.activePage.artRegions.find((item) => item.id === regionId);
    if (!region) {
      return;
    }

    const [row = "0", col = "0"] = targetSlotId.split("-");
    const nextOriginRow = Number.parseInt(row, 10);
    const nextOriginCol = Number.parseInt(col, 10);

    if (
      !canPlaceArtRegion({
        page: layout.activePage,
        template: layout.activeTemplate,
        originRow: nextOriginRow,
        originCol: nextOriginCol,
        rowSpan: region.rowSpan,
        colSpan: region.colSpan,
        ignoreRegionId: region.id,
      })
    ) {
      setErrorMessage("That image span overlaps cards, art, or exceeds the page.");
      return;
    }

    layout.updateActivePage((page) => ({
      ...page,
      artRegions: page.artRegions.map((item) =>
        item.id === region.id
          ? {
              ...item,
              originRow: nextOriginRow,
              originCol: nextOriginCol,
            }
          : item,
      ),
    }));
    layout.setSelectedRegionId(region.id);
    layout.setSelectedSlotId(targetSlotId);
    setErrorMessage("");
  }

  function editSelectedRegion() {
    if (!layout.selectedRegion || !layout.activeLayout) {
      return;
    }

    const asset = layout.activeLayout.assets.find(
      (item) => item.id === layout.selectedRegion?.assetId,
    );
    if (!asset) {
      return;
    }

    setCropDraft({
      asset,
      rowSpan: layout.selectedRegion.rowSpan,
      colSpan: layout.selectedRegion.colSpan,
      cropX: layout.selectedRegion.cropX,
      cropY: layout.selectedRegion.cropY,
      zoom: layout.selectedRegion.zoom,
      fitMode: layout.selectedRegion.fitMode,
      editingRegionId: layout.selectedRegion.id,
    });
  }

  function toggleRegionLock() {
    if (!layout.selectedRegion) {
      return;
    }

    layout.updateActivePage((page) => ({
      ...page,
      artRegions: page.artRegions.map((region) =>
        region.id === layout.selectedRegion?.id
          ? { ...region, locked: !region.locked }
          : region,
      ),
    }));
  }

  function deleteSelectedRegion() {
    if (!layout.selectedRegion) {
      return;
    }

    layout.updateActivePage((page) => ({
      ...page,
      artRegions: page.artRegions.filter((region) => region.id !== layout.selectedRegion?.id),
    }));
    layout.setSelectedRegionId(null);
  }

  function deleteRegionById(regionId: string) {
    layout.updateActivePage((page) => ({
      ...page,
      artRegions: page.artRegions.filter((region) => region.id !== regionId),
    }));

    if (layout.selectedRegionId === regionId) {
      layout.setSelectedRegionId(null);
    }
  }

  return {
    cropDraft,
    setCropDraft,
    uploadInputRef,
    handleUploadImage,
    confirmCropPlacement,
    handleArtRegionDrop,
    editSelectedRegion,
    toggleRegionLock,
    deleteSelectedRegion,
    deleteRegionById,
  };
}

export type ArtPlacementManager = ReturnType<typeof useArtPlacement>;
