"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import type { LayoutManager } from "@/hooks/use-layout-manager";
import { canPlaceArtRegion } from "@/lib/art-region-placement";
import { DEFAULT_ART_TRANSFORM } from "@/lib/art-transform";
import { CropDraft, createId, fileToAsset } from "@/lib/planner";
import type { ArtRegion, UploadedAsset } from "@/lib/types";

function toCropDraft(region: ArtRegion, asset: UploadedAsset): CropDraft {
  return {
    asset,
    rowSpan: region.rowSpan,
    colSpan: region.colSpan,
    crop: region.crop,
    zoom: region.zoom,
    rotation: region.rotation,
    flipH: region.flipH,
    fitMode: region.fitMode,
    editingRegionId: region.id,
  };
}

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
        ...DEFAULT_ART_TRANSFORM,
        asset,
        rowSpan: 1,
        colSpan: 1,
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
      crop: cropDraft.crop,
      zoom: cropDraft.zoom,
      rotation: cropDraft.rotation,
      flipH: cropDraft.flipH,
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

    setCropDraft(toCropDraft(layout.selectedRegion, asset));
  }

  function editRegionById(regionId: string) {
    layout.setSelectedRegionId(regionId);
    const region = layout.activePage?.artRegions.find((item) => item.id === regionId);
    if (!region) {
      return;
    }

    const asset = layout.activeLayout?.assets.find((item) => item.id === region.assetId);
    if (!asset) {
      return;
    }

    setCropDraft(toCropDraft(region, asset));
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
    editRegionById,
    toggleRegionLock,
    deleteSelectedRegion,
    deleteRegionById,
  };
}

export type ArtPlacementManager = ReturnType<typeof useArtPlacement>;
