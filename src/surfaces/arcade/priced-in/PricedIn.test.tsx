import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { PricedInRound } from "@/domain/arcade";
import { PricedIn } from "./PricedIn";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

// Synthetic fixture rounds only; these prices never enter a runtime loader.
const rounds: PricedInRound[] = Array.from({ length: 5 }, (_, i) => ({
  playerId: `fixture-${i + 1}`,
  playerName: `Fixture Player ${i + 1}`,
  position: "PG",
  nbaTeam: "LAL",
  espnId: null,
  price: 42.5,
  changePct: 2.5,
  trend: "up",
  line: 40,
}));

describe("PricedIn", () => {
  it("deals the first player with the line, both calls and the printed scoring rule", () => {
    const html = renderToStaticMarkup(createElement(PricedIn, { rounds, pricingBasis: "preseason" }));
    expect(html).toContain("Fixture Player 1");
    expect(html).toContain("The line");
    expect(html).toContain("$40.00");
    expect(html).toContain("Under $40.00");
    expect(html).toContain("Over $40.00");
    expect(html).toContain("Player");
    expect(html).toContain("100 points");
    expect(html).toContain("closeness");
    expect(html).toContain("750");
    // Practice honesty: the session-only scoring is stated, never implied ranked.
    expect(html).toContain("scores stay in this session");
    // Preseason basis is labelled while the market runs on preseason prices.
    expect(html).toContain("Preseason pricing");
    expect(html).toContain("preseason modeled prices");
    // The answer is never rendered before the call.
    expect(html).not.toContain("$42.50");
    expect(html).not.toContain("Real value");
  });

  it("drops the preseason labels once pricing is in-season", () => {
    const html = renderToStaticMarkup(createElement(PricedIn, { rounds, pricingBasis: "in-season" }));
    expect(html).toContain("In-season pricing");
    expect(html).not.toContain("Preseason pricing");
  });

  it("renders the honest unavailable state when the market cannot deal a full game", () => {
    const html = renderToStaticMarkup(createElement(PricedIn, { rounds: rounds.slice(0, 3), pricingBasis: "preseason" }));
    expect(html).toContain("The market is quiet");
    expect(html).toContain("enough priced players");
    expect(html).not.toContain("The line");
  });
});
