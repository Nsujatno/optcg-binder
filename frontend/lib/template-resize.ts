import type { ArtRegion, BinderPage, BinderTemplate } from "@/lib/types";

type ResizeItem =
  | { type: "card"; placementId: string }
  | { type: "art"; region: ArtRegion };

export type PageResizeResult = {
  canApply: boolean;
  reason: string | null;
  page: BinderPage;
  occupiedSlots: number;
};

export function countOccupiedSlots(page: BinderPage): number {
  const occupied = new Set(Object.keys(page.placements));
  page.artRegions.forEach((region) => {
    for (let row = region.originRow; row < region.originRow + region.rowSpan; row += 1) {
      for (let col = region.originCol; col < region.originCol + region.colSpan; col += 1) {
        occupied.add(slotKey(row, col));
      }
    }
  });
  return occupied.size;
}

export function resizePageForTemplate(
  page: BinderPage,
  sourceTemplate: BinderTemplate,
  targetTemplate: BinderTemplate,
): PageResizeResult {
  const occupiedSlots = countOccupiedSlots(page);
  const targetCapacity = targetTemplate.rows * targetTemplate.cols;
  if (occupiedSlots > targetCapacity) {
    return {
      canApply: false,
      reason: `${occupiedSlots} occupied slots exceed ${targetCapacity} slots.`,
      page,
      occupiedSlots,
    };
  }

  const items = getResizeItemsInSlotOrder(page, sourceTemplate);
  const nextPlacements: Record<string, string> = {};
  const nextArtRegions: ArtRegion[] = [];
  const occupied = new Set<string>();

  for (const item of items) {
    if (item.type === "card") {
      const targetSlot = findFirstFittingOrigin(targetTemplate, occupied, 1, 1);
      if (!targetSlot) {
        return {
          canApply: false,
          reason: "Current cards and Meechi art cannot fit this template.",
          page,
          occupiedSlots,
        };
      }

      const slotId = slotKey(targetSlot.row, targetSlot.col);
      nextPlacements[slotId] = item.placementId;
      occupied.add(slotId);
      continue;
    }

    const targetOrigin = findFirstFittingOrigin(
      targetTemplate,
      occupied,
      item.region.rowSpan,
      item.region.colSpan,
    );
    if (!targetOrigin) {
      return {
        canApply: false,
        reason: "A Meechi art region cannot fit in this template.",
        page,
        occupiedSlots,
      };
    }

    const nextRegion: ArtRegion = {
      ...item.region,
      originRow: targetOrigin.row,
      originCol: targetOrigin.col,
    };
    nextArtRegions.push(nextRegion);
    markOccupied(occupied, targetOrigin.row, targetOrigin.col, item.region.rowSpan, item.region.colSpan);
  }

  return {
    canApply: true,
    reason: null,
    occupiedSlots,
    page: {
      ...page,
      placements: nextPlacements,
      artRegions: nextArtRegions,
    },
  };
}

function getResizeItemsInSlotOrder(page: BinderPage, template: BinderTemplate): ResizeItem[] {
  const items: ResizeItem[] = [];
  const regionsByOrigin = new Map<string, ArtRegion>();
  const regionCoverage = new Set<string>();

  page.artRegions.forEach((region) => {
    regionsByOrigin.set(slotKey(region.originRow, region.originCol), region);
    for (let row = region.originRow; row < region.originRow + region.rowSpan; row += 1) {
      for (let col = region.originCol; col < region.originCol + region.colSpan; col += 1) {
        regionCoverage.add(slotKey(row, col));
      }
    }
  });

  for (let row = 0; row < template.rows; row += 1) {
    for (let col = 0; col < template.cols; col += 1) {
      const currentSlotId = slotKey(row, col);
      const originRegion = regionsByOrigin.get(currentSlotId);
      if (originRegion) {
        items.push({ type: "art", region: originRegion });
        continue;
      }

      if (regionCoverage.has(currentSlotId)) {
        continue;
      }

      const placementId = page.placements[currentSlotId];
      if (placementId) {
        items.push({ type: "card", placementId });
      }
    }
  }

  return items;
}

function findFirstFittingOrigin(
  template: BinderTemplate,
  occupied: Set<string>,
  rowSpan: number,
  colSpan: number,
): { row: number; col: number } | null {
  for (let row = 0; row <= template.rows - rowSpan; row += 1) {
    for (let col = 0; col <= template.cols - colSpan; col += 1) {
      let canFit = true;
      for (let testRow = row; testRow < row + rowSpan; testRow += 1) {
        for (let testCol = col; testCol < col + colSpan; testCol += 1) {
          if (occupied.has(slotKey(testRow, testCol))) {
            canFit = false;
            break;
          }
        }
        if (!canFit) {
          break;
        }
      }

      if (canFit) {
        return { row, col };
      }
    }
  }

  return null;
}

function markOccupied(
  occupied: Set<string>,
  originRow: number,
  originCol: number,
  rowSpan: number,
  colSpan: number,
) {
  for (let row = originRow; row < originRow + rowSpan; row += 1) {
    for (let col = originCol; col < originCol + colSpan; col += 1) {
      occupied.add(slotKey(row, col));
    }
  }
}

function slotKey(row: number, col: number) {
  return `${row}-${col}`;
}
