"use client";

import Link from "next/link";
import { useRef } from "react";
import { HeroBinderStage } from "./hero-binder-stage";
import "./landing-hero.css";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <div className="landing-root">
      <a href="#main-content" className="landing-skip-link button-sm">
        Skip to content
      </a>

      <main id="main-content">
        <section ref={heroRef} className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <h1 id="hero-title" className="landing-hero-heading heading-1">
                Plan your One Piece binder
                <br />
                before you sleeve a card
              </h1>
              <p className="landing-hero-sub title-2">
                Arrange every set, span custom art across pockets, and fill empty slots.
              </p>
              <div className="landing-hero-actions">
                <Link href="/planner" className="landing-cta-primary button-md">
                  <span>Open the planner</span>
                  <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
                    <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
                  </svg>
                </Link>
                <p className="landing-hero-proof caption-5">
                  <span className="landing-proof-dot" aria-hidden="true" />
                  <span>Free · No account · Every set</span>
                </p>
              </div>
            </div>

            <HeroBinderStage heroRef={heroRef} />
          </div>
        </section>
      </main>
    </div>
  );
}
