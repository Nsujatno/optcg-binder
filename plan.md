# Hero Section Implementation Plan

Build a sleek, premium hero section for **OPTCG Binder** at `/` (moving the planner to `/planner`), based on **Concept 02 (Tilted Binder Page)** and upgraded with a standalone interactive **3D Card component**, Manga Rare & Alt-Art card curation, a docked side **"What matches here?"** panel, an easily swappable Michi art placeholder, and short, concise copy.

Navbar and below-the-fold landing sections will be built next once the hero section is finalized.

---

## 1. Finalized Decisions

- **Routing:** Landing page hero lives at `/` (`frontend/app/page.tsx`); `PlannerApp` moves to `/planner` (`frontend/app/planner/page.tsx`).
- **Scope:** Hero section only — no navbar or below-the-fold sections yet.
- **Card interaction:** Hover lift + live card-local 3D tilt + holographic foil + subtle rarity glow right inside the binder slot. **No pop-out modal or overlay.**
- **Cooler cards:** Curated Manga Rares & Alt Arts copied from `ai-indexer/.cache/images/` into `frontend/public/landing-cards/` for instant load and one-line swapping in `hero-config.ts`.
- **Swappable Michi art:** Aspect-ratio-agnostic 2×2 slice (`object-fit: cover`) using `frontend/public/landing-cards/michi-placeholder.jpg` so replacing the image later requires only dropping in a new file.
- **"What matches here?" placement:** Docked off to the right side of the binder beside the right-column empty dashed slot (never covering cards or Michi art). Clicking a suggestion previews it right in the empty pocket.
- **Copy:** Short, sweet, and concise — 2-line headline, 1 short sentence subheadline, single CTA button (`Open the planner`), and 5-word proof line.

### Explicitly Rejected
Bento grid, exploded layers, book page-turn binder, scattered assembly, card wall, orbit ring, scripted demo window, light gallery, and click pop-out modals.

---

## 2. Copy Specification

- **Headline (`heading-1`, `max-width: 680px`, text gradient `#FFFFFF → #9B9B9B`):**
  `Plan your One Piece binder` / `before you sleeve a card`
- **Subheadline (`title-2`, `max-width: 680px`):**
  `Arrange every set, span custom art across pockets, and fill empty slots.`
- **Primary CTA (`href="/planner"`, `button-md`, solid `#FFFFFF` / `#000000`):**
  `Open the planner` + Phosphor `ArrowRight`
- **Proof line (`caption-5`):**
  `Free · No account · Every set`

---

## 3. Visual System & Tokens

Follows `landing-page-design` Part B (flat `#181818` page background, `#1F1F1F`/`#272727` surfaces, Geist 400/500/600 only, Tailwind type scale + named classes, B2 spacing tokens, Tailwind radii + nested radius formula, all-around borders only, Phosphor icons, `cubic-bezier(0.22, 1, 0.36, 1)` motion, `prefers-reduced-motion` support, and 390px mobile responsiveness). Subtle rarity-tinted glow is applied strictly to the `Card3D` component per user request while keeping all page and panel backgrounds flat.

---

## 4. Component Architecture

```text
frontend/
├── public/landing-cards/
│   ├── michi-placeholder.jpg     # Easily swappable 2x2 Michi placeholder
│   ├── op01-120-manga.jpg        # Manga Shanks
│   ├── op05-119-manga.jpg        # Manga Gear 5 Luffy (Anchor)
│   ├── op06-118-manga.jpg        # Manga Roronoa Zoro
│   ├── op09-118-manga.jpg        # Gold Manga Gol D. Roger
│   ├── op09-119-alt.jpg          # Alt Art Monkey D. Luffy (Match suggestion)
│   ├── op02-013-sp.jpg           # SP Portgas D. Ace (Match suggestion)
│   └── op08-118-alt.jpg          # Alt Art Silvers Rayleigh (Match suggestion)
├── components/landing/
│   ├── hero-config.ts            # Single config for Michi path, binder cards, and match suggestions
│   ├── card-3d.tsx               # Reusable 3D Card (hover lift, cursor tilt, depth edge, holo foil, glare, glow)
│   ├── hero-binder-stage.tsx     # Tilted 3x3 binder + swappable 2x2 Michi span + docked side match panel
│   └── hero-section.tsx          # Split hero layout (copy + CTA + 3D binder stage)
└── app/
    ├── page.tsx                  # Mounts HeroSection at /
    └── planner/page.tsx          # Mounts PlannerApp at /planner
```

---

## 5. Verification Checklist

- [ ] `Card3D` lifts, tilts smoothly toward pointer via `requestAnimationFrame`, renders holo sheen + glare + subtle glow, falls back cleanly on image error, and respects `prefers-reduced-motion`.
- [ ] Swapping `michi-placeholder.jpg` works cleanly with any aspect ratio across the 2×2 span.
- [ ] `"What matches here?"` sits off to the right side without overlapping binder cards, and stacks cleanly below on narrow/mobile screens (`390px`, zero horizontal overflow).
- [ ] Vitest tests in `frontend/__tests__/hero-landing.test.tsx` pass (`npm run test:frontend`).
- [ ] Production Next.js build succeeds (`npm run build:frontend`).
