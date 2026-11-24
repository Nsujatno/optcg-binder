export interface HeroCardConfig {
  id: string;
  cardCode: string;
  name: string;
  src: string;
  alt: string;
  glowRgb: string;
  isAnchor?: boolean;
  reason?: string;
}

export const HERO_CONFIG = {
  /**
   * Swap this single path (or replace public/landing-cards/michi-placeholder.jpg)
   * with any image of any aspect ratio — the 2x2 Michi span slices it cleanly via object-fit: cover.
   */
  michiArt: {
    src: "/landing-cards/michi-placeholder.jpg",
    alt: "Custom artwork spanning four binder pockets",
  },
  binderCards: {
    topRight: {
      id: "shanks-manga",
      cardCode: "OP01-120",
      name: "Shanks",
      src: "/landing-cards/op01-120-manga.jpg",
      alt: "Shanks manga rare card from Romance Dawn",
      glowRgb: "248, 113, 113",
    },
    bottomLeft: {
      id: "zoro-manga",
      cardCode: "OP06-118",
      name: "Roronoa Zoro",
      src: "/landing-cards/op06-118-manga.jpg",
      alt: "Roronoa Zoro manga rare card from Wings of the Captain",
      glowRgb: "52, 211, 153",
    },
    bottomCenter: {
      id: "roger-manga",
      cardCode: "OP09-118",
      name: "Gol D. Roger",
      src: "/landing-cards/op09-118-manga.jpg",
      alt: "Gol D. Roger gold manga rare card from Emperors in the New World",
      glowRgb: "245, 196, 81",
    },
    bottomRight: {
      id: "luffy-g5-manga",
      cardCode: "OP05-119",
      name: "Monkey D. Luffy",
      src: "/landing-cards/op05-119-manga.jpg",
      alt: "Gear 5 Monkey D. Luffy manga rare anchor card from Awakening of the New Era",
      glowRgb: "103, 232, 249",
      isAnchor: true,
    },
  } satisfies Record<string, HeroCardConfig>,
  matchSuggestions: [
    {
      id: "luffy-op09-alt",
      cardCode: "OP09-119",
      name: "Monkey D. Luffy",
      src: "/landing-cards/op09-119-alt.jpg",
      alt: "Monkey D. Luffy alternate art card from Emperors in the New World",
      glowRgb: "251, 146, 60",
      reason: "Same set · OP09",
    },
    {
      id: "ace-op02-sp",
      cardCode: "OP02-013",
      name: "Portgas D. Ace",
      src: "/landing-cards/op02-013-sp.jpg",
      alt: "Portgas D. Ace special rare card from Paramount War",
      glowRgb: "248, 113, 113",
      reason: "Same color · Red",
    },
    {
      id: "rayleigh-op08-alt",
      cardCode: "OP08-118",
      name: "Silvers Rayleigh",
      src: "/landing-cards/op08-118-alt.jpg",
      alt: "Silvers Rayleigh alternate art card from Two Legends",
      glowRgb: "103, 232, 249",
      reason: "Roger Pirates",
    },
  ] satisfies HeroCardConfig[],
} as const;
