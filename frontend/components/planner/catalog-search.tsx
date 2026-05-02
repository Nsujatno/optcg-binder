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
      <input
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-slate-500"
        onChange={(event) => setCardNameQuery(event.target.value)}
        placeholder="Search cards by name..."
        value={cardNameQuery}
      />
      <button
        aria-label="Send"
        className="shrink-0 rounded-3xl bg-cyan-300 p-2.5 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!cardNameQuery.trim()}
        type="submit"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5 text-white"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </form>
  );
}

