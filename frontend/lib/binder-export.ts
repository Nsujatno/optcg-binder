"use client";

import type { BinderLayout, BinderPage, CardRecord } from "@/lib/types";
import { API_BASE_URL } from "@/lib/api-client";
import { DEFAULT_THEME } from "@/lib/types";
import {
  CARD_SLOT_HEIGHT,
  CARD_SLOT_WIDTH,
  getSlotsCovered,
  getTemplate,
  matchesCardPlacementId,
  PAGE_GRID_GAP,
  PAGE_PADDING,
  slotKey,
} from "@/lib/planner";

export type DownloadScope = "current-page" | "current-binder" | "all-binders";

type DownloadBinderImagesArgs = {
  layouts: BinderLayout[];
  activeLayoutId: string;
  activePageIndex: number;
  cards: CardRecord[];
  scope: DownloadScope;
};

const SLOT_RADIUS = 15;
const REGION_RADIUS = 24;

export async function downloadBinderImages({
  layouts,
  activeLayoutId,
  activePageIndex,
  cards,
  scope,
}: DownloadBinderImagesArgs) {
  const activeLayout = layouts.find((layout) => layout.id === activeLayoutId) ?? null;
  if (!activeLayout) {
    throw new Error("No active binder is available to download.");
  }

  const targets =
    scope === "current-page"
      ? [{ layout: activeLayout, page: activeLayout.pages[activePageIndex], pageIndex: activePageIndex }]
      : scope === "current-binder"
        ? activeLayout.pages.map((page, pageIndex) => ({ layout: activeLayout, page, pageIndex }))
        : layouts.flatMap((layout) =>
            layout.pages.map((page, pageIndex) => ({ layout, page, pageIndex })),
          );

  const imageCache = new Map<string, HTMLImageElement>();
  let downloadCount = 0;

  for (const target of targets) {
    if (!target.page) {
      continue;
    }

    const canvas = await renderBinderPage({
      layout: target.layout,
      page: target.page,
      cards,
      imageCache,
    });
    await downloadCanvas(
      canvas,
      `${slugify(target.layout.name)}-page-${target.pageIndex + 1}.png`,
    );
    downloadCount += 1;
    await pause(80);
  }

  return { downloadCount };
}

async function renderBinderPage({
  layout,
  page,
  cards,
  imageCache,
}: {
  layout: BinderLayout;
  page: BinderPage;
  cards: CardRecord[];
  imageCache: Map<string, HTMLImageElement>;
}) {
  const template = getTemplate(layout.templateId);
  const pageWidth =
    template.cols * CARD_SLOT_WIDTH +
    (template.cols - 1) * PAGE_GRID_GAP +
    PAGE_PADDING * 2;
  const pageHeight =
    template.rows * CARD_SLOT_HEIGHT +
    (template.rows - 1) * PAGE_GRID_GAP +
    PAGE_PADDING * 2;

  const canvas = document.createElement("canvas");
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create an image export.");
  }

  ctx.fillStyle = layout.theme.pageBackground ?? DEFAULT_THEME.pageBackground;
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  const occupiedByArt = new Map<string, string>();
  page.artRegions.forEach((region) => {
    getSlotsCovered(region).forEach((coveredSlot) => occupiedByArt.set(coveredSlot, region.id));
  });

  for (const region of page.artRegions) {
    const asset = layout.assets.find((item) => item.id === region.assetId);
    if (!asset) {
      continue;
    }

    const image = await loadImage(asset.src, imageCache);
    const x = PAGE_PADDING + region.originCol * (CARD_SLOT_WIDTH + PAGE_GRID_GAP);
    const y = PAGE_PADDING + region.originRow * (CARD_SLOT_HEIGHT + PAGE_GRID_GAP);
    const width = region.colSpan * CARD_SLOT_WIDTH + (region.colSpan - 1) * PAGE_GRID_GAP;
    const height = region.rowSpan * CARD_SLOT_HEIGHT + (region.rowSpan - 1) * PAGE_GRID_GAP;

    ctx.save();
    roundedRect(ctx, x, y, width, height, REGION_RADIUS);
    ctx.clip();

    const imageScale = region.fitMode === "fill"
      ? Math.max(width / image.width, height / image.height)
      : Math.min(width / image.width, height / image.height);
    const zoomScale = imageScale * region.zoom;
    const drawWidth = image.width * zoomScale;
    const drawHeight = image.height * zoomScale;
    const offsetX = ((region.cropX / 100) * width) * region.zoom;
    const offsetY = ((region.cropY / 100) * height) * region.zoom;
    const drawX = x + (width - drawWidth) / 2 + offsetX;
    const drawY = y + (height - drawHeight) / 2 + offsetY;

    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  }

  for (let row = 0; row < template.rows; row += 1) {
    for (let col = 0; col < template.cols; col += 1) {
      const currentSlotId = slotKey(row, col);
      const placementId = page.placements[currentSlotId];
      const card = cards.find((entry) => matchesCardPlacementId(entry, placementId)) ?? null;
      const x = PAGE_PADDING + col * (CARD_SLOT_WIDTH + PAGE_GRID_GAP);
      const y = PAGE_PADDING + row * (CARD_SLOT_HEIGHT + PAGE_GRID_GAP);

      ctx.save();
      roundedRect(ctx, x, y, CARD_SLOT_WIDTH, CARD_SLOT_HEIGHT, SLOT_RADIUS);
      ctx.clip();

      if (card) {
        const image = await loadImage(card.imageUrl, imageCache);
        drawCoverImage(ctx, image, x, y, CARD_SLOT_WIDTH, CARD_SLOT_HEIGHT);
      } else {
        const slotStyle = layout.theme.emptySlotStyle ?? DEFAULT_THEME.emptySlotStyle;
        ctx.fillStyle =
          occupiedByArt.has(currentSlotId)
            ? "rgba(255,255,255,0.08)"
            : slotStyle === "solid"
              ? "rgba(255,255,255,0.18)"
              : slotStyle === "dashed"
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.12)";
        ctx.fillRect(x, y, CARD_SLOT_WIDTH, CARD_SLOT_HEIGHT);
      }

      ctx.restore();
      drawSlotBorder(
        ctx,
        x,
        y,
        CARD_SLOT_WIDTH,
        CARD_SLOT_HEIGHT,
        SLOT_RADIUS,
        layout.theme.slotAccent ?? DEFAULT_THEME.slotAccent,
        !card && (layout.theme.emptySlotStyle ?? DEFAULT_THEME.emptySlotStyle) === "dashed",
      );
    }
  }

  return canvas;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function drawSlotBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  color: string,
  dashed: boolean,
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  if (dashed) {
    ctx.setLineDash([10, 8]);
  }
  roundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.restore();
}

async function loadImage(src: string, imageCache: Map<string, HTMLImageElement>) {
  const resolvedSrc = getExportImageSrc(src);
  const cached = imageCache.get(resolvedSrc);
  if (cached) {
    return cached;
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new Image();
    if (/^https?:\/\//.test(resolvedSrc)) {
      nextImage.crossOrigin = "anonymous";
    }
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () =>
      reject(
        new Error(
          "One or more images could not be loaded for export.",
        ),
      );
    nextImage.src = resolvedSrc;
  });

  imageCache.set(resolvedSrc, image);
  return image;
}

function getExportImageSrc(src: string) {
  if (/^https?:\/\//.test(src)) {
    return `${API_BASE_URL}/api/card-image?url=${encodeURIComponent(src)}`;
  }

  return src;
}

async function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }
      reject(new Error("The page image could not be generated."));
    }, "image/png");
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "binder";
}

function pause(durationMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, durationMs));
}
