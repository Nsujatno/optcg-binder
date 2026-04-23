import type { PlannerState } from "@/hooks/use-planner-state";
import { formatPrice } from "@/lib/planner";

type CatalogSidebarProps = Pick<
  PlannerState,
  | "setLoading"
  | "sets"
  | "selectedSetId"
  | "setSelectedSetId"
  | "search"
  | "setSearch"
  | "cardLoading"
  | "cards"
>;

export function CatalogSidebar({
  setLoading,
  sets,
  selectedSetId,
  setSelectedSetId,
  search,
  setSearch,
  cardLoading,
  cards,
}: CatalogSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Catalog</h2>
          <p className="text-xs text-slate-400">
            {setLoading ? "Loading sets..." : `${sets.length} sets`}
          </p>
        </div>
      </div>

      <label className="mb-3 block text-xs uppercase tracking-[0.25em] text-slate-400">
        Search cards
      </label>
      <input
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search by name, color, type, effect..."
        value={search}
      />

      <div className="mb-4 grid grid-cols-2 gap-2">
        {sets.map((set) => (
          <button
            key={set.id}
            className={`rounded-2xl border px-3 py-3 text-left text-sm transition ${
              selectedSetId === set.id
                ? "border-cyan-300 bg-cyan-300/10 text-white"
                : "border-white/10 bg-white/5 text-slate-300"
            }`}
            onClick={() => setSelectedSetId(set.id)}
            type="button"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              {set.code}
            </div>
            <div className="mt-1 font-medium">{set.name}</div>
            <div className="mt-1 text-xs text-slate-500">{set.cardCount} cards</div>
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.25em] text-slate-400">
        <span>Cards</span>
        <span>{cardLoading ? "Loading..." : cards.length}</span>
      </div>

      <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-3"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", card.id);
            }}
          >
            <div className="flex gap-3">
              <img
                alt={card.name}
                className="h-24 w-16 rounded-xl object-cover"
                loading="lazy"
                src={card.imageUrl}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold leading-tight">{card.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {card.cardSetId} · {card.rarity}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs text-emerald-200">
                    {formatPrice(card.marketPrice)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                  <span className="rounded-full bg-white/10 px-2 py-1">{card.color}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1">{card.type}</span>
                  {card.cost ? (
                    <span className="rounded-full bg-white/10 px-2 py-1">
                      Cost {card.cost}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
