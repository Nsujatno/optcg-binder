"use client";

import type { ToastVariant } from "@/hooks/use-toast";
import { useCatalogFetch } from "@/hooks/catalog/fetch";
import { useCatalogModal } from "@/hooks/catalog/modal";

export function useCatalogData(onError?: (message: string, variant?: ToastVariant) => void) {
    const fetchState = useCatalogFetch(onError);
    const modalState = useCatalogModal({
        sets: fetchState.sets,
        cardsBySetId: fetchState.cardsBySetId,
        loadingBySetId: fetchState.loadingBySetId,
        ensureSetCardsLoaded: fetchState.ensureSetCardsLoaded,
        ensureNameSearchLoaded: fetchState.ensureNameSearchLoaded,
    });

    return {
        ...fetchState,
        ...modalState,
    };
}
