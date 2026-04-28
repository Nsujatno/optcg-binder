"use client";

import { CatalogSidebar } from "@/components/planner/catalog-sidebar";
import { CropModal } from "@/components/planner/crop-modal";
import { InspectorSidebar } from "@/components/planner/inspector-sidebar";
import { LayoutStyleSidebar } from "@/components/planner/layout-style-sidebar";
import { PlannerCanvas } from "@/components/planner/planner-canvas";
import { PlannerHeader } from "@/components/planner/planner-header";
import { SetCardsModal } from "@/components/planner/set-cards-modal";
import { usePlannerState } from "@/hooks/use-planner-state";

export function PlannerApp() {
  const planner = usePlannerState();

  return (
    <div
      className="min-h-screen text-white"
      style={{ backgroundColor: planner.activeLayout?.theme.binderBackground ?? "#0f172a" }}
    >
      <PlannerHeader
        exportLayouts={planner.exportLayouts}
        importLayouts={planner.importLayouts}
        importInputRef={planner.importInputRef}
      />

      <div className="mx-auto flex max-w-[1700px] flex-col gap-4 px-4 py-4 lg:px-6">
        {planner.errorMessage ? (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {planner.errorMessage}
          </div>
        ) : null}

        <div className="grid flex-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <CatalogSidebar
            sets={planner.sets}
            selectedSetId={planner.selectedSetId}
            setLoading={planner.setLoading}
            openSetModal={planner.openSetModal}
          />

          <PlannerCanvas
            activeLayout={planner.activeLayout}
            activeTemplate={planner.activeTemplate}
            activePage={planner.activePage}
            activePageIndex={planner.activePageIndex}
            activeLayoutAssets={planner.activeLayoutAssets}
            selectedRegionId={planner.selectedRegionId}
            setSelectedRegionId={planner.setSelectedRegionId}
            setSelectedSlotId={planner.setSelectedSlotId}
            setActivePageIndex={planner.setActivePageIndex}
            cards={planner.allLoadedCards}
            occupiedByArt={planner.occupiedByArt}
            selectedSlotId={planner.selectedSlotId}
            handleCardDrop={planner.handleCardDrop}
          />

          <div className="flex flex-col gap-4">
            <LayoutStyleSidebar
              layouts={planner.layouts}
              activeLayoutId={planner.activeLayoutId}
              setActiveLayoutId={planner.setActiveLayoutId}
              activeLayout={planner.activeLayout}
              activeTemplate={planner.activeTemplate}
              activePageIndex={planner.activePageIndex}
              setActivePageIndex={planner.setActivePageIndex}
              renameDraft={planner.renameDraft}
              setRenameDraft={planner.setRenameDraft}
              renameLayout={planner.renameLayout}
              deleteLayout={planner.deleteLayout}
              createNewLayout={planner.createNewLayout}
              duplicateLayout={planner.duplicateLayout}
              setTemplate={planner.setTemplate}
              addPage={planner.addPage}
              duplicatePage={planner.duplicatePage}
              setSelectedRegionId={planner.setSelectedRegionId}
              templateValidationById={planner.templateValidationById}
              templateErrorMessage={planner.templateErrorMessage}
              updateTheme={planner.updateTheme}
            />

            <InspectorSidebar
              currentSlotPosition={planner.currentSlotPosition}
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
      </div>

      <CropModal
        cropDraft={planner.cropDraft}
        setCropDraft={planner.setCropDraft}
        activeTemplate={planner.activeTemplate}
        currentSlotPosition={planner.currentSlotPosition}
        confirmCropPlacement={planner.confirmCropPlacement}
      />

      <SetCardsModal
        modalOpen={planner.modalOpen}
        closeSetModal={planner.closeSetModal}
        selectedSet={planner.selectedSet}
        cardLoading={planner.cardLoading}
        modalError={planner.modalError}
        filteredCards={planner.filteredCards}
        modalSearch={planner.modalSearch}
        setModalSearch={planner.setModalSearch}
        remainingPageCapacity={planner.remainingPageCapacity}
        activePagePlacedCardIds={planner.activePagePlacedCardIds}
        placeCardsInNextEmptySlots={planner.placeCardsInNextEmptySlots}
      />
    </div>
  );
}
