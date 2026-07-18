 "use client";

import { CatalogSearch } from "@/components/planner/catalog-search";
import { groupSetsByCategory } from "@/lib/planner";
import type { SetRecord } from "@/lib/types";

type CatalogSidebarProps = {
  sets: SetRecord[];
  selectedSetId: string;
  setLoading: boolean;
  openSetModal: (setId: string) => void;
  openCardNameModal: (query: string) => void;
};

export function CatalogSidebar({
  sets,
  selectedSetId,
  setLoading,
  openSetModal,
  openCardNameModal,
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

      <CatalogSearch onSubmit={openCardNameModal} />

      <div className="planner-scrollbar max-h-[70vh] space-y-4 overflow-y-auto pr-1">
        {groupSetsByCategory(sets).map((group) => (
          <div key={group.category} className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {group.label}
            </p>
            {group.sets.map((set) => (
              <button
                key={set.id}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  selectedSetId === set.id
                    ? "border-cyan-300 bg-cyan-300/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
                onClick={() => openSetModal(set.id)}
                type="button"
              >
                <span className="shrink-0 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {set.code}
                </span>
                <span className="min-w-0 truncate font-medium">{set.name}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}
