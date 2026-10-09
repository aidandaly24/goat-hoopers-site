/**
 * TeamProfile ↔ GmArchetypeCard ownership contract.
 *
 * The archetype prop is optional on TeamProfile: omitted means no GM IQ
 * card at all (callers without archetype data are untouched), null means
 * the card's honest empty state, populated means the full card under the
 * identity header. Static markup (react-dom/server); wholly synthetic
 * props — empty roster/game-log/picks/wire sections keep every
 * next/link-rendering branch out of the output.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type {
  ManagerArchetype,
  MetricId,
  Team,
  TeamProfile as TeamProfileData,
} from "@/domain";
import { TeamProfile } from "./TeamProfile";

function profile(): TeamProfileData {
  const team: Team = {
    id: "1",
    name: "Synthetic Squad",
    managerName: "Synthetic GM",
    avatar: null,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
  return {
    team,
    players: [],
    matchups: [],
    streak: 0,
    draftPicks: [],
    transactions: [],
  };
}

const METRICS: Record<MetricId, number | null> = {
  draftCapital: 94,
  tradeFrequency: 82,
  wireAggression: 31,
  youthPreference: 97,
  patience: null,
};

const ARCHETYPE: ManagerArchetype = {
  rosterId: "1",
  seasons: [
    {
      season: "2025",
      managerName: "Synthetic GM",
      priorManagerNote: null,
      metrics: METRICS,
      archetype: "hoarder",
    },
  ],
};

describe("TeamProfile GM IQ ownership", () => {
  test("omitted archetype renders no GM IQ card", () => {
    const out = renderToStaticMarkup(
      <TeamProfile profile={profile()} teams={[]} />,
    );
    expect(out).not.toContain("GM IQ");
    expect(out).toContain("Synthetic Squad");
  });

  test("null archetype renders the card's honest empty state", () => {
    const out = renderToStaticMarkup(
      <TeamProfile profile={profile()} teams={[]} archetype={null} />,
    );
    expect(out).toContain("GM IQ");
    expect(out).toContain("No archetype yet");
    expect(out).not.toContain('role="img"');
  });

  test("populated archetype renders the full card under the identity header", () => {
    const out = renderToStaticMarkup(
      <TeamProfile profile={profile()} teams={[]} archetype={ARCHETYPE} />,
    );
    expect(out).toContain("The Hoarder");
    expect(out.match(/role="img"/g)?.length).toBe(5);
    // unmeasured patience stays honest inside the composed page too
    expect(out).toContain('aria-label="Patience: unmeasured"');
    // the card sits after the team identity header in document order
    expect(out.indexOf("Synthetic Squad")).toBeLessThan(
      out.indexOf("The Hoarder"),
    );
  });
});
