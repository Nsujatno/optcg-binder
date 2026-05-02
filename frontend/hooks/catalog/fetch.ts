"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ToastVariant } from "@/hooks/use-toast";
import { getCardsBySetClient, getFilteredCardsClient, getSetsClient } from "@/lib/api-client";
import type { CardRecord, SetRecord } from "@/lib/types";

export function useCatalogFetch(onError?: (message: string, variant?: ToastVariant) => void) {
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [cardsBySetId, setCardsBySetId] = useState<Record<string, CardRecord[]>>({});
  const [loadingBySetId, setLoadingBySetId] = useState<Record<string, boolean>>({});
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
  }, [setErrorMessage]);

  const allLoadedCards = useMemo(() => Object.values(cardsBySetId).flat(), [cardsBySetId]);

  async function ensureSetCardsLoaded(setId: string) {
    if (cardsBySetId[setId] || loadingBySetId[setId]) {
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

  async function ensureNameSearchLoaded(sourceId: string, cardName: string) {
    if (cardsBySetId[sourceId] || loadingBySetId[sourceId]) {
      return;
    }

    setLoadingBySetId((current) => ({
      ...current,
      [sourceId]: true,
    }));
    try {
      const payload = await getFilteredCardsClient(cardName);
      setCardsBySetId((current) => ({
        ...current,
        [sourceId]: payload.cards,
      }));
    } catch {
      setErrorMessage("Could not search cards right now.");
    } finally {
      setLoadingBySetId((current) => ({
        ...current,
        [sourceId]: false,
      }));
    }
  }

  return {
    sets,
    cardsBySetId,
    loadingBySetId,
    setLoading,
    allLoadedCards,
    setErrorMessage,
    ensureSetCardsLoaded,
    ensureNameSearchLoaded,
  };
}
