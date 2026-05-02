import type {
    ArtRegion,
    BinderLayout,
    BinderPage,
    BinderTemplate,
    BinderTemplateId,
    CardRecord,
} from "@/lib/types";
import { BINDER_TEMPLATES } from "@/lib/types";
import {
    getPlacementIdsForLayouts,
    getSlotsCovered,
    matchesCardPlacementId,
    slotKey,
    validatePageForTemplate,
} from "@/lib/planner";

export function resolveCardPool(cards: CardRecord[], persistedCardSnapshots: CardRecord[]) {
    const cardsById = new Map(persistedCardSnapshots.map((card) => [card.id, card]));
    cards.forEach((card) => {
        cardsById.set(card.id, card);
    });
    return Array.from(cardsById.values());
}

export function getPlacementCardSnapshots(layouts: BinderLayout[], resolvedCardPool: CardRecord[]) {
    const placementIdsForLayouts = getPlacementIdsForLayouts(layouts);
    return resolvedCardPool.filter((card) =>
        placementIdsForLayouts.some((placementId) => matchesCardPlacementId(card, placementId)),
    );
}

export function getActiveLayout(layouts: BinderLayout[], activeLayoutId: string) {
    return layouts.find((layout) => layout.id === activeLayoutId) ?? null;
}

export function getSelectedCard(
    activePage: BinderPage | null,
    resolvedCardPool: CardRecord[],
    selectedSlotId: string | null,
) {
    return (
        resolvedCardPool.find((card) =>
            matchesCardPlacementId(
                card,
                selectedSlotId ? activePage?.placements[selectedSlotId] : undefined,
            ),
        ) ?? null
    );
}

export function getSelectedRegion(activePage: BinderPage | null, selectedRegionId: string | null) {
    return activePage?.artRegions.find((region) => region.id === selectedRegionId) ?? null;
}

export function getOccupiedByArt(activePage: BinderPage | null) {
    const slots = new Map<string, ArtRegion>();
    activePage?.artRegions.forEach((region) => {
        getSlotsCovered(region).forEach((coveredSlot) => slots.set(coveredSlot, region));
    });
    return slots;
}

export function getCurrentSlotPosition(selectedSlotId: string | null) {
    if (!selectedSlotId) {
        return {
            row: 0,
            col: 0,
        };
    }

    const [row = "0", col = "0"] = selectedSlotId.split("-");
    return {
        row: Number.parseInt(row, 10),
        col: Number.parseInt(col, 10),
    };
}

export function getActivePagePlacedCardIds(activePage: BinderPage | null) {
    return Object.values(activePage?.placements ?? {});
}

export function getAvailableSlotIds(
    activePage: BinderPage | null,
    activeTemplate: BinderTemplate,
    occupiedByArt: Map<string, ArtRegion>,
) {
    if (!activePage) {
        return [];
    }

    const slots: string[] = [];
    for (let row = 0; row < activeTemplate.rows; row += 1) {
        for (let col = 0; col < activeTemplate.cols; col += 1) {
            const currentSlotId = slotKey(row, col);
            if (activePage.placements[currentSlotId] || occupiedByArt.has(currentSlotId)) {
                continue;
            }
            slots.push(currentSlotId);
        }
    }
    return slots;
}

export function getTemplateValidationById(
    activePage: BinderPage | null,
    activeTemplate: BinderTemplate,
) {
    const entries = new Map<
        BinderTemplateId,
        ReturnType<typeof validatePageForTemplate>
    >();
    const pageToValidate = activePage ?? {
        id: "",
        placements: {},
        artRegions: [],
    };

    BINDER_TEMPLATES.forEach((template) => {
        entries.set(
            template.id,
            validatePageForTemplate(pageToValidate, activeTemplate, template),
        );
    });

    return entries;
}
