"use client";

import { useState } from "react";

type CatalogSearchProps = {
  onSubmit: (query: string) => void;
};

export function CatalogSearch({ onSubmit }: CatalogSearchProps) {
  const [cardNameQuery, setCardNameQuery] = useState("");

  return (
    <form
      className="mb-4 flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(cardNameQuery);
      }}
    >
      <div className="flex w-95/100 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-2 py-1.5">
        <input
          className="w-full bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-500"
          onChange={(event) => setCardNameQuery(event.target.value)}
          placeholder="Search cards by name..."
          value={cardNameQuery}
        />
        <button
          aria-label="Send"
          className="shrink-0 rounded-xl bg-cyan-300 p-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!cardNameQuery.trim()}
          type="submit"
        >
          <svg
            aria-hidden="true"
            className="h-6 w-6 text-slate-950"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M10 4a6 6 0 1 0 3.89 10.56l4.27 4.27a1 1 0 0 0 1.42-1.42l-4.27-4.27A6 6 0 0 0 10 4Zm-4 6a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
