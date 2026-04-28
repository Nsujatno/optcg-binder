import type {
  ArtRegion,
  BinderLayout,
  BinderPage,
  BinderTemplate,
  BinderTemplateId,
  CardRecord,
  FitMode,
  UploadedAsset,
} from "@/lib/types";
import { BINDER_TEMPLATES, DEFAULT_THEME } from "@/lib/types";

export const STORAGE_KEY = "one-piece-binder.layouts.v1";
export const CARD_SLOT_WIDTH = 206;
export const CARD_SLOT_HEIGHT = 288;
export const PAGE_GRID_GAP = 12;
export const PAGE_PADDING = 16;

export const BINDER_BACKGROUNDS = [
  "#111111",
  "#2f2f2f",
  "#d1d5db",
  "#ffffff",
  "#f5efe2",
];
export const PAGE_BACKGROUNDS = [
  "#111111",
  "#2f2f2f",
  "#d1d5db",
  "#ffffff",
  "#f5efe2",
];
export const SLOT_ACCENTS = ["#1f2937", "#7c3aed", "#2563eb", "#b45309", "#dc2626"];

export type PersistedState = {
  layouts: BinderLayout[];
  activeLayoutId: string;
  cardSnapshots?: CardRecord[];
};

export type CropDraft = {
  asset: UploadedAsset;
  rowSpan: number;
  colSpan: number;
  cropX: number;
  cropY: number;
  zoom: number;
  fitMode: FitMode;
  editingRegionId?: string;
};

export type TemplateResizeValidation = {
  canApply: boolean;
  cardCount: number;
  templateCapacity: number;
  hasTooManyCards: boolean;
  hasOutOfBoundsArt: boolean;
  reason: string | null;
};

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getTemplate(templateId: BinderTemplateId): BinderTemplate {
  return (
    BINDER_TEMPLATES.find((template) => template.id === templateId) ??
    BINDER_TEMPLATES[2]
  );
}

export function createPage(): BinderPage {
  return {
    id: createId("page"),
    placements: {},
    artRegions: [],
  };
}

export function createLayout(
  name = "Starter Binder",
  templateId: BinderTemplateId = "3x3",
): BinderLayout {
  const timestamp = new Date().toISOString();
  return {
    id: createId("layout"),
    name,
    templateId,
    theme: DEFAULT_THEME,
    assets: [],
    pages: [createPage()],
    createdAt: timestamp,
    updatedAt: timestamp,
    schemaVersion: 1,
  };
}

export function sanitizePageForTemplate(
  page: BinderPage,
  template: BinderTemplate,
): BinderPage {
  const placedCardIds = getOrderedPlacementIds(page);
  const placements = Object.fromEntries(
    getTemplateSlotIds(template).slice(0, placedCardIds.length).map((slotId, index) => [
      slotId,
      placedCardIds[index],
    ]),
  );

  return {
    ...page,
    placements,
  };
}

export function getTemplateSlotIds(template: BinderTemplate) {
  const slotIds: string[] = [];
  for (let row = 0; row < template.rows; row += 1) {
    for (let col = 0; col < template.cols; col += 1) {
      slotIds.push(slotKey(row, col));
    }
  }
  return slotIds;
}

export function getOrderedPlacementIds(page: BinderPage) {
  return Object.entries(page.placements)
    .sort(([leftSlotId], [rightSlotId]) => compareSlotIds(leftSlotId, rightSlotId))
    .map(([, placementId]) => placementId);
}

export function doesArtRegionFitTemplate(region: ArtRegion, template: BinderTemplate) {
  return (
    region.originRow + region.rowSpan <= template.rows &&
    region.originCol + region.colSpan <= template.cols
  );
}

export function validatePageForTemplate(
  page: BinderPage,
  template: BinderTemplate,
): TemplateResizeValidation {
  const cardCount = Object.keys(page.placements).length;
  const templateCapacity = template.rows * template.cols;
  const hasTooManyCards = cardCount > templateCapacity;
  const hasOutOfBoundsArt = page.artRegions.some(
    (region) => !doesArtRegionFitTemplate(region, template),
  );

  if (hasTooManyCards) {
    return {
      canApply: false,
      cardCount,
      templateCapacity,
      hasTooManyCards,
      hasOutOfBoundsArt,
      reason: `${cardCount} cards exceed ${templateCapacity} slots.`,
    };
  }

  if (hasOutOfBoundsArt) {
    return {
      canApply: false,
      cardCount,
      templateCapacity,
      hasTooManyCards,
      hasOutOfBoundsArt,
      reason: "A Meechi art region would fall outside the page bounds.",
    };
  }

  return {
    canApply: true,
    cardCount,
    templateCapacity,
    hasTooManyCards,
    hasOutOfBoundsArt,
    reason: null,
  };
}

function compareSlotIds(leftSlotId: string, rightSlotId: string) {
  const [leftRow = "0", leftCol = "0"] = leftSlotId.split("-");
  const [rightRow = "0", rightCol = "0"] = rightSlotId.split("-");
  const leftRowNumber = Number.parseInt(leftRow, 10);
  const rightRowNumber = Number.parseInt(rightRow, 10);

  if (leftRowNumber !== rightRowNumber) {
    return leftRowNumber - rightRowNumber;
  }

  return Number.parseInt(leftCol, 10) - Number.parseInt(rightCol, 10);
}

export function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    const layout = createLayout();
    return { layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const layout = createLayout();
      return { layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] };
    }

    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.layouts?.length || !parsed.activeLayoutId) {
      const layout = createLayout();
      return { layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] };
    }

    return {
      ...parsed,
      layouts: parsed.layouts.map((layout) => ({
        ...layout,
        theme: {
          ...layout.theme,
          emptySlotStyle: "glass",
        },
      })),
      cardSnapshots: parsed.cardSnapshots ?? [],
    };
  } catch {
    const layout = createLayout();
    return { layouts: [layout], activeLayoutId: layout.id, cardSnapshots: [] };
  }
}

export function getPlacementIdsForLayouts(layouts: BinderLayout[]) {
  return Array.from(
    new Set(
      layouts.flatMap((layout) =>
        layout.pages.flatMap((page) => Object.values(page.placements)),
      ),
    ),
  );
}

export function slotKey(row: number, col: number) {
  return `${row}-${col}`;
}

export function slotLabel(row: number, col: number) {
  return `Row ${row + 1}, Col ${col + 1}`;
}

export function getSlotsCovered(region: ArtRegion) {
  const slots: string[] = [];
  for (let row = region.originRow; row < region.originRow + region.rowSpan; row += 1) {
    for (let col = region.originCol; col < region.originCol + region.colSpan; col += 1) {
      slots.push(slotKey(row, col));
    }
  }
  return slots;
}

export function regionContainsSlot(region: ArtRegion, row: number, col: number) {
  return (
    row >= region.originRow &&
    row < region.originRow + region.rowSpan &&
    col >= region.originCol &&
    col < region.originCol + region.colSpan
  );
}

export function formatPrice(price: number | null) {
  if (price == null || Number.isNaN(price)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(price);
}

export function matchesCardPlacementId(card: CardRecord, placementId: string | undefined) {
  if (!placementId) {
    return false;
  }

  return card.id === placementId || card.cardSetId === placementId;
}

export async function fileToAsset(file: File): Promise<UploadedAsset> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const dimensions = await new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      const image = new Image();
      image.onload = () =>
        resolve({
          width: image.width,
          height: image.height,
        });
      image.onerror = () => reject(new Error("Failed to read image dimensions"));
      image.src = src;
    },
  );

  return {
    id: createId("asset"),
    name: file.name,
    src,
    width: dimensions.width,
    height: dimensions.height,
  };
}
