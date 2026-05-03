"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type SetCardsModalProps = Pick<
  PlannerState,
  | "sets"
  | "selectedSetId"
  | "modalOpen"
  | "closeSetModal"
  | "selectedSet"
  | "cardLoading"
  | "filteredCards"
  | "modalSearch"
  | "setModalSearch"
  | "remainingPageCapacity"
  | "activePagePlacedCardIds"
  | "placeCardsInNextEmptySlots"
  | "catalogMode"
  | "singleSlotId"
  | "selectModalSet"
  | "submitModalSearch"
  | "placeCardInSlot"
>;

export function SetCardsModal({
  sets,
  selectedSetId,
  modalOpen,
  closeSetModal,
  selectedSet,
  cardLoading,
  filteredCards,
  modalSearch,
  setModalSearch,
  remainingPageCapacity,
  activePagePlacedCardIds,
  placeCardsInNextEmptySlots,
  catalogMode,
  singleSlotId,
  selectModalSet,
  submitModalSearch,
  placeCardInSlot,
}: SetCardsModalProps) {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const placedCardIds = useMemo(() => new Set(activePagePlacedCardIds), [activePagePlacedCardIds]);

  useEffect(() => {
    if (!modalOpen) {
      setSelectedCardIds([]);
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSetModal();
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [closeSetModal, modalOpen]);

  useEffect(() => {
    setSelectedCardIds([]);
  }, [selectedSetId]);

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

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitModalSearch(modalSearch);
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={closeSetModal}
      role="dialog"
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[96rem] flex-col rounded-[32px] border border-white/10 bg-slate-950 px-5 py-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-1 text-xl font-semibold text-white">
              {catalogMode === "bulk" ? "Add cards to page" : "Pick a card for this slot"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              {catalogMode === "bulk"
                ? `Select up to ${remainingPageCapacity} cards, then confirm.`
                : "Click one card to place it immediately."}
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

        <form className="mb-3" onSubmit={handleSearchSubmit}>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500"
            onChange={(event) => setModalSearch(event.target.value)}
            placeholder="Search cards by name and press Enter..."
            value={modalSearch}
          />
        </form>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="planner-scrollbar overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
            {sets.map((set) => (
              <button
                key={set.id}
                className={`mb-2 flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition last:mb-0 ${
                  selectedSetId === set.id
                    ? "border-cyan-300 bg-cyan-300/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
                onClick={() => void selectModalSet(set.id)}
                type="button"
              >
                <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {set.code}
                </span>
                <span className="truncate">{set.name}</span>
              </button>
            ))}
          </aside>

          <div className="planner-scrollbar min-h-0 overflow-y-auto pr-1">
            {!selectedSetId ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                Choose a set or search for a card name to load catalog results.
              </div>
            ) : cardLoading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                Loading cards...
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-300">
                No cards found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {filteredCards.map((card) => {
                  const isSelected = selectedCardIdSet.has(card.id);
                  const isPlaced = placedCardIds.has(card.id);
                  const atSelectionLimit =
                    !isSelected && selectedCardIds.length >= remainingPageCapacity;

                  return (
                    <button
                      key={card.id}
                      className={`rounded-[24px] border p-3 text-left transition ${
                        isSelected ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/5"
                      } ${
                        isPlaced || atSelectionLimit ? "cursor-not-allowed opacity-45" : "hover:border-white/25"
                      }`}
                      disabled={isPlaced}
                      onClick={() => {
                        if (catalogMode === "single-slot" && singleSlotId) {
                          placeCardInSlot(singleSlotId, card.id);
                          closeSetModal();
                          return;
                        }
                        toggleCard(card.id);
                      }}
                      type="button"
                    >
                      <img
                        alt={card.name}
                        className="aspect-[206/288] w-full rounded-2xl bg-slate-900/70 object-contain"
                        loading="lazy"
                        src={card.imageUrl}
                      />
                      <div className="mt-3">
                        <p className="truncate text-sm font-semibold text-white">{card.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {card.cardSetId} · {card.rarity}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-emerald-400/15 px-2 py-1 text-[11px] text-emerald-200">
                          {formatPrice(card.marketPrice)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {catalogMode === "bulk" ? (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
            <p className="text-xs text-slate-400">
              {selectedSet ? `${selectedSet.code} · ${selectedSet.name}` : "No source selected"}
            </p>
            <button
              className="rounded-full bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedCardIds.length}
              onClick={handleConfirm}
              type="button"
            >
              {selectedCardIds.length ? `Add ${selectedCardIds.length} cards` : "Add cards"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
