import { computeArtDraw } from "@/lib/art-transform";
import type { ArtTransform, UploadedAsset } from "@/lib/types";

type ArtImageProps = {
  asset: UploadedAsset;
  transform: ArtTransform;
  /** Nominal box size in page pixels; see the note on units below. */
  boxW: number;
  boxH: number;
  className?: string;
};

/**
 * Renders a Michi image inside its region box.
 *
 * Shared by the crop modal preview and the on-canvas art layer so there is only
 * one DOM implementation of the transform, and it reads from the same
 * `computeArtDraw` the PNG exporter uses.
 *
 * Geometry is emitted as percentages rather than pixels. `computeArtDraw` is
 * linear in the box size, so the same transform renders correctly whether the
 * parent is at its nominal page size or scaled down to fit a modal -- the caller
 * does not have to measure anything. The parent must be `position: relative`,
 * clip overflow, and hold the box's aspect ratio.
 */
export function ArtImage({ asset, transform, boxW, boxH, className }: ArtImageProps) {
  const draw = computeArtDraw(transform, asset, boxW, boxH);
  const percentX = (value: number) => `${(value / boxW) * 100}%`;
  const percentY = (value: number) => `${(value / boxH) * 100}%`;

  return (
    <img
      alt={asset.name}
      className={`absolute max-w-none select-none ${className ?? ""}`}
      draggable={false}
      src={asset.src}
      style={{
        left: percentX(draw.centerX - draw.drawW / 2),
        top: percentY(draw.centerY - draw.drawH / 2),
        width: percentX(draw.drawW),
        height: percentY(draw.drawH),
        transform: `rotate(${draw.rotationRad}rad)${draw.flipH ? " scaleX(-1)" : ""}`,
        transformOrigin: "center",
      }}
    />
  );
}
