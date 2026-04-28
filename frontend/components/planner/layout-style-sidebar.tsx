"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannerState } from "@/hooks/use-planner-state";
import { BINDER_BACKGROUNDS, PAGE_BACKGROUNDS } from "@/lib/planner";
import { BINDER_TEMPLATES } from "@/lib/types";
import { ThemeColorControl } from "@/components/planner/theme-color-control";

type LayoutStyleSidebarProps = Pick<
  PlannerState,
  | "layouts"
  | "activeLayoutId"
  | "setActiveLayoutId"
  | "activeLayout"
  | "activeTemplate"
  | "activePageIndex"
  | "setActivePageIndex"
  | "renameDraft"
  | "setRenameDraft"
  | "renameLayout"
  | "deleteLayout"
  | "createNewLayout"
  | "duplicateLayout"
  | "setTemplate"
  | "addPage"
  | "duplicatePage"
  | "setSelectedRegionId"
  | "templateValidationById"
  | "templateErrorMessage"
  | "updateTheme"
>;

export function LayoutStyleSidebar({
  layouts,
  activeLayoutId,
  setActiveLayoutId,
  activeLayout,
  activeTemplate,
  activePageIndex,
  setActivePageIndex,
  renameDraft,
  setRenameDraft,
  renameLayout,
  deleteLayout,
  createNewLayout,
  duplicateLayout,
  setTemplate,
  addPage,
  duplicatePage,
  setSelectedRegionId,
  templateValidationById,
  templateErrorMessage,
  updateTheme,
}: LayoutStyleSidebarProps) {
  const [activeTab, setActiveTab] = useState<"layout" | "style">("layout");
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const layoutMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!layoutMenuRef.current) {
        return;
      }

      if (!layoutMenuRef.current.contains(event.target as Node)) {
        setIsLayoutMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLayoutMenuOpen(false);
        setIsRenameModalOpen(false);
        setIsDeleteModalOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function openRenameModal() {
    setRenameDraft(activeLayout?.name ?? "");
    setIsRenameModalOpen(true);
  }

  function confirmRename() {
    if (!renameDraft.trim()) {
      return;
    }

    renameLayout();
    setIsRenameModalOpen(false);
  }

  function confirmDelete() {
    deleteLayout();
    setIsDeleteModalOpen(false);
  }

  return (
    <>
      <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
        <div className="mb-5 flex justify-center">
          <div className="flex w-[220px] rounded-full border border-white/10 bg-black/20 p-1">
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm text-center transition ${
                activeTab === "layout"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-slate-100"
              }`}
              onClick={() => setActiveTab("layout")}
              type="button"
            >
              Layout
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-2 text-sm text-center transition ${
                activeTab === "style"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-300 hover:bg-white/10 hover:text-slate-100"
              }`}
              onClick={() => setActiveTab("style")}
              type="button"
            >
              Style
            </button>
          </div>
        </div>

        {activeTab === "layout" ? (
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                Active layout
              </h3>
              <div className="space-y-3">
                <div ref={layoutMenuRef} className="relative">
                  <button
                    aria-expanded={isLayoutMenuOpen}
                    aria-haspopup="listbox"
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                    onClick={() => setIsLayoutMenuOpen((current) => !current)}
                    type="button"
                  >
                    <span className="truncate">{activeLayout?.name ?? "Select layout"}</span>
                    <span
                      className={`text-xs text-slate-400 transition ${
                        isLayoutMenuOpen ? "rotate-180" : ""
                      }`}
                    >
                      v
                    </span>
                  </button>

                  {isLayoutMenuOpen ? (
                    <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
                      <div className="planner-scrollbar max-h-64 overflow-y-auto pr-1" role="listbox">
                        {layouts.map((layout) => {
                          const isActive = layout.id === activeLayoutId;

                          return (
                            <button
                              key={layout.id}
                              className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition last:mb-0 ${
                                isActive
                                  ? "bg-cyan-300/15 text-cyan-200"
                                  : "text-slate-200 hover:bg-white/5"
                              }`}
                              onClick={() => {
                                setActiveLayoutId(layout.id);
                                setActivePageIndex(0);
                                setSelectedRegionId(null);
                                setIsLayoutMenuOpen(false);
                              }}
                              role="option"
                              type="button"
                            >
                              <span className="truncate">{layout.name}</span>
                              {isActive ? (
                                <span className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                                  Active
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                    onClick={createNewLayout}
                    type="button"
                  >
                    <span className="text-base leading-none">+</span>
                    <span>New</span>
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                    onClick={duplicateLayout}
                    type="button"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      viewBox="0 0 24 24"
                    >
                      <rect x="9" y="9" width="10" height="10" rx="2" />
                      <rect x="5" y="5" width="10" height="10" rx="2" />
                    </svg>
                    <span>Duplicate</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                    onClick={openRenameModal}
                    type="button"
                  >
                    Rename
                  </button>
                  <button
                    className="flex items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20"
                    onClick={() => setIsDeleteModalOpen(true)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                Template
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BINDER_TEMPLATES.map((template) => {
                  const validation = templateValidationById.get(template.id);
                  const isDisabled = validation ? !validation.canApply : false;

                  return (
                    <button
                      key={template.id}
                      className={`rounded-2xl px-4 py-3 text-sm transition ${
                        activeLayout?.templateId === template.id
                          ? "bg-cyan-300 text-slate-950"
                          : "border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                      } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                      disabled={isDisabled}
                      onClick={() => setTemplate(template.id)}
                      title={
                        isDisabled && validation?.reason
                          ? `Disabled: ${validation.reason}`
                          : undefined
                      }
                      type="button"
                    >
                      {template.name}
                    </button>
                  );
                })}
              </div>
              {templateErrorMessage ? (
                <p className="mt-2 text-xs text-amber-200">{templateErrorMessage}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Current grid: {activeTemplate.rows} rows x {activeTemplate.cols} cols
              </p>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Pages
                </h3>
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {activePageIndex + 1} / {activeLayout?.pages.length ?? 0}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                  onClick={addPage}
                  type="button"
                >
                  Add page
                </button>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                  onClick={duplicatePage}
                  type="button"
                >
                  Duplicate
                </button>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <ThemeColorControl
              label="Binder background"
              onChange={(color) => updateTheme("binderBackground", color)}
              presetColors={BINDER_BACKGROUNDS}
              themeKey="binderBackground"
              value={activeLayout?.theme.binderBackground ?? BINDER_BACKGROUNDS[0]}
            />
            <ThemeColorControl
              label="Page background"
              onChange={(color) => updateTheme("pageBackground", color)}
              presetColors={PAGE_BACKGROUNDS}
              themeKey="pageBackground"
              value={activeLayout?.theme.pageBackground ?? PAGE_BACKGROUNDS[0]}
            />
          </div>
        )}
      </aside>

      {isRenameModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
            <h3 className="text-lg font-semibold">Rename binder</h3>
            <p className="mt-1 text-sm text-slate-400">
              Enter a new name for this binder layout.
            </p>
            <input
              autoFocus
              className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-cyan-300/70"
              onChange={(event) => setRenameDraft(event.target.value)}
              placeholder={activeLayout?.name ?? "Binder name"}
              value={renameDraft}
            />
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
                onClick={confirmRename}
                type="button"
              >
                Save name
              </button>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                onClick={() => setIsRenameModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-[28px] border border-rose-300/20 bg-slate-950 p-5 shadow-[0_24px_80px_rgba(2,6,23,0.55)]">
            <h3 className="text-lg font-semibold text-rose-100">Delete binder?</h3>
            <p className="mt-1 text-sm text-slate-300">
              This removes <span className="font-medium">{activeLayout?.name ?? "this binder"}</span>.
              This action cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-full border border-rose-400/50 bg-rose-500/20 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/30"
                onClick={confirmDelete}
                type="button"
              >
                Yes, delete
              </button>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm transition hover:border-white/20 hover:bg-white/10"
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
