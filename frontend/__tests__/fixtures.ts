import {
  DEFAULT_THEME,
  type ArtRegion,
  type BinderLayout,
  type BinderPage,
  type CardRecord,
  type UploadedAsset,
} from "@/lib/types";

export function makeCard(id: string, overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    setId: "op01",
    setName: "Romance Dawn",
    cardSetId: id.toUpperCase(),
    name: `Card ${id}`,
    imageUrl: `https://example.com/${id}.png`,
    marketPrice: 12.5,
    rarity: "SR",
    color: "Red",
    type: "Character",
    cost: "5",
    power: "6000",
    life: null,
    counter: 1000,
    attribute: "Strike",
    subTypes: ["Straw Hat Crew"],
    text: "Sample card text",
    scrapedAt: null,
    ...overrides,
  };
}

export function makeAsset(id = "asset-1", overrides: Partial<UploadedAsset> = {}): UploadedAsset {
  return {
    id,
    name: `${id}.png`,
    src: `data:image/png;base64,${id}`,
    width: 1000,
    height: 800,
    ...overrides,
  };
}

export function makeArtRegion(overrides: Partial<ArtRegion> = {}): ArtRegion {
  return {
    id: "art-1",
    assetId: "asset-1",
    originRow: 0,
    originCol: 0,
    rowSpan: 1,
    colSpan: 1,
    crop: { x: 0.5, y: 0.5 },
    zoom: 1,
    rotation: 0,
    flipH: false,
    fitMode: "fill",
    locked: true,
    ...overrides,
  };
}

export function makePage(id = "page-1", overrides: Partial<BinderPage> = {}): BinderPage {
  return {
    id,
    placements: {},
    artRegions: [],
    ...overrides,
  };
}

export function makeLayout(overrides: Partial<BinderLayout> = {}): BinderLayout {
  return {
    id: "layout-1",
    name: "Test Binder",
    templateId: "3x3",
    theme: { ...DEFAULT_THEME },
    assets: [],
    pages: [makePage()],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    schemaVersion: 1,
    ...overrides,
  };
}
