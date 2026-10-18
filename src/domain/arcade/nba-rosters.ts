import type { DraftPlayer } from "./roster-draft";

/** NBA identities belong to the local draft, independently of fantasy accounts. */
export type NbaTeam = {
  id: string;
  city: string;
  name: string;
  abbreviation: string;
  logo: string | null;
};

/** These are source observations, never a promise that a transaction is reflected. */
export type NbaSource = {
  provider: "ESPN";
  sourceUrl: string;
  observedAt: string;
  sourceUpdatedAt: string | null;
  seasonLabel: string | null;
};

export type NbaRosterPlayer = DraftPlayer & {
  jersey: string | null;
  status: string | null;
};

export type NbaTeamDirectory = { teams: readonly NbaTeam[]; source: NbaSource };
export type NbaRoster = { team: NbaTeam; players: readonly NbaRosterPlayer[]; source: NbaSource };

export type DraftRosterClient = {
  teams: (signal?: AbortSignal) => Promise<NbaTeamDirectory>;
  roster: (teamId: string, signal?: AbortSignal) => Promise<NbaRoster>;
};

/** A source-listed roster can be stale; show its actual observation date. */
export function isNbaSourceStale(source: NbaSource, nowMs: number): boolean {
  const observed = Date.parse(source.observedAt);
  const updated = source.sourceUpdatedAt === null ? observed : Date.parse(source.sourceUpdatedAt);
  return !Number.isFinite(observed) || !Number.isFinite(updated) || !Number.isFinite(nowMs) ||
    nowMs - Math.min(observed, updated) > 86_400_000 || observed > nowMs + 300_000 || updated > nowMs + 300_000;
}
