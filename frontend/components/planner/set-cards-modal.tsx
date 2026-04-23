"use client";

import { useEffect, useMemo, useState } from "react";
import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type SetCardsModalProps = Pick<
  PlannerState,
  | "modalOpen"
  | "closeSetModal"
  | "selectedSet"
  | "cardLoading"
  | "modalError"
  | "filteredCards"
  | "modalSearch"
  | "setModalSearch"
  | "remainingPageCapacity"
  | "activePagePlacedCardIds"
  | "placeCardsInNextEmptySlots"
>;

export function SetCardsModal({
  modalOpen,
  closeSetModal,
  selectedSet,
  cardLoading,
  modalError,
  filteredCards,
  modalSearch,
  setModalSearch,
  remainingPageCapacity,
  activePagePlacedCardIds,
  placeCardsInNextEmptySlots,
}: SetCardsModalProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const placedCardIds = useMemo(
    () => new Set(activePagePlacedCardIds),
    [activePagePlacedCardIds],
  );

  useEffect(() => {
    if (!modalOpen) {
      setSelectedCardIds([]);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [modalOpen]);

  useEffect(() => {
    setSelectedCardIds([]);
  }, [selectedSet?.id]);

  useEffect(() => {
    setSelectedCardIds((current) =>
      current.filter((cardId) => !placedCardIds.has(cardId)).slice(0, remainingPageCapacity),
    );
  }, [placedCardIds, remainingPageCapacity]);

  if (!modalOpen) {
    return null;
  }

  const selectedCardIdSet = new Set(selectedCardIds);

  function toggleCard(cardId: string) {
    if (placedCardIds.has(cardId)) {
      return;
    }

    setSelectedCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId);
      }

      if (current.length >= remainingPageCapacity) {
        return current;
      }

      return [...current, cardId];
    });
  }

  function handleConfirm() {
    if (!selectedCardIds.length) {
      return;
    }

    placeCardsInNextEmptySlots(selectedCardIds);
    closeSetModal();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={closeSetModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[96rem] flex-col rounded-[32px] border border-white/10 bg-slate-950 px-5 py-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              {selectedSet?.code ?? "Set"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {selectedSet?.name ?? "Cards"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Select up to {remainingPageCapacity} card
              {remainingPageCapacity === 1 ? "" : "s"} for the active page.
            </p>
          </div>

          <button
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/5"
            onClick={closeSetModal}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500"
            onChange={(event) => setModalSearch(event.target.value)}
            placeholder="Search cards in this set..."
            value={modalSearch}
          />
          <div className="min-w-[88px] shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center text-sm text-slate-300">
            {selectedCardIds.length} / {remainingPageCapacity}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {cardLoading ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
              Loading cards...
            </div>
          ) : modalError ? (
            <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 px-6 py-12 text-center text-sm text-rose-100">
              {modalError}
            </div>
          ) : remainingPageCapacity === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
              This page has no empty slots left.
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
              No cards match this search.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {filteredCards.map((card) => {
                const isSelected = selectedCardIdSet.has(card.id);
                const isPlaced = placedCardIds.has(card.id);
                const atSelectionLimit =
                  !isSelected && selectedCardIds.length >= remainingPageCapacity;

                return (
                  <button
                    key={card.id}
                    className={`rounded-[24px] border p-3 text-left transition ${
                      isSelected
                        ? "border-cyan-300 bg-cyan-300/10"
                        : "border-white/10 bg-white/5"
                    } ${
                      isPlaced || atSelectionLimit
                        ? "cursor-not-allowed opacity-45"
                        : "hover:border-white/25"
                    }`}
                    disabled={isPlaced}
                    onClick={() => toggleCard(card.id)}
                    type="button"
                  >
                    <img
                      alt={card.name}
                      className="aspect-[206/288] w-full rounded-2xl bg-slate-900/70 object-contain"
                      loading="lazy"
                      src={card.imageUrl}
                    />
                    <div className="mt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {card.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {card.cardSetId} · {card.rarity}
                          </p>
                        </div>
                        <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-200">
                          {formatPrice(card.marketPrice)}
                        </span>
                      </div>
                      {isPlaced ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-amber-200">
                          Already on page
                        </p>
                      ) : isSelected ? (
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-cyan-200">
                          Selected
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
          <p className="text-xs text-slate-400">
            Cards fill the next available empty slots on the active page.
          </p>
          <div className="flex gap-3">
            <button
              className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:bg-white/5"
              onClick={closeSetModal}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedCardIds.length}
              onClick={handleConfirm}
              type="button"
            >
              {selectedCardIds.length
                ? `Add ${selectedCardIds.length} ${
                    selectedCardIds.length === 1 ? "card" : "cards"
                  }`
                : "Add cards"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
