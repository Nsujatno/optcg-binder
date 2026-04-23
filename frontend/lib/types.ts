export type BinderTemplateId = "1x1" | "2x2" | "3x3" | "4x4";

export type FitMode = "fill" | "contain";

export type EmptySlotStyle = "solid" | "dashed" | "glass";

export type CardRecord = {
  id: string;
  setId: string;
  setName: string;
  cardSetId: string;
  name: string;
  imageUrl: string;
  marketPrice: number | null;
  rarity: string;
  color: string;
  type: string;
  cost: string | null;
  power: string | null;
  life: string | null;
  counter: number | null;
  attribute: string | null;
  subTypes: string[];
  text: string;
  scrapedAt: string | null;
};

export type SetRecord = {
  id: string;
  name: string;
  code: string;
  cardCount: number;
};

export type ThemeConfig = {
  binderBackground: string;
  pageBackground: string;
  slotAccent: string;
  emptySlotStyle: EmptySlotStyle;
};

export type UploadedAsset = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
};

export type ArtRegion = {
  id: string;
  assetId: string;
  originRow: number;
  originCol: number;
  rowSpan: number;
  colSpan: number;
  cropX: number;
  cropY: number;
  zoom: number;
  fitMode: FitMode;
  locked: boolean;
};

export type BinderPage = {
  id: string;
  placements: Record<string, string>;
  artRegions: ArtRegion[];
};

export type BinderLayout = {
  id: string;
  name: string;
  templateId: BinderTemplateId;
  theme: ThemeConfig;
  assets: UploadedAsset[];
  pages: BinderPage[];
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
};

export type BinderTemplate = {
  id: BinderTemplateId;
  name: string;
  rows: number;
  cols: number;
};

export const BINDER_TEMPLATES: BinderTemplate[] = [
  { id: "1x1", name: "1 x 1", rows: 1, cols: 1 },
  { id: "2x2", name: "2 x 2", rows: 2, cols: 2 },
  { id: "3x3", name: "3 x 3", rows: 3, cols: 3 },
  { id: "4x4", name: "4 x 4", rows: 4, cols: 4 },
];

export const DEFAULT_THEME: ThemeConfig = {
  binderBackground: "#101726",
  pageBackground: "#f7f1e3",
  slotAccent: "#1f2937",
  emptySlotStyle: "glass",
};
