"use client";

import {
  AddCardRailAction,
  ClearPageRailAction,
  DownloadRailAction,
  ExportJsonRailAction,
  ImportJsonRailAction,
} from "@/components/planner/action-rail/actions";

type PlannerActionRailProps = {
  openAddCard: () => void;
  openClearPage: () => void;
  openDownload: () => void;
  exportLayouts: () => void;
  triggerImport: () => void;
};

export function PlannerActionRail({
  openAddCard,
  openClearPage,
  openDownload,
  exportLayouts,
  triggerImport,
}: PlannerActionRailProps) {
  return (
    <aside className="relative z-[50] flex flex-col items-center gap-2 rounded-[28px] border border-white/10 bg-slate-950/55 p-3 backdrop-blur">
      <AddCardRailAction onClick={openAddCard} />
      <ClearPageRailAction onClick={openClearPage} />
      <DownloadRailAction onClick={openDownload} />
      <ExportJsonRailAction onClick={exportLayouts} />
      <ImportJsonRailAction onClick={triggerImport} />
    </aside>
  );
}
