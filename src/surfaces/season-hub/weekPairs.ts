import type { Matchup } from "@/domain";
import type { LiveClubhouseDirectoryEntry } from "@/domain/clubhouse-directory";
import { isHomePreseasonPreview, type HomeTeamSummary } from "@/domain/personalized-home";
import type { AiSnapshotMetadata, AiWeeklyPick, AiWeeklySlate } from "@/domain/ai-decider";

/** The directory-entry slice every homepage pairing surface reads: identity
 * plus the previous-season and current records the desks quote. */
export type PairEntry = Pick<LiveClubhouseDirectoryEntry, "identity" | "previousSeason" | "currentRecord" | "currentMatchup">;

export type WeekPair = Pick<Matchup, "week" | "homePoints" | "awayPoints"> & {
  home: PairEntry["identity"];
  away: PairEntry["identity"];
};

/** Current pairing totals have no completion flag; non-null is not proof of a final. */
export const hasPairScores = (pair: Pick<Matchup, "homePoints" | "awayPoints">) =>
  pair.homePoints !== null && pair.awayPoints !== null;

/** The week's pairings, derived once and shared by the hero desk and the
 * down-page AI Decides section so both always show the same five games:
 * live Sleeper pairings, or — in the Week 1 preseason window — the saved
 * preview slate's pairings in slate order. */
export function deriveWeekPairs(entries: PairEntry[], aiWeekly: AiWeeklySlate | undefined, season: string | null) {
  const livePairs: WeekPair[] = entries.flatMap((entry, index) => {
    const matchup = entry.currentMatchup;
    return matchup && !entries.slice(0, index).some((previous) =>
      previous.currentMatchup?.week === matchup.week &&
      [previous.currentMatchup.home.id, previous.currentMatchup.away.id].sort().join(":") === [matchup.home.id, matchup.away.id].sort().join(":"),
    ) ? [{ week: matchup.week, home: matchup.home, away: matchup.away, homePoints: matchup.homePoints, awayPoints: matchup.awayPoints }] : [];
  });
  const preseasonPreview = isHomePreseasonPreview(aiWeekly, season);
  const pairs: WeekPair[] = preseasonPreview && aiWeekly ? aiWeekly.matchups.flatMap(pick => {
    const home = entries.find(entry => entry.identity.id === pick.teamIds[0])?.identity;
    const away = entries.find(entry => entry.identity.id === pick.teamIds[1])?.identity;
    return home && away ? [{ week: aiWeekly.week, home, away, homePoints: null, awayPoints: null }] : [];
  }) : livePairs;
  return { pairs, preseasonPreview };
}

/** The saved pick joined to a pairing strictly: same slate, same season,
 * same week, both roster IDs. Reads never generate a pick. */
export function savedPickFor(aiWeekly: AiWeeklySlate | undefined, season: string | null, pair: WeekPair): AiWeeklyPick | undefined {
  return aiWeekly?.status !== "unavailable" && aiWeekly?.season === season && aiWeekly.week === pair.week
    ? aiWeekly.matchups.find((pick) => pick.teamIds.includes(pair.home.id) && pick.teamIds.includes(pair.away.id))
    : undefined;
}

/** The defending champion's roster id, from previous-season finish — the
 * same source the directory's "champion" label and the avatar crown use. */
export function championTeamIdOf(entries: PairEntry[]): string | undefined {
  return entries.find((entry) => entry.previousSeason?.finish === 1)?.identity.id;
}

/** A member's own pairing as a display pair: their live matchup when the
 * league check has one, else the pairing of their saved AI result. */
export function memberPair(summary: HomeTeamSummary, entries: PairEntry[]): WeekPair | null {
  const identityOf = (id: string) => entries.find((entry) => entry.identity.id === id)?.identity;
  if (summary.matchup) {
    const home = identityOf(summary.matchup.home.id);
    const away = identityOf(summary.matchup.away.id);
    return home && away ? { week: summary.matchup.week, home, away, homePoints: summary.matchup.homePoints, awayPoints: summary.matchup.awayPoints } : null;
  }
  if (summary.ai) {
    const [first, second] = summary.ai.pick.teamIds;
    const home = first ? identityOf(first) : undefined;
    const away = second ? identityOf(second) : undefined;
    return home && away ? { week: summary.ai.week, home, away, homePoints: null, awayPoints: null } : null;
  }
  return null;
}

/** A team's record line for the desks: the previous season's record while
 * the preseason lasts (labelled with its season), else the current one. */
export function recordLine(entry: PairEntry | undefined, preseason: boolean) {
  const prior = preseason ? entry?.previousSeason : null;
  const record = prior ?? entry?.currentRecord ?? null;
  return {
    label: prior ? `${prior.season} record` : "Record",
    season: prior?.season ?? null,
    finish: prior?.finish ?? null,
    text: record ? `${record.wins}–${record.losses}` : null,
  };
}

export const savedComparisonLabel = (snapshot: AiSnapshotMetadata | null | undefined) =>
  snapshot?.comparison === "preseason_lineup_preview" ? "Preseason lineup preview"
    : snapshot?.comparison === "weekly_lineup_preview" ? "Weekly lineup preview" : null;

export const savedTimestamp = (value: string) =>
  Number.isFinite(Date.parse(value)) ? `${new Date(value).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unavailable";

/** The preview-period closure line for a saved result, when the snapshot
 * carries one: a preseason preview names when publication closes; a weekly
 * preview missing its period dates says so instead of guessing. */
export function previewPeriodLine(snapshot: AiSnapshotMetadata | null): string | null {
  if (!savedComparisonLabel(snapshot)) return null;
  if (snapshot?.comparison === "preseason_lineup_preview") return snapshot.startsAt && Number.isFinite(Date.parse(snapshot.startsAt)) ? `Publication closes ${savedTimestamp(snapshot.startsAt)}.` : "Publication closure unavailable.";
  return snapshot?.startsAt && snapshot.endsAt ? null : "Period dates unavailable.";
}
