"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import type { ThemeConfig } from "@/lib/types";

const THEME_SWATCHES_STORAGE_KEY = "one-piece-binder.theme-swatches.v1";
const MAX_SAVED_SWATCHES = 8;
const WHEEL_SIZE = 280;

type ThemeColorKey = keyof Pick<
  ThemeConfig,
  "binderBackground" | "pageBackground" | "slotAccent"
>;

type SavedSwatches = Partial<Record<ThemeColorKey, string[]>>;

type HsvColor = {
  h: number;
  s: number;
  v: number;
};

type ThemeColorControlProps = {
  label: string;
  themeKey: ThemeColorKey;
  value: string;
  presetColors: string[];
  onChange: (color: string) => void;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(value: string) {
  const cleaned = value.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(cleaned)) {
    return `#${cleaned}`;
  }

  return null;
}

function loadSavedSwatches(): SavedSwatches {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(THEME_SWATCHES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSwatches) : {};
  } catch {
    return {};
  }
}

function persistSavedSwatches(swatches: SavedSwatches) {
  window.localStorage.setItem(THEME_SWATCHES_STORAGE_KEY, JSON.stringify(swatches));
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return null;
  }

  const raw = normalized.slice(1);
  return {
    r: Number.parseInt(raw.slice(0, 2), 16),
    g: Number.parseInt(raw.slice(2, 4), 16),
    b: Number.parseInt(raw.slice(4, 6), 16),
  };
}

function hsvToRgb(hsv: HsvColor) {
  const h = ((hsv.h % 360) + 360) % 360;
  const s = clamp(hsv.s, 0, 1);
  const v = clamp(hsv.v, 0, 1);
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (h < 300) {
    rPrime = x;
    bPrime = c;
  } else {
    rPrime = c;
    bPrime = x;
  }

  return {
    r: (rPrime + m) * 255,
    g: (gPrime + m) * 255,
    b: (bPrime + m) * 255,
  };
}

function hsvToHex(hsv: HsvColor) {
  const rgb = hsvToRgb(hsv);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hexToHsv(hex: string): HsvColor {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return { h: 0, s: 0, v: 0 };
  }

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

function wheelCoordinatesFromHsv(hsv: HsvColor) {
  const angle = (hsv.h * Math.PI) / 180;
  const radius = hsv.s * (WHEEL_SIZE / 2);

  return {
    x: WHEEL_SIZE / 2 + Math.cos(angle) * radius,
    y: WHEEL_SIZE / 2 + Math.sin(angle) * radius,
  };
}

export function ThemeColorControl({
  label,
  themeKey,
  value,
  presetColors,
  onChange,
}: ThemeColorControlProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [customColor, setCustomColor] = useState(value);
  const [savedColors, setSavedColors] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftHsv, setDraftHsv] = useState<HsvColor>(() => hexToHsv(value));
  const [draftText, setDraftText] = useState(value);
  const draftHex = useMemo(() => hsvToHex(draftHsv), [draftHsv]);
  const selectorPosition = useMemo(() => wheelCoordinatesFromHsv(draftHsv), [draftHsv]);
  const visibleSavedColors = useMemo(
    () => savedColors.filter((color) => !presetColors.includes(color)),
    [presetColors, savedColors],
  );

  useEffect(() => {
    setCustomColor(value);
    setDraftHsv(hexToHsv(value));
    setDraftText(value);
  }, [value]);

  useEffect(() => {
    const swatches = loadSavedSwatches();
    setSavedColors(swatches[themeKey] ?? []);
  }, [themeKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pickerOpen) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const radius = WHEEL_SIZE / 2;
    const image = context.createImageData(WHEEL_SIZE, WHEEL_SIZE);

    for (let y = 0; y < WHEEL_SIZE; y += 1) {
      for (let x = 0; x < WHEEL_SIZE; x += 1) {
        const dx = x - radius;
        const dy = y - radius;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const pixelIndex = (y * WHEEL_SIZE + x) * 4;

        if (distance > radius) {
          image.data[pixelIndex + 3] = 0;
          continue;
        }

        const saturation = distance / radius;
        const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const rgb = hsvToRgb({
          h: hue,
          s: saturation,
          v: draftHsv.v,
        });

        image.data[pixelIndex] = clamp(rgb.r, 0, 255);
        image.data[pixelIndex + 1] = clamp(rgb.g, 0, 255);
        image.data[pixelIndex + 2] = clamp(rgb.b, 0, 255);
        image.data[pixelIndex + 3] = 255;
      }
    }

    context.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    context.putImageData(image, 0, 0);
  }, [draftHsv.v, pickerOpen]);

  function handleCustomColorChange(nextColor: string) {
    const normalized = normalizeHexColor(nextColor);
    if (!normalized) {
      return;
    }

    setCustomColor(normalized);
    onChange(normalized);
  }

  function saveColor(color: string) {
    const normalized = normalizeHexColor(color);
    if (!normalized) {
      return;
    }

    const swatches = loadSavedSwatches();
    const nextSavedColors = [
      normalized,
      ...(swatches[themeKey] ?? []).filter((entry) => entry !== normalized),
    ].slice(0, MAX_SAVED_SWATCHES);

    persistSavedSwatches({
      ...swatches,
      [themeKey]: nextSavedColors,
    });
    setSavedColors(nextSavedColors);
  }

  function openPicker() {
    setDraftHsv(hexToHsv(customColor));
    setDraftText(customColor);
    setPickerOpen(true);
  }

  function applyDraftColor() {
    handleCustomColorChange(draftHex);
    setDraftText(draftHex);
    setPickerOpen(false);
  }

  function saveDraftColor() {
    handleCustomColorChange(draftHex);
    saveColor(draftHex);
    setDraftText(draftHex);
    setPickerOpen(false);
  }

  function updateWheelFromPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), radius);

    setDraftHsv((current) => ({
      ...current,
      h: ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360,
      s: clamp(distance / radius, 0, 1),
    }));
  }

  function startWheelDrag(event: ReactPointerEvent<HTMLCanvasElement>) {
    event.preventDefault();
    updateWheelFromPoint(event.clientX, event.clientY);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragWheel(event: ReactPointerEvent<HTMLCanvasElement>) {
    if ((event.buttons & 1) !== 1) {
      return;
    }

    updateWheelFromPoint(event.clientX, event.clientY);
  }

  const modal = pickerOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur">
      <div className="w-full max-w-5xl rounded-[36px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-3xl font-semibold tracking-tight text-white">{label}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Drag across the wheel to pick the color, then fine-tune brightness below.
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
            onClick={() => setPickerOpen(false)}
            type="button"
          >
            Cancel
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
            <div className="mx-auto flex w-full max-w-[360px] flex-col items-center gap-5">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  className="cursor-crosshair rounded-full border border-white/10 shadow-[0_12px_30px_rgba(0,0,0,0.25)]"
                  height={WHEEL_SIZE}
                  onPointerDown={startWheelDrag}
                  onPointerMove={dragWheel}
                  width={WHEEL_SIZE}
                />
                <div
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_2px_rgba(2,6,24,0.7)]"
                  style={{
                    left: `${selectorPosition.x}px`,
                    top: `${selectorPosition.y}px`,
                    backgroundColor: draftHex,
                  }}
                />
              </div>

              <div className="w-full">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
                  <span>Brightness</span>
                  <span>{Math.round(draftHsv.v * 100)}%</span>
                </div>
                <input
                  className="w-full accent-cyan-300"
                  max={1}
                  min={0}
                  onChange={(event) =>
                    setDraftHsv((current) => ({
                      ...current,
                      v: Number.parseFloat(event.target.value),
                    }))
                  }
                  step={0.01}
                  type="range"
                  value={draftHsv.v}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="h-32 rounded-[28px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
              style={{ backgroundColor: draftHex }}
            />

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                Hex
              </div>
              <input
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setDraftText(nextValue);
                  const normalized = normalizeHexColor(nextValue);
                  if (normalized) {
                    setDraftHsv(hexToHsv(normalized));
                  }
                }}
                placeholder="#9d31c8"
                value={draftText}
              />
              {!normalizeHexColor(draftText) ? (
                <p className="mt-2 text-xs text-amber-200">
                  Enter a full 6-digit hex color.
                </p>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-500">
                Recent colours
              </div>
              <div className="flex flex-wrap gap-3">
                {[...presetColors, ...visibleSavedColors].slice(0, 14).map((color) => (
                  <button
                    key={color}
                    className={`h-10 w-10 rounded-full border transition ${
                      draftHex === color
                        ? "border-cyan-300 ring-2 ring-cyan-300"
                        : "border-white/15"
                    }`}
                    onClick={() => {
                      setDraftHsv(hexToHsv(color));
                      setDraftText(color);
                    }}
                    style={{ backgroundColor: color }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950"
                onClick={applyDraftColor}
                type="button"
              >
                Apply color
              </button>
              <button
                className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-200"
                onClick={saveDraftColor}
                type="button"
              >
                Save swatch
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-200">{label}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{value}</p>
          </div>
          <button
            className="h-11 w-11 rounded-full border border-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
            onClick={openPicker}
            style={{ backgroundColor: customColor }}
            type="button"
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              className={`h-9 w-9 rounded-full border transition ${
                value === color
                  ? "border-cyan-300 ring-2 ring-cyan-300"
                  : "border-white/15"
              }`}
              onClick={() => onChange(color)}
              style={{ backgroundColor: color }}
              title={color}
              type="button"
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-slate-200"
            onClick={openPicker}
            type="button"
          >
            Pick custom
          </button>
          <button
            className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200"
            onClick={() => saveColor(customColor)}
            type="button"
          >
            Save swatch
          </button>
        </div>

        {visibleSavedColors.length ? (
          <div className="mt-4">
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-slate-500">
              Saved
            </p>
            <div className="flex flex-wrap gap-2">
              {visibleSavedColors.map((color) => (
                <button
                  key={color}
                  className={`h-9 w-9 rounded-full border transition ${
                    value === color
                      ? "border-cyan-300 ring-2 ring-cyan-300"
                      : "border-white/15"
                  }`}
                  onClick={() => onChange(color)}
                  style={{ backgroundColor: color }}
                  title={color}
                  type="button"
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {typeof document !== "undefined" ? createPortal(modal, document.body) : null}
    </>
  );
}
