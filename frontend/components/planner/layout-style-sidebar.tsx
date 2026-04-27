"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannerState } from "@/hooks/use-planner-state";
import {
  BINDER_BACKGROUNDS,
  PAGE_BACKGROUNDS,
} from "@/lib/planner";
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
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <aside className="rounded-[28px] border border-white/10 bg-slate-950/55 p-4 backdrop-blur">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Controls</h2>
          <p className="text-xs text-slate-400">
            {activeTab === "layout"
              ? "Manage binder layouts, templates, and page flow."
              : "Tune binder and page styling with saved custom colors."}
          </p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
          <button
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === "layout"
                ? "bg-cyan-300 text-slate-950"
                : "text-slate-300"
            }`}
            onClick={() => setActiveTab("layout")}
            type="button"
          >
            Layout
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm transition ${
              activeTab === "style" ? "bg-cyan-300 text-slate-950" : "text-slate-300"
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
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10"
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
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                onChange={(event) => setRenameDraft(event.target.value)}
                placeholder={activeLayout?.name ?? "Rename layout"}
                value={renameDraft}
              />
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm"
                  onClick={renameLayout}
                  type="button"
                >
                  Rename
                </button>
                <button
                  className="rounded-full border border-rose-400/40 px-4 py-2 text-sm text-rose-200"
                  onClick={deleteLayout}
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
                        : "border border-white/10 bg-white/5"
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
                className="rounded-full border border-white/10 px-4 py-2 text-sm"
                onClick={addPage}
                type="button"
              >
                Add page
              </button>
              <button
                className="rounded-full border border-white/10 px-4 py-2 text-sm"
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
  );
}
