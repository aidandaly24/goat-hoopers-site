import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getGame, getPlayableGames } from "@/domain/arcade";
import ArcadePage from "./page";

describe("public Arcade discovery", () => {
  it("keeps implemented practice independent of ranked availability", () => {
    expect(getGame("free-throw")?.status).toBe("coming-soon");
    expect(getPlayableGames().map(game => game.id)).toEqual(["free-throw", "week-2-preview", "priced-in"]);
    expect(getGame("week-2-preview")?.play?.mode).toBe("preview");
    expect(getGame("week-2-preview")?.status).toBe("coming-soon");
    expect(getGame("priced-in")?.play?.mode).toBe("practice");
    expect(getGame("priced-in")?.status).toBe("coming-soon");
    expect(getGame("82-0-predictions")).not.toBeNull();
  });

  it("renders direct play and a real preview without an account or database", () => {
    // Offline setup blocks sockets and removes DB credentials. Rendering this
    // page must not call the former account/store gate.
    const html = renderToStaticMarkup(createElement(ArcadePage));
    expect(html).toContain('href="/arcade/free-throw"');
    expect(html).toContain('aria-label="Play ranked free throws"');
    expect(html).toContain('href="/arcade/ranked-free-throw"');
    expect(html).toContain("Local practice court");
    const shortcuts = html.match(/<nav[^>]*aria-label="Jump into a game"[\s\S]*?<\/nav>/)?.[0];
    expect(shortcuts).toContain('href="/arcade/ranked-free-throw"');
    expect(shortcuts).toContain(">Ranked free throws</a>");
    expect(shortcuts).toContain('href="/arcade/free-throw"');
    expect(shortcuts).toContain(">Local free-throw practice</a>");
    expect(shortcuts).not.toContain(">Free Throw Shootout</a>");
    expect(html).toContain("free-throw-preview.jpg");
    expect(html).toContain("Actual gameplay");
    expect(html).toContain("No sign-in needed");
    expect(html).toContain("Lift your finger to shoot");
    expect(html).toContain('href="/arcade/week-2-preview"');
    expect(html).toContain("Week 2 · Unranked preview");
    expect(html).toContain("Week 2 competition stays closed");
    expect(html).toContain('href="/arcade/priced-in"');
    expect(html).toContain('aria-label="Practice Priced In"');
    expect(html).toContain("The price game");
    expect(html).toContain("Over or under the line?");
    expect(html).toContain('href="/arcade/leaderboard"');
    for (const misleading of ["82-0 Predictions", "Not yet live", "Claim your team", "FAAB", "Details →"]) {
      expect(html).not.toContain(misleading);
    }
  });
});
