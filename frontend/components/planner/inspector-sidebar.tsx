import type { PlannerState } from "@/hooks/use-planner-state";
import {
  BINDER_BACKGROUNDS,
  formatPrice,
  PAGE_BACKGROUNDS,
  SLOT_ACCENTS,
  slotLabel,
} from "@/lib/planner";

type InspectorSidebarProps = Pick<
  PlannerState,
  | "currentSlotPosition"
  | "updateTheme"
  | "activeLayout"
  | "selectedCard"
  | "clearSelectedSlot"
  | "uploadInputRef"
  | "handleUploadImage"
  | "selectedRegion"
  | "editSelectedRegion"
  | "toggleRegionLock"
  | "deleteSelectedRegion"
>;

export function InspectorSidebar({
  currentSlotPosition,
  updateTheme,
  activeLayout,
  selectedCard,
  clearSelectedSlot,
  uploadInputRef,
  handleUploadImage,
  selectedRegion,
  editSelectedRegion,
  toggleRegionLock,
  deleteSelectedRegion,
}: InspectorSidebarProps) {
  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <p className="text-xs text-slate-400">
          {slotLabel(currentSlotPosition.row, currentSlotPosition.col)}
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
            Theme
          </h3>
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm text-slate-300">Binder background</p>
              <div className="flex flex-wrap gap-2">
                {BINDER_BACKGROUNDS.map((color) => (
                  <button
                    key={color}
                    className="h-9 w-9 rounded-full border border-white/15"
                    onClick={() => updateTheme("binderBackground", color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-300">Page background</p>
              <div className="flex flex-wrap gap-2">
                {PAGE_BACKGROUNDS.map((color) => (
                  <button
                    key={color}
                    className="h-9 w-9 rounded-full border border-white/15"
                    onClick={() => updateTheme("pageBackground", color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-300">Slot accent</p>
              <div className="flex flex-wrap gap-2">
                {SLOT_ACCENTS.map((color) => (
                  <button
                    key={color}
                    className="h-9 w-9 rounded-full border border-white/15"
                    onClick={() => updateTheme("slotAccent", color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm text-slate-300">Empty slot style</p>
              <div className="flex gap-2">
                {(["solid", "dashed", "glass"] as const).map((style) => (
                  <button
                    key={style}
                    className={`rounded-full border px-3 py-2 text-sm ${
                      activeLayout?.theme.emptySlotStyle === style
                        ? "border-cyan-300 bg-cyan-300/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    onClick={() => updateTheme("emptySlotStyle", style)}
                    type="button"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
            Card slot
          </h3>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            {selectedCard ? (
              <div>
                <div className="flex gap-3">
                  <img
                    alt={selectedCard.name}
                    className="h-24 w-16 rounded-xl object-cover"
                    src={selectedCard.imageUrl}
                  />
                  <div>
                    <h4 className="font-semibold">{selectedCard.name}</h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedCard.cardSetId} · {selectedCard.color} · {selectedCard.type}
                    </p>
                    <p className="mt-3 text-sm text-emerald-200">
                      {formatPrice(selectedCard.marketPrice)}
                    </p>
                  </div>
                </div>
                <button
                  className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm"
                  onClick={clearSelectedSlot}
                  type="button"
                >
                  Clear slot
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Drop a card here or select a filled slot to inspect it.
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Meechi art
            </h3>
            <button
              className="rounded-full border border-white/10 px-3 py-2 text-sm"
              onClick={() => uploadInputRef.current?.click()}
              type="button"
            >
              Upload image
            </button>
          </div>
          <input
            ref={uploadInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleUploadImage}
            type="file"
          />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <p>
              Select the slot where the art should start, then upload an image and
              choose its span.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Current start slot: {slotLabel(currentSlotPosition.row, currentSlotPosition.col)}
            </p>

            {selectedRegion ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-sm font-medium">
                  Region {selectedRegion.colSpan} x {selectedRegion.rowSpan}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {selectedRegion.locked ? "Locked" : "Unlocked"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-white/10 px-3 py-2 text-sm"
                    onClick={editSelectedRegion}
                    type="button"
                  >
                    Edit crop
                  </button>
                  <button
                    className="rounded-full border border-white/10 px-3 py-2 text-sm"
                    onClick={toggleRegionLock}
                    type="button"
                  >
                    {selectedRegion.locked ? "Unlock" : "Lock"}
                  </button>
                  <button
                    className="rounded-full border border-rose-400/40 px-3 py-2 text-sm text-rose-200"
                    onClick={deleteSelectedRegion}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </aside>
  );
}
