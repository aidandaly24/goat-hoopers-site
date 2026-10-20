import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChampionCrown } from "./ChampionCrown";
import { TeamAvatar } from "./TeamAvatar";

describe("ChampionCrown presentations", () => {
  it("renders the spinnable button only in its interactive presentation", () => {
    const html = renderToStaticMarkup(createElement(ChampionCrown, {}));
    expect(html).toContain("<button");
    expect(html).toContain('data-champion-crown="interactive"');
    expect(html).toContain("Defending champion — activate to spin the crown");
  });

  it("renders an aria-hidden badge with the same artwork when non-interactive", () => {
    const html = renderToStaticMarkup(createElement(ChampionCrown, { interactive: false }));
    expect(html).not.toContain("<button");
    expect(html).toContain('data-champion-crown="badge"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<svg");
    expect(html).not.toContain("Defending champion");
  });

  it("TeamAvatar crowns are always the badge, so avatars stay valid inside links and buttons", () => {
    const html = renderToStaticMarkup(
      createElement(TeamAvatar, { name: "Champs", avatar: null, isChampion: true }),
    );
    expect(html).toContain('data-champion-crown="badge"');
    expect(html).not.toContain("<button");
  });
});
