import type { BinderLayout, BinderPage, BinderTemplate, BinderTemplateId, CardRecord } from "@/lib/types";
import {
    createId,
    createPage,
    getTemplate,
    type PersistedState,
    sanitizePageForTemplate,
} from "@/lib/planner";

export function markLayoutsUpdated(layouts: BinderLayout[]) {
    return layouts.map((layout) => ({
        ...layout,
        updatedAt: new Date().toISOString(),
    }));
}

export function updateLayoutById(
    layouts: BinderLayout[],
    layoutId: string,
    updater: (layout: BinderLayout) => BinderLayout,
) {
    return layouts.map((layout) => (layout.id === layoutId ? updater(layout) : layout));
}

export function updatePageByIndex(
    layout: BinderLayout,
    activePageIndex: number,
    updater: (page: BinderPage) => BinderPage,
) {
    return {
        ...layout,
        pages: layout.pages.map((page, index) =>
            index === activePageIndex ? updater(page) : page,
        ),
    };
}

export function createDuplicatedLayout(layout: BinderLayout): BinderLayout {
    return {
        ...structuredClone(layout),
        id: createId("layout"),
        name: `${layout.name} Copy`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export function renameLayout(layout: BinderLayout, name: string) {
    return {
        ...layout,
        name,
    };
}

export function addPageToLayout(layout: BinderLayout) {
    return {
        ...layout,
        pages: [...layout.pages, createPage()],
    };
}

export function duplicatePageInLayout(layout: BinderLayout, activePageIndex: number) {
    const sourcePage = layout.pages[activePageIndex];
    if (!sourcePage) {
        return layout;
    }

    const duplicate = structuredClone(sourcePage);
    duplicate.id = createId("page");

    return {
        ...layout,
        pages: [
            ...layout.pages.slice(0, activePageIndex + 1),
            duplicate,
            ...layout.pages.slice(activePageIndex + 1),
        ],
    };
}

export function clearSlotPlacement(page: BinderPage, selectedSlotId: string) {
    const nextPlacements = { ...page.placements };
    delete nextPlacements[selectedSlotId];

    return {
        ...page,
        placements: nextPlacements,
    };
}

export function applyTemplateToLayout(
    layout: BinderLayout,
    activePageIndex: number,
    sourceTemplate: BinderTemplate,
    templateId: BinderTemplateId,
) {
    const targetTemplate = getTemplate(templateId);

    return {
        ...layout,
        templateId,
        pages: layout.pages.map((page, index) =>
            index === activePageIndex
                ? sanitizePageForTemplate(page, sourceTemplate, targetTemplate)
                : page,
        ),
    };
}

export function placeCardInPageSlot(page: BinderPage, targetSlotId: string, cardId: string) {
    return {
        ...page,
        placements: {
            ...page.placements,
            [targetSlotId]: cardId,
        },
    };
}

export function updateLayoutTheme<K extends keyof BinderLayout["theme"]>(
    layout: BinderLayout,
    key: K,
    value: BinderLayout["theme"][K],
) {
    return {
        ...layout,
        theme: {
            ...layout.theme,
            [key]: value,
        },
    };
}

export function buildLayoutExport(layouts: BinderLayout[], activeLayoutId: string, cardSnapshots: CardRecord[]) {
    return JSON.stringify(
        { layouts, activeLayoutId, cardSnapshots },
        null,
        2,
    );
}

export function parseImportedLayouts(text: string): PersistedState {
    const parsed = JSON.parse(text) as PersistedState;
    if (!parsed.layouts?.length) {
        throw new Error("Invalid layout file");
    }

    return parsed;
}

export function applyCardDropToPage(
    page: BinderPage,
    targetSlotId: string,
    cardId: string,
    sourceSlotId: string,
) {
    const nextPlacements = { ...page.placements };
    const targetCardId = nextPlacements[targetSlotId];

    nextPlacements[targetSlotId] = cardId;

    if (sourceSlotId) {
        if (targetCardId) {
            nextPlacements[sourceSlotId] = targetCardId;
        } else {
            delete nextPlacements[sourceSlotId];
        }
    }

    return {
        ...page,
        placements: nextPlacements,
    };
}

export function placeCardsInSlots(page: BinderPage, targetSlotIds: string[], cardIds: string[]) {
    const nextPlacements = { ...page.placements };

    targetSlotIds.forEach((targetSlotId, index) => {
        const cardId = cardIds[index];
        if (cardId) {
            nextPlacements[targetSlotId] = cardId;
        }
    });

    return {
        ...page,
        placements: nextPlacements,
    };
}

export function upsertCardSnapshot(cardSnapshots: CardRecord[], card: CardRecord) {
    const index = cardSnapshots.findIndex((item) => item.id === card.id);
    if (index === -1) {
        return [...cardSnapshots, card];
    }

    const next = [...cardSnapshots];
    next[index] = card;
    return next;
}
