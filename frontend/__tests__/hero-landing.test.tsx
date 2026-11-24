import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card3D } from "@/components/landing/card-3d";
import { HERO_CONFIG } from "@/components/landing/hero-config";
import { HeroSection } from "@/components/landing/hero-section";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("Card3D", () => {
  it("renders card artwork, anchor tag, hover state, and clean image-error fallback", () => {
    const onHoverChange = vi.fn();
    render(
      <Card3D
        src="/landing-cards/op05-119-manga.jpg"
        alt="Gear 5 Monkey D. Luffy manga rare card"
        cardCode="OP05-119"
        isAnchor
        onHoverChange={onHoverChange}
      />,
    );

    const shell = screen.getByRole("group", { name: "Gear 5 Monkey D. Luffy manga rare card" });
    expect(shell.getAttribute("data-hovered")).toBe("false");
    expect(shell.getAttribute("data-anchor")).toBe("true");
    expect(screen.getByText("Anchor")).toBeTruthy();
    expect(screen.getByText("OP05-119")).toBeTruthy();

    fireEvent.pointerEnter(shell, { pointerType: "mouse" });
    expect(shell.getAttribute("data-hovered")).toBe("true");
    expect(onHoverChange).toHaveBeenLastCalledWith(true);

    fireEvent.pointerLeave(shell);
    expect(shell.getAttribute("data-hovered")).toBe("false");
    expect(onHoverChange).toHaveBeenLastCalledWith(false);

    const img = shell.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    expect(shell.querySelector("img")).toBeNull();
    expect(screen.getByText("OP05-119")).toBeTruthy();
  });
});

describe("HeroSection", () => {
  it("renders concise hero copy, planner CTA, swappable Michi slices, and no navbar or modal", () => {
    const { container } = render(<HeroSection />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(
      "Plan your One Piece binder",
    );
    const cta = screen.getByRole("link", { name: /Open the planner/i });
    expect(cta.getAttribute("href")).toBe("/planner");
    expect(container.querySelector("nav")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();

    const michiImages = container.querySelectorAll(
      `img[src="${HERO_CONFIG.michiArt.src}"]`,
    );
    expect(michiImages).toHaveLength(4);
  });

  it("previews and clears side match suggestions inside the empty binder slot", () => {
    render(<HeroSection />);

    const matchSlot = screen.getByTestId("hero-match-slot");
    expect(matchSlot.textContent).toContain("Empty slot");

    const firstSuggestion = HERO_CONFIG.matchSuggestions[0];
    const suggestionButton = screen.getByRole("button", {
      name: new RegExp(firstSuggestion.name, "i"),
    });

    fireEvent.click(suggestionButton);
    expect(suggestionButton.getAttribute("aria-pressed")).toBe("true");
    expect(matchSlot.textContent).not.toContain("Empty slot");
    expect(matchSlot.querySelector(`img[src="${firstSuggestion.src}"]`)).not.toBeNull();

    fireEvent.click(suggestionButton);
    expect(suggestionButton.getAttribute("aria-pressed")).toBe("false");
    expect(matchSlot.textContent).toContain("Empty slot");
  });
});
