import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChampionCrown } from "./ChampionCrown";
import { TeamAvatar } from "./TeamAvatar";
import {
  SEASON_2025_PLACEMENTS,
  reigningChampionRosterId,
} from "@/data/history-2025";
import { clubhouseDirectory } from "@/data/clubhouse-directory";

describe("ChampionCrown presentations", () => {
  it("renders the spinnable button only in its interactive presentation", () => {
    const html = renderToStaticMarkup(createElement(ChampionCrown, {}));
    expect(html).toContain("<button");
    expect(html).toContain('data-champion-crown="interactive"');
    expect(html).toContain("Defending champion — activate to spin the crown");
  });

  it("renders an aria-hidden badge with the same artwork when non-interactive", () => {
    const html = renderToStaticMarkup(
      createElement(ChampionCrown, { interactive: false }),
    );
    expect(html).not.toContain("<button");
    expect(html).toContain('data-champion-crown="badge"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("<svg");
    expect(html).not.toContain("Defending champion");
  });

  it("TeamAvatar crowns are always the badge, so avatars stay valid inside links and buttons", () => {
    const html = renderToStaticMarkup(
      createElement(TeamAvatar, {
        name: "Champs",
        avatar: null,
        isChampion: true,
      }),
    );
    expect(html).toContain('data-champion-crown="badge"');
    expect(html).not.toContain("<button");
  });

  it("a champion avatar inside a link renders no nested interactive content", () => {
    const html = renderToStaticMarkup(
      createElement(
        "a",
        { href: "/teams/5" },
        createElement(TeamAvatar, {
          name: "Champs",
          avatar: null,
          isChampion: true,
        }),
      ),
    );
    expect(html).toContain('data-champion-crown="badge"');
    expect(html).not.toContain("<button");
  });

  it("non-champions get no crown markup at all", () => {
    const html = renderToStaticMarkup(
      createElement(TeamAvatar, { name: "Also-rans", avatar: null }),
    );
    expect(html).not.toContain("data-champion-crown");
    expect(html).not.toContain("<svg");
  });
});

describe("reigning champion derivation", () => {
  it("derives the champion from the verified 2025 placements, never a hardcoded id", () => {
    const derived = Object.entries(SEASON_2025_PLACEMENTS).find(
      ([, finish]) => finish === 1,
    )?.[0];
    expect(reigningChampionRosterId()).toBe(derived);
    expect(reigningChampionRosterId()).toBe("5");
  });

  it("agrees with the clubhouse directory's previous-season finish source", () => {
    const championEntry = clubhouseDirectory.find(
      (entry) => entry.previousSeason?.finish === 1,
    );
    expect(championEntry?.identity.id).toBe(reigningChampionRosterId());
    expect(championEntry?.identity.name).toBe("Josh Diddy’s Roster");
  });
});
