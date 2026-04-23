"use client";

import { useDeferredValue, useEffect, useState } from "react";
import {
  getCardsBySetClient,
  getSetsClient,
  searchCardsClient,
} from "@/lib/api-client";
import type { CardRecord, SetRecord } from "@/lib/types";

export function useCatalogData() {
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [cardLoading, setCardLoading] = useState(false);
  const [setLoading, setSetLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    async function loadSets() {
      setSetLoading(true);
      try {
        const payload = await getSetsClient();
        if (!cancelled) {
          setSets(payload.sets);
          setSelectedSetId((current) => current || payload.sets[0]?.id || "");
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

  useEffect(() => {
    if (!selectedSetId) {
      return;
    }

    let cancelled = false;

    async function loadCards() {
      setCardLoading(true);
      setErrorMessage("");
      try {
        const payload = deferredSearch.trim()
          ? await searchCardsClient(deferredSearch.trim(), selectedSetId)
          : await getCardsBySetClient(selectedSetId);
        if (!cancelled) {
          setCards(payload.cards);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Could not load cards right now.");
        }
      } finally {
        if (!cancelled) {
          setCardLoading(false);
        }
      }
    }

    loadCards();
    return () => {
      cancelled = true;
    };
  }, [deferredSearch, selectedSetId]);

  return {
    sets,
    selectedSetId,
    setSelectedSetId,
    cards,
    search,
    setSearch,
    deferredSearch,
    cardLoading,
    setLoading,
    errorMessage,
    setErrorMessage,
  };
}
