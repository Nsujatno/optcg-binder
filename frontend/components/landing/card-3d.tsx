"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export interface Card3DProps {
  src: string;
  alt: string;
  cardCode: string;
  glowRgb?: string;
  isAnchor?: boolean;
  maxTilt?: number;
  standalone?: boolean;
  className?: string;
  onHoverChange?: (hovered: boolean) => void;
}

export function Card3D({
  src,
  alt,
  cardCode,
  glowRgb = "103, 232, 249",
  isAnchor = false,
  maxTilt = 16,
  standalone = false,
  className = "",
  onHoverChange,
}: Card3DProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageFailed = failedSrc === src;

  const stateRef = useRef({
    curX: 0,
    curY: 0,
    targetX: 0,
    targetY: 0,
    rafId: 0,
  });

  useEffect(() => {
    const state = stateRef.current;
    return () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
      }
    };
  }, []);

  const canTilt = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fineHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return !reduced && fineHover;
  };

  const kickLoop = () => {
    const state = stateRef.current;
    if (state.rafId) return;

    const tick = () => {
      const body = bodyRef.current;
      if (!body) {
        state.rafId = 0;
        return;
      }

      state.curX += (state.targetX - state.curX) * 0.14;
      state.curY += (state.targetY - state.curY) * 0.14;

      const rx = (-state.curY * maxTilt).toFixed(3);
      const ry = (state.curX * maxTilt).toFixed(3);
      body.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      body.style.setProperty("--nx", state.curX.toFixed(4));
      body.style.setProperty("--ny", state.curY.toFixed(4));

      const settled =
        Math.abs(state.targetX - state.curX) < 0.004 &&
        Math.abs(state.targetY - state.curY) < 0.004;

      if (settled) {
        state.curX = state.targetX;
        state.curY = state.targetY;
        body.style.transform = `rotateX(${(-state.curY * maxTilt).toFixed(3)}deg) rotateY(${(state.curX * maxTilt).toFixed(3)}deg)`;
        body.style.setProperty("--nx", state.curX.toFixed(4));
        body.style.setProperty("--ny", state.curY.toFixed(4));
        state.rafId = 0;
      } else {
        state.rafId = requestAnimationFrame(tick);
      }
    };

    state.rafId = requestAnimationFrame(tick);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch") return;
    setHovered(true);
    onHoverChange?.(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || !canTilt() || !shellRef.current) return;
    const rect = shellRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const nx = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - rect.top) / rect.height) * 2 - 1));
    stateRef.current.targetX = nx;
    stateRef.current.targetY = ny;
    kickLoop();
  };

  const handlePointerLeave = () => {
    setHovered(false);
    onHoverChange?.(false);
    stateRef.current.targetX = 0;
    stateRef.current.targetY = 0;
    kickLoop();
  };

  const style = {
    "--card-glow-rgb": glowRgb,
  } as CSSProperties;

  return (
    <div
      ref={shellRef}
      tabIndex={0}
      role="group"
      aria-label={alt}
      data-hovered={hovered ? "true" : "false"}
      data-anchor={isAnchor ? "true" : "false"}
      style={style}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onFocus={() => {
        setHovered(true);
        onHoverChange?.(true);
      }}
      onBlur={() => {
        setHovered(false);
        onHoverChange?.(false);
        stateRef.current.targetX = 0;
        stateRef.current.targetY = 0;
        kickLoop();
      }}
      className={`card-3d-shell ${standalone ? "card-3d-standalone" : ""} ${className}`}
    >
      <div className="card-3d-lift">
        <div ref={bodyRef} className="card-3d-body">
          <div className="card-3d-glow" aria-hidden="true" />
          <div className="card-3d-edge" aria-hidden="true" />
          <div className="card-3d-face">
            <span className="card-3d-fallback caption-5" aria-hidden="true">
              {cardCode}
            </span>
            {!imageFailed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={alt}
                loading="eager"
                decoding="async"
                draggable={false}
                onError={() => setFailedSrc(src)}
                className="card-3d-img"
              />
            )}
            <div className="card-3d-foil" aria-hidden="true" />
            <div className="card-3d-glare" aria-hidden="true" />
            {isAnchor && (
              <span className="card-3d-anchor caption-5" aria-hidden="true">
                Anchor
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
