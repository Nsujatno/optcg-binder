"use client";

import { CatalogSidebar } from "@/components/planner/catalog-sidebar";
import { CropModal } from "@/components/planner/crop-modal";
import { InspectorSidebar } from "@/components/planner/inspector-sidebar";
import { PlannerCanvas } from "@/components/planner/planner-canvas";
import { PlannerHeader } from "@/components/planner/planner-header";
import { usePlannerState } from "@/hooks/use-planner-state";

export function PlannerApp() {
  const planner = usePlannerState();

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: planner.activeLayout?.theme.binderBackground ?? "#0f172a" }}
    >
      <div className="mx-auto flex min-h-screen max-w-[1700px] flex-col gap-4 px-4 py-4 lg:px-6">
        <PlannerHeader
          createNewLayout={planner.createNewLayout}
          duplicateLayout={planner.duplicateLayout}
          exportLayouts={planner.exportLayouts}
          importLayouts={planner.importLayouts}
          importInputRef={planner.importInputRef}
        />

        {planner.errorMessage ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {planner.errorMessage}
          </div>
        ) : null}

        <div className="grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <CatalogSidebar
            setLoading={planner.setLoading}
            sets={planner.sets}
            selectedSetId={planner.selectedSetId}
            setSelectedSetId={planner.setSelectedSetId}
            search={planner.search}
            setSearch={planner.setSearch}
            cardLoading={planner.cardLoading}
            cards={planner.cards}
          />

          <PlannerCanvas
            layouts={planner.layouts}
            activeLayoutId={planner.activeLayoutId}
            setActiveLayoutId={planner.setActiveLayoutId}
            activeLayout={planner.activeLayout}
            activeTemplate={planner.activeTemplate}
            activePageIndex={planner.activePageIndex}
            setActivePageIndex={planner.setActivePageIndex}
            activePage={planner.activePage}
            renameDraft={planner.renameDraft}
            setRenameDraft={planner.setRenameDraft}
            renameLayout={planner.renameLayout}
            deleteLayout={planner.deleteLayout}
            setTemplate={planner.setTemplate}
            addPage={planner.addPage}
            duplicatePage={planner.duplicatePage}
            activeLayoutAssets={planner.activeLayoutAssets}
            selectedRegionId={planner.selectedRegionId}
            setSelectedRegionId={planner.setSelectedRegionId}
            setSelectedSlotId={planner.setSelectedSlotId}
            cards={planner.cards}
            occupiedByArt={planner.occupiedByArt}
            selectedSlotId={planner.selectedSlotId}
            handleCardDrop={planner.handleCardDrop}
          />

          <InspectorSidebar
            currentSlotPosition={planner.currentSlotPosition}
            updateTheme={planner.updateTheme}
            activeLayout={planner.activeLayout}
            selectedCard={planner.selectedCard}
            clearSelectedSlot={planner.clearSelectedSlot}
            uploadInputRef={planner.uploadInputRef}
            handleUploadImage={planner.handleUploadImage}
            selectedRegion={planner.selectedRegion}
            editSelectedRegion={planner.editSelectedRegion}
            toggleRegionLock={planner.toggleRegionLock}
            deleteSelectedRegion={planner.deleteSelectedRegion}
          />
        </div>
      </div>

      <CropModal
        cropDraft={planner.cropDraft}
        setCropDraft={planner.setCropDraft}
        activeTemplate={planner.activeTemplate}
        currentSlotPosition={planner.currentSlotPosition}
        confirmCropPlacement={planner.confirmCropPlacement}
      />
    </div>
  );
}
