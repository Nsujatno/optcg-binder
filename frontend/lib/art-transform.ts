import type { ArtTransform, FitMode } from "@/lib/types";

/**
 * The single source of truth for how a Michi image sits inside its region box.
 *
 * Every renderer -- the crop modal preview, the on-canvas art layer, and the PNG
 * exporter -- derives its geometry from `computeArtDraw` here. Before this module
 * existed each of the three did its own arithmetic and they disagreed once zoom
 * left 1.0, so exported images did not match what the user had positioned.
 *
 * Coordinate systems, since three of them are in play:
 *
 *   box space    pixels within the region box, origin at its top-left
 *   image-local  box space rotated by -rotation, origin at the image center,
 *                with the horizontal flip already applied
 *   source       pixels of the original asset
 *
 * The transform stores `crop` as a focal point in normalized source space: the
 * source pixel at (crop.x * width, crop.y * height) is placed at the center of
 * the box. That survives changes to the region's span, which raw pixel offsets
 * would not.
 *
 * Internally the math runs on `v`, the vector from the image center to the focal
 * point expressed in image-local space. `v` is what the clamp acts on, and it
 * converts to and from `crop` by a scale factor.
 */

export type Size = { width: number; height: number };

export type ArtDraw = {
  /** Center of the drawn image, in box space. */
  centerX: number;
  centerY: number;
  /** Size of the drawn image before rotation. */
  drawW: number;
  drawH: number;
  rotationRad: number;
  flipH: boolean;
};

export const MAX_ZOOM = 8;
export const MIN_ZOOM_FILL = 1;
export const MIN_ZOOM_CONTAIN = 0.05;

export const DEFAULT_ART_TRANSFORM: ArtTransform = {
  crop: { x: 0.5, y: 0.5 },
  zoom: 1,
  rotation: 0,
  flipH: false,
};

export function minZoomFor(fitMode: FitMode) {
  return fitMode === "fill" ? MIN_ZOOM_FILL : MIN_ZOOM_CONTAIN;
}

export function clampZoom(zoom: number, fitMode: FitMode) {
  return Math.min(MAX_ZOOM, Math.max(minZoomFor(fitMode), zoom));
}

function toRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

/** Axis-aligned bounds of a width x height rectangle rotated by `rad`. */
function rotatedBounds(width: number, height: number, rad: number) {
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: width * cos + height * sin,
    height: width * sin + height * cos,
  };
}

/**
 * Scale at which the rotated asset exactly covers the box. This is the reference
 * frame for `zoom`, in both fit modes -- `fitMode` only decides whether the crop
 * is clamped, so that toggling it never makes the image jump.
 *
 * Note this measures the *box* rotated into image space, not the image rotated
 * into box space. A rotated image whose bounding box covers the box still leaves
 * triangular gaps at the corners, so the two are not interchangeable. The
 * consequence is that rotating in "fill" mode zooms in a little to stay covered,
 * which is what a straighten tool is expected to do.
 */
export function coverScale(asset: Size, boxW: number, boxH: number, rotation: number) {
  if (asset.width <= 0 || asset.height <= 0) {
    return 1;
  }
  const bounds = rotatedBounds(boxW, boxH, toRad(rotation));
  return Math.max(bounds.width / asset.width, bounds.height / asset.height);
}

/**
 * The `zoom` value at which the whole asset fits inside the box. Below
 * `MIN_ZOOM_FILL` by definition, so it is only reachable in "contain" mode --
 * this backs the "fit whole image" control.
 */
export function containZoom(asset: Size, boxW: number, boxH: number, rotation: number) {
  const bounds = rotatedBounds(asset.width, asset.height, toRad(rotation));
  const base = coverScale(asset, boxW, boxH, rotation);
  if (bounds.width <= 0 || bounds.height <= 0 || base <= 0) {
    return 1;
  }
  // Containment is the image's own rotated bounds fitting inside the box -- the
  // mirror image of the measurement `coverScale` makes.
  const contain = Math.min(boxW / bounds.width, boxH / bounds.height);
  return contain / base;
}

function drawScale(transform: ArtTransform, asset: Size, boxW: number, boxH: number) {
  return coverScale(asset, boxW, boxH, transform.rotation) * transform.zoom;
}

/** Focal point -> image-local offset from the image center. */
function cropToVector(transform: ArtTransform, asset: Size, scale: number) {
  const flipSign = transform.flipH ? -1 : 1;
  return {
    x: (transform.crop.x - 0.5) * asset.width * scale * flipSign,
    y: (transform.crop.y - 0.5) * asset.height * scale,
  };
}

/** Image-local offset from the image center -> focal point. */
function vectorToCrop(
  vector: { x: number; y: number },
  transform: ArtTransform,
  asset: Size,
  scale: number,
) {
  const flipSign = transform.flipH ? -1 : 1;
  const spanX = asset.width * scale * flipSign;
  const spanY = asset.height * scale;
  return {
    x: spanX === 0 ? 0.5 : 0.5 + vector.x / spanX,
    y: spanY === 0 ? 0.5 : 0.5 + vector.y / spanY,
  };
}

/**
 * Narrow to exactly the transform fields.
 *
 * Callers pass richer objects than `ArtTransform` (the crop modal hands over its
 * whole draft), so returning `{ ...transform }` would smuggle caller fields such
 * as `rowSpan` back out. Spreading that over a freshly-updated draft silently
 * reverts the update, so every exported function returns only these four keys.
 */
function toTransform(transform: ArtTransform): ArtTransform {
  return {
    crop: transform.crop,
    zoom: transform.zoom,
    rotation: transform.rotation,
    flipH: transform.flipH,
  };
}

function rotate(vector: { x: number; y: number }, rad: number) {
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

/**
 * Resolve a transform into concrete geometry. Both renderers consume this
 * identically, which is what keeps the preview and the export in agreement:
 *
 *   DOM     an <img> sized drawW x drawH, positioned at center - size/2, with
 *           `transform: rotate(rad) scaleX(flip)` about its center
 *   canvas  translate(center) -> rotate(rad) -> scale(flip, 1) ->
 *           drawImage(img, -drawW/2, -drawH/2, drawW, drawH)
 */
export function computeArtDraw(
  transform: ArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
): ArtDraw {
  const rotationRad = toRad(transform.rotation);
  const scale = drawScale(transform, asset, boxW, boxH);
  const vector = cropToVector(transform, asset, scale);

  // The image center sits wherever it must for the focal point to land on the
  // box center, so we walk back from the box center along the rotated offset.
  const offset = rotate(vector, rotationRad);

  return {
    centerX: boxW / 2 - offset.x,
    centerY: boxH / 2 - offset.y,
    drawW: asset.width * scale,
    drawH: asset.height * scale,
    rotationRad,
    flipH: transform.flipH,
  };
}

/**
 * Pull the focal point back until the image still covers the box.
 *
 * The test runs in image-local space, where the image is an axis-aligned
 * drawW x drawH rectangle centered at the origin and the box -- rotated by
 * -rotation -- has half-extents `boxHalf`. The four box corners stay inside the
 * image exactly when |v| <= drawSize/2 - boxHalf on each axis, so the bound is
 * tight rather than conservative.
 *
 * A no-op in "contain" mode, where letterboxing is the point.
 */
export function clampCrop(
  transform: ArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
  fitMode: FitMode,
): ArtTransform {
  if (fitMode !== "fill") {
    return toTransform(transform);
  }

  const rotationRad = toRad(transform.rotation);
  const scale = drawScale(transform, asset, boxW, boxH);
  const vector = cropToVector(transform, asset, scale);

  const boxHalf = rotatedBounds(boxW, boxH, -rotationRad);
  const limitX = Math.max(0, (asset.width * scale - boxHalf.width) / 2);
  const limitY = Math.max(0, (asset.height * scale - boxHalf.height) / 2);

  const clamped = {
    x: Math.min(limitX, Math.max(-limitX, vector.x)),
    y: Math.min(limitY, Math.max(-limitY, vector.y)),
  };

  return {
    ...toTransform(transform),
    crop: vectorToCrop(clamped, transform, asset, scale),
  };
}

/** Drag the image by a pixel delta in box space. */
export function panBy(
  transform: ArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
  fitMode: FitMode,
  dx: number,
  dy: number,
): ArtTransform {
  const rotationRad = toRad(transform.rotation);
  const scale = drawScale(transform, asset, boxW, boxH);
  const vector = cropToVector(transform, asset, scale);

  // Moving the image right by dx moves the focal point left relative to it.
  const delta = rotate({ x: dx, y: dy }, -rotationRad);
  const next = { x: vector.x - delta.x, y: vector.y - delta.y };

  return clampCrop(
    { ...transform, crop: vectorToCrop(next, transform, asset, scale) },
    asset,
    boxW,
    boxH,
    fitMode,
  );
}

/**
 * Zoom while holding the source pixel under (pointerX, pointerY) in place --
 * the behavior every map and image editor has trained users to expect. Pass the
 * box center to zoom neutrally, as the zoom slider does.
 */
export function zoomAt(
  transform: ArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
  fitMode: FitMode,
  nextZoom: number,
  pointerX: number,
  pointerY: number,
): ArtTransform {
  const zoom = clampZoom(nextZoom, fitMode);
  if (transform.zoom <= 0) {
    return clampCrop({ ...transform, zoom }, asset, boxW, boxH, fitMode);
  }

  const rotationRad = toRad(transform.rotation);
  const scale = drawScale(transform, asset, boxW, boxH);
  const vector = cropToVector(transform, asset, scale);

  // Pointer position in image-local space, relative to the focal point.
  const pointer = rotate(
    { x: pointerX - boxW / 2, y: pointerY - boxH / 2 },
    -rotationRad,
  );

  // The pointer's offset from the image center scales with the zoom; solve for
  // the focal offset that leaves the pointer over the same source pixel.
  const ratio = zoom / transform.zoom;
  const next = {
    x: (pointer.x + vector.x) * ratio - pointer.x,
    y: (pointer.y + vector.y) * ratio - pointer.y,
  };

  const nextScale = drawScale({ ...transform, zoom }, asset, boxW, boxH);
  return clampCrop(
    { ...transform, zoom, crop: vectorToCrop(next, transform, asset, nextScale) },
    asset,
    boxW,
    boxH,
    fitMode,
  );
}

/** Rotate about the box center, keeping the focal point put. */
export function rotateTo(
  transform: ArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
  fitMode: FitMode,
  rotation: number,
): ArtTransform {
  return clampCrop({ ...transform, rotation }, asset, boxW, boxH, fitMode);
}

export type LegacyArtTransform = {
  cropX: number;
  cropY: number;
  zoom: number;
};

/**
 * Convert a pre-overhaul region to the current model.
 *
 * The old renderer was `object-fit: cover|contain` plus
 * `transform: translate(cropX%, cropY%) scale(zoom)`. Because `translate` is the
 * outer function there, the offset was a straight percentage of the box and was
 * *not* multiplied by the zoom -- so that is what we reproduce here, and it is
 * also the bug the exporter had (it multiplied by zoom, drifting from what the
 * user saw). Reproducing the CSS keeps saved binders looking as they did on
 * screen, which is the version the user actually chose.
 */
export function migrateArtTransform(
  legacy: LegacyArtTransform,
  asset: Size,
  boxW: number,
  boxH: number,
  fitMode: FitMode,
): ArtTransform {
  const base = coverScale(asset, boxW, boxH, 0);
  const fitScale =
    fitMode === "fill" ? base : base * containZoom(asset, boxW, boxH, 0);
  const scale = fitScale * legacy.zoom;

  const transform: ArtTransform = {
    crop: { x: 0.5, y: 0.5 },
    zoom: base === 0 ? 1 : scale / base,
    rotation: 0,
    flipH: false,
  };

  // Old offset of the image center from the box center, in box pixels. With no
  // rotation or flip, the focal offset is simply its negation.
  const vector = {
    x: -((legacy.cropX / 100) * boxW),
    y: -((legacy.cropY / 100) * boxH),
  };

  return clampCrop(
    { ...transform, crop: vectorToCrop(vector, transform, asset, scale) },
    asset,
    boxW,
    boxH,
    fitMode,
  );
}
