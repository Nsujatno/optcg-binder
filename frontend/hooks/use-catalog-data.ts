"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToastVariant } from "@/hooks/use-toast";
import { getCardsBySetClient, getFilteredCardsClient, getSetsClient } from "@/lib/api-client";
import type { CardRecord, SetRecord } from "@/lib/types";

export function useCatalogData(onError?: (message: string, variant?: ToastVariant) => void) {
    const [sets, setSets] = useState<SetRecord[]>([]);
    const [selectedSetId, setSelectedSetId] = useState<string>("");
    const [cardsBySetId, setCardsBySetId] = useState<Record<string, CardRecord[]>>({});
    const [loadingBySetId, setLoadingBySetId] = useState<Record<string, boolean>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSearch, setModalSearch] = useState("");
    const [modalError, setModalError] = useState("");
    const [modalSelectedSetOverride, setModalSelectedSetOverride] = useState<SetRecord | null>(null);
    const [setLoading, setSetLoading] = useState(false);
    const setErrorMessage = useCallback(
        (message: string, variant: ToastVariant = "error") => {
            if (!message.trim()) {
                return;
            }
            onError?.(message, variant);
        },
        [onError],
    );

    useEffect(() => {
        let cancelled = false;

        async function loadSets() {
            setSetLoading(true);
            try {
                const payload = await getSetsClient();
                if (!cancelled) {
                    setSets(payload.sets);
                }
            } catch {
                if (!cancelled) {
                    setErrorMessage("Could not load sets right now.");
                }
            } finally {
                if (!cancelled) {
                    setSetLoading(false);
                }
            }
        }

        loadSets();
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedSet = useMemo(
        () =>
            modalSelectedSetOverride ?? sets.find((set) => set.id === selectedSetId) ?? null,
        [modalSelectedSetOverride, selectedSetId, sets],
    );
    const cards = selectedSetId ? cardsBySetId[selectedSetId] ?? [] : [];
    const cardLoading = selectedSetId ? loadingBySetId[selectedSetId] ?? false : false;
    const filteredCards = useMemo(() => {
        const query = modalSearch.trim().toLowerCase();
        if (!query) {
            return cards;
        }

        return cards.filter((card) =>
            [
                card.name,
                card.cardSetId,
                card.color,
                card.type,
                card.rarity,
                card.text,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query),
        );
    }, [cards, modalSearch]);
    const allLoadedCards = useMemo(
        () => Object.values(cardsBySetId).flat(),
        [cardsBySetId],
    );

    async function openSetModal(setId: string) {
        setSelectedSetId(setId);
        setModalSelectedSetOverride(null);
        setModalSearch("");
        setModalOpen(true);

        if (cardsBySetId[setId]) {
            return;
        }

        if (loadingBySetId[setId]) {
            return;
        }

        setLoadingBySetId((current) => ({
            ...current,
            [setId]: true,
        }));
        try {
            const payload = await getCardsBySetClient(setId);
            setCardsBySetId((current) => ({
                ...current,
                [setId]: payload.cards,
            }));
        } catch {
            setErrorMessage("Could not load cards for that set right now.");
        } finally {
            setLoadingBySetId((current) => ({
                ...current,
                [setId]: false,
            }));
        }
    }

    async function openCardNameModal(cardName: string) {
        const trimmed = cardName.trim();
        if (!trimmed) {
            return;
        }

        const syntheticSetId = `name-search:${trimmed.toLowerCase()}`;
        setSelectedSetId(syntheticSetId);
        setModalSelectedSetOverride({
            id: syntheticSetId,
            code: "Search",
            name: `Results for "${trimmed}"`,
            cardCount: 0,
        });
        setModalSearch("");
        setModalOpen(true);

        if (cardsBySetId[syntheticSetId]) {
            return;
        }

        if (loadingBySetId[syntheticSetId]) {
            return;
        }

        setLoadingBySetId((current) => ({
            ...current,
            [syntheticSetId]: true,
        }));
        try {
            const payload = await getFilteredCardsClient(trimmed);
            setCardsBySetId((current) => ({
                ...current,
                [syntheticSetId]: payload.cards,
            }));
        } catch {
            setErrorMessage("Could not search cards right now.");
        } finally {
            setLoadingBySetId((current) => ({
                ...current,
                [syntheticSetId]: false,
            }));
        }
    }

    function closeSetModal() {
        setModalOpen(false);
        setModalSearch("");
        setModalSelectedSetOverride(null);
    }

    return {
        sets,
        selectedSetId,
        selectedSet,
        openSetModal,
        openCardNameModal,
        closeSetModal,
        modalOpen,
        cards,
        filteredCards,
        allLoadedCards,
        modalSearch,
        setModalSearch,
        cardLoading,
        setLoading,
        setErrorMessage,
    };
}
