"use client";

import { ActionRailButton } from "@/components/planner/action-rail/action-button";

export function AddCardRailAction({ onClick }: { onClick: () => void }) {
  return (
    <ActionRailButton
      label="Add card"
      onClick={onClick}
      className="border-cyan-300/40 bg-cyan-300 text-slate-950 hover:border-cyan-200 hover:bg-cyan-200"
    >
      +
    </ActionRailButton>
  );
}

export function ClearPageRailAction({ onClick }: { onClick: () => void }) {
  return <ActionRailButton label="Clear page" onClick={onClick}>x</ActionRailButton>;
}

export function DownloadRailAction({ onClick }: { onClick: () => void }) {
  return <ActionRailButton label="Download screenshot" onClick={onClick}>↓</ActionRailButton>;
}

export function ExportJsonRailAction({ onClick }: { onClick: () => void }) {
  return <ActionRailButton label="Export JSON" onClick={onClick}>E</ActionRailButton>;
}

export function ImportJsonRailAction({ onClick }: { onClick: () => void }) {
  return <ActionRailButton label="Import JSON" onClick={onClick}>I</ActionRailButton>;
}
