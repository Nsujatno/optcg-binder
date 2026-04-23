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

export const BINDER_BACKGROUNDS = [
  "#101726",
  "#111111",
  "#334155",
  "#6b4f3f",
  "#14532d",
];
export const PAGE_BACKGROUNDS = [
  "#f7f1e3",
  "#ffffff",
  "#111827",
  "#1f2937",
  "#faf5ff",
];
export const SLOT_ACCENTS = ["#1f2937", "#7c3aed", "#2563eb", "#b45309", "#dc2626"];

export type PersistedState = {
  layouts: BinderLayout[];
  activeLayoutId: string;
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
  const allowedSlots = new Set<string>();
  for (let row = 0; row < template.rows; row += 1) {
    for (let col = 0; col < template.cols; col += 1) {
      allowedSlots.add(`${row}-${col}`);
    }
  }

  const placements = Object.fromEntries(
    Object.entries(page.placements).filter(([slotId]) => allowedSlots.has(slotId)),
  );

  const artRegions = page.artRegions.filter(
    (region) =>
      region.originRow + region.rowSpan <= template.rows &&
      region.originCol + region.colSpan <= template.cols,
  );

  return {
    ...page,
    placements,
    artRegions,
  };
}

export function loadPersistedState(): PersistedState {
  if (typeof window === "undefined") {
    const layout = createLayout();
    return { layouts: [layout], activeLayoutId: layout.id };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const layout = createLayout();
      return { layouts: [layout], activeLayoutId: layout.id };
    }

    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed.layouts?.length || !parsed.activeLayoutId) {
      const layout = createLayout();
      return { layouts: [layout], activeLayoutId: layout.id };
    }

    return parsed;
  } catch {
    const layout = createLayout();
    return { layouts: [layout], activeLayoutId: layout.id };
  }
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
