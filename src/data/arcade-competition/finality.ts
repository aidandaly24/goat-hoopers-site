import "server-only";
import type { CompetitionPeriod, FinalityReceipt, FixtureState } from "@/domain/arcade/competition-period";

type Feed = { events?: { id: string; status?: { type?: { completed?: boolean; state?: string; name?: string } } }[] };
/** Publisher-owned scoreboard; only planned dates and fixture IDs are requested/accepted. */
export async function readFinality(period: CompetitionPeriod, dependencies: {
  fetch: (url: string, init: RequestInit) => Promise<Response>; now: () => number;
}): Promise<FinalityReceipt> {
  const now = dependencies.now(), states: Record<string, FixtureState> = {};
  const dates = [...new Set(period.fixtures.filter(f => f.startsAtMs <= now).map(f => f.date))];
  await Promise.all(dates.map(async date => {
    const expected = period.fixtures.filter(f => f.date === date && f.startsAtMs <= now);
    try {
      const response = await dependencies.fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${date}&limit=100`,
        { cache: "no-store", signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("scoreboard_unavailable");
      const text = await response.text();
      if (text.length > 1000000) throw new Error("oversized_scoreboard");
      const body = JSON.parse(text) as Feed;
      for (const fixture of expected) {
        const event = body.events?.find(e => e.id === fixture.id), type = event?.status?.type;
        states[fixture.id] = !type ? "missing" : /POSTPON|CANCEL|SUSPEND/i.test(type.name ?? "") ? "postponed"
          : type.completed === true && type.state === "post" ? "final" : type.state === "in" ? "live" : type.state === "pre" ? "scheduled" : "missing";
      }
    } catch { for (const f of expected) states[f.id] = "missing"; }
  }));
  for (const f of period.fixtures) if (f.startsAtMs > now) states[f.id] = "scheduled";
  return { source: "ESPN NBA scoreboard; exact published fixture IDs", checkedAtMs: dependencies.now(), states };
}
