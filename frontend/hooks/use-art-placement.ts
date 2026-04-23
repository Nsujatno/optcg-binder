"use client";

import { ChangeEvent, useRef, useState } from "react";
import type { LayoutManager } from "@/hooks/use-layout-manager";
import { CropDraft, createId, fileToAsset, regionContainsSlot, slotKey } from "@/lib/planner";
import type { ArtRegion } from "@/lib/types";

export function useArtPlacement(layout: LayoutManager, setErrorMessage: (value: string) => void) {
  const [cropDraft, setCropDraft] = useState<CropDraft | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  function canPlaceArtRegion(
    originRow: number,
    originCol: number,
    rowSpan: number,
    colSpan: number,
    ignoreRegionId?: string,
  ) {
    const page = layout.activePage;
    if (!page) {
      return false;
    }

    if (
      originRow + rowSpan > layout.activeTemplate.rows ||
      originCol + colSpan > layout.activeTemplate.cols
    ) {
      return false;
    }

    for (let row = originRow; row < originRow + rowSpan; row += 1) {
      for (let col = originCol; col < originCol + colSpan; col += 1) {
        const key = slotKey(row, col);
        if (page.placements[key]) {
          return false;
        }

        const overlappingRegion = page.artRegions.find(
          (region) =>
            region.id !== ignoreRegionId && regionContainsSlot(region, row, col),
        );

        if (overlappingRegion) {
          return false;
        }
      }
    }

    return true;
  }

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
      !canPlaceArtRegion(
        layout.currentSlotPosition.row,
        layout.currentSlotPosition.col,
        cropDraft.rowSpan,
        cropDraft.colSpan,
        cropDraft.editingRegionId,
      )
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

  return {
    cropDraft,
    setCropDraft,
    uploadInputRef,
    handleUploadImage,
    confirmCropPlacement,
    editSelectedRegion,
    toggleRegionLock,
    deleteSelectedRegion,
  };
}

export type ArtPlacementManager = ReturnType<typeof useArtPlacement>;
