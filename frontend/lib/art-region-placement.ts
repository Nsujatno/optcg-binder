import type { BinderPage, BinderTemplate } from "@/lib/types";

type ArtRegionPlacementCheck = {
  page: BinderPage;
  template: BinderTemplate;
  originRow: number;
  originCol: number;
  rowSpan: number;
  colSpan: number;
  ignoreRegionId?: string;
};

function regionContainsSlot(
  regionOriginRow: number,
  regionOriginCol: number,
  regionRowSpan: number,
  regionColSpan: number,
  row: number,
  col: number,
) {
  return (
    row >= regionOriginRow &&
    row < regionOriginRow + regionRowSpan &&
    col >= regionOriginCol &&
    col < regionOriginCol + regionColSpan
  );
}

export function canPlaceArtRegion({
  page,
  template,
  originRow,
  originCol,
  rowSpan,
  colSpan,
  ignoreRegionId,
}: ArtRegionPlacementCheck) {
  if (originRow + rowSpan > template.rows || originCol + colSpan > template.cols) {
    return false;
  }

  for (let row = originRow; row < originRow + rowSpan; row += 1) {
    for (let col = originCol; col < originCol + colSpan; col += 1) {
      const slotId = `${row}-${col}`;
      if (page.placements[slotId]) {
        return false;
      }

      const overlappingRegion = page.artRegions.find(
        (region) =>
          region.id !== ignoreRegionId &&
          regionContainsSlot(
            region.originRow,
            region.originCol,
            region.rowSpan,
            region.colSpan,
            row,
            col,
          ),
      );

      if (overlappingRegion) {
        return false;
      }
    }
  }

  return true;
}
