import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getGame, getPlayableGames } from "@/domain/arcade";
import ArcadePage from "./page";

describe("public Arcade discovery", () => {
  it("advertises implemented practice while league competition stays closed", () => {
    expect(getGame("free-throw")?.status).toBe("coming-soon");
    expect(getPlayableGames().map(game => game.id)).toEqual(["free-throw"]);
    expect(getGame("82-0-predictions")).not.toBeNull();
  });

  it("renders direct play and a real preview without an account or database", () => {
    // Offline setup blocks sockets and removes DB credentials. Rendering this
    // page must not call the former account/store gate.
    const html = renderToStaticMarkup(createElement(ArcadePage));
    expect(html).toContain('href="/arcade/free-throw"');
    expect(html).toContain('aria-label="Play Free Throw Shootout"');
    expect(html).toContain("free-throw-preview.jpg");
    expect(html).toContain("Actual gameplay");
    expect(html).toContain("No sign-in needed");
    expect(html).toContain("Lift your finger to shoot");
    for (const misleading of ["82-0 Predictions", "Not yet live", "Claim your team", "FAAB", "Details →"]) {
      expect(html).not.toContain(misleading);
    }
  });
});
