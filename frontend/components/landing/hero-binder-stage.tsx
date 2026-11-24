"use client";

import { useEffect, useRef, useState } from "react";
import { Card3D } from "./card-3d";
import { HERO_CONFIG, type HeroCardConfig } from "./hero-config";

interface HeroBinderStageProps {
  heroRef: React.RefObject<HTMLElement | null>;
}

const MICHI_CELLS: ReadonlyArray<{ col: 0 | 1; row: 0 | 1; key: string }> = [
  { col: 0, row: 0, key: "michi-0-0" },
  { col: 1, row: 0, key: "michi-1-0" },
  { col: 0, row: 1, key: "michi-0-1" },
  { col: 1, row: 1, key: "michi-1-1" },
];

export function HeroBinderStage({ heroRef }: HeroBinderStageProps) {
  const rigRef = useRef<HTMLDivElement>(null);
  const cardHoveredRef = useRef(false);
  const [matchedCard, setMatchedCard] = useState<HeroCardConfig | null>(null);
  const [michiFailed, setMichiFailed] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    const rig = rigRef.current;
    if (!hero || !rig || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !canHover) return;

    const getBase = () =>
      window.innerWidth <= 1024 ? { rx: 8, ry: -8, rz: 1 } : { rx: 14, ry: -18, rz: 2 };

    let base = getBase();
    let cur = { ...base };
    let target = { ...base };
    let rafId = 0;

    const render = () => {
      cur.rx += (target.rx - cur.rx) * 0.08;
      cur.ry += (target.ry - cur.ry) * 0.08;
      cur.rz += (target.rz - cur.rz) * 0.08;

      rig.style.transform = `rotateX(${cur.rx.toFixed(3)}deg) rotateY(${cur.ry.toFixed(3)}deg) rotateZ(${cur.rz.toFixed(3)}deg)`;

      const settled =
        Math.abs(target.rx - cur.rx) < 0.01 &&
        Math.abs(target.ry - cur.ry) < 0.01 &&
        Math.abs(target.rz - cur.rz) < 0.01;

      if (settled) {
        cur = { ...target };
        rig.style.transform = `rotateX(${cur.rx}deg) rotateY(${cur.ry}deg) rotateZ(${cur.rz}deg)`;
        rafId = 0;
      } else {
        rafId = requestAnimationFrame(render);
      }
    };

    const kick = () => {
      if (!rafId) rafId = requestAnimationFrame(render);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (cardHoveredRef.current) {
        target = { ...base };
        kick();
        return;
      }
      const rect = hero.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      target.rx = base.rx - ny * 6;
      target.ry = base.ry + nx * 8;
      target.rz = base.rz + nx * 1.2;
      kick();
    };

    const onPointerLeave = () => {
      target = { ...base };
      kick();
    };

    const onResize = () => {
      base = getBase();
      target = { ...base };
      kick();
    };

    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
    };
  }, [heroRef]);

  const handleCardHover = (hovered: boolean) => {
    cardHoveredRef.current = hovered;
  };

  const handleToggleSuggestion = (suggestion: HeroCardConfig) => {
    setMatchedCard((prev) => (prev?.id === suggestion.id ? null : suggestion));
  };

  const { binderCards, matchSuggestions, michiArt } = HERO_CONFIG;

  return (
    <div className="hero-stage-layout">
      <div className="hero-binder-perspective">
        <div ref={rigRef} className="hero-binder-rig">
          <div className="hero-float-chip hero-chip-grid caption-4" aria-hidden="true">
            3x3
          </div>
          <div className="hero-float-chip hero-chip-autosaved caption-4" aria-hidden="true">
            <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z" />
            </svg>
            <span>Autosaved</span>
          </div>

          <div className="hero-binder-page" role="region" aria-label="Interactive 3x3 binder preview">
            <div className="hero-binder-grid">
              {/* Row 0, Col 0-1: Top half of swappable 2x2 Michi art span */}
              {MICHI_CELLS.slice(0, 2).map((cell) => (
                <div key={cell.key} className="hero-pocket hero-pocket-michi" aria-hidden="true">
                  {!michiFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={michiArt.src}
                      alt=""
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      onError={() => setMichiFailed(true)}
                      className="hero-michi-slice"
                      style={{
                        left: cell.col === 0 ? "0px" : "calc(-100% - var(--gap))",
                        top: "0px",
                      }}
                    />
                  ) : (
                    <span className="caption-5 text-white/40">2x2 art</span>
                  )}
                </div>
              ))}

              {/* Row 0, Col 2: Manga Shanks */}
              <div className="hero-pocket">
                <Card3D
                  src={binderCards.topRight.src}
                  alt={binderCards.topRight.alt}
                  cardCode={binderCards.topRight.cardCode}
                  glowRgb={binderCards.topRight.glowRgb}
                  onHoverChange={handleCardHover}
                />
              </div>

              {/* Row 1, Col 0-1: Bottom half of swappable 2x2 Michi art span */}
              {MICHI_CELLS.slice(2, 4).map((cell) => (
                <div key={cell.key} className="hero-pocket hero-pocket-michi" aria-hidden="true">
                  {!michiFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={michiArt.src}
                      alt=""
                      loading="eager"
                      decoding="async"
                      draggable={false}
                      onError={() => setMichiFailed(true)}
                      className="hero-michi-slice"
                      style={{
                        left: cell.col === 0 ? "0px" : "calc(-100% - var(--gap))",
                        top: "calc(-100% - var(--gap))",
                      }}
                    />
                  ) : (
                    <span className="caption-5 text-white/40">2x2 art</span>
                  )}
                </div>
              ))}

              {/* Row 1, Col 2: Empty slot paired with side "What matches here?" panel */}
              <div
                className={`hero-pocket ${matchedCard ? "" : "hero-pocket-empty"}`}
                data-testid="hero-match-slot"
              >
                {matchedCard ? (
                  <Card3D
                    src={matchedCard.src}
                    alt={matchedCard.alt}
                    cardCode={matchedCard.cardCode}
                    glowRgb={matchedCard.glowRgb}
                    onHoverChange={handleCardHover}
                  />
                ) : (
                  <span className="hero-empty-label caption-5">Empty slot</span>
                )}
              </div>

              {/* Row 2, Col 0: Manga Zoro */}
              <div className="hero-pocket">
                <Card3D
                  src={binderCards.bottomLeft.src}
                  alt={binderCards.bottomLeft.alt}
                  cardCode={binderCards.bottomLeft.cardCode}
                  glowRgb={binderCards.bottomLeft.glowRgb}
                  onHoverChange={handleCardHover}
                />
              </div>

              {/* Row 2, Col 1: Gold Manga Gol D. Roger */}
              <div className="hero-pocket">
                <Card3D
                  src={binderCards.bottomCenter.src}
                  alt={binderCards.bottomCenter.alt}
                  cardCode={binderCards.bottomCenter.cardCode}
                  glowRgb={binderCards.bottomCenter.glowRgb}
                  onHoverChange={handleCardHover}
                />
              </div>

              {/* Row 2, Col 2: Manga Gear 5 Luffy (Anchor) */}
              <div className="hero-pocket">
                <Card3D
                  src={binderCards.bottomRight.src}
                  alt={binderCards.bottomRight.alt}
                  cardCode={binderCards.bottomRight.cardCode}
                  glowRgb={binderCards.bottomRight.glowRgb}
                  isAnchor={binderCards.bottomRight.isAnchor}
                  onHoverChange={handleCardHover}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-docked "What matches here?" panel — sits cleanly off to the right, never covering cards */}
      <aside className="hero-match-panel" aria-label="AI slot suggestions preview">
        <div className="hero-match-head caption-4">
          <span className="hero-dot-accent" aria-hidden="true" />
          <span>What matches here?</span>
        </div>
        <ul className="hero-match-list">
          {matchSuggestions.map((item) => {
            const isActive = matchedCard?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => handleToggleSuggestion(item)}
                  aria-pressed={isActive}
                  className={`hero-match-item ${isActive ? "is-active" : ""}`}
                >
                  <span className="hero-match-thumb">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.src} alt="" loading="eager" decoding="async" draggable={false} />
                  </span>
                  <span className="hero-match-meta">
                    <span className="hero-match-name caption-4">{item.name}</span>
                    <span className="hero-match-reason caption-5">{item.reason}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}
