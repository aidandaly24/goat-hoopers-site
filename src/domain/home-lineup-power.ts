import type { LineupPowerSnapshot } from "./lineup-power";
import type { Team } from "./team";

/** Context captured from the same state read used by the reviewed producer.
 * Snapshot asOf is calculation time; the stats feed exposes no update instant. */
export type HomeLineupPowerContext = {
  season: string;
  priorStatsSeason: string;
  sourceLeg: number;
};

export type HomeLineupPowerUnavailable = { status: "unavailable"; message: string };

export type HomeLineupPowerSource = HomeLineupPowerUnavailable | {
  status: "available";
  snapshot: LineupPowerSnapshot;
  context: HomeLineupPowerContext;
};

/** Public, request-local home projection. There is no stored prior yet. */
export type HomeLineupPower = HomeLineupPowerUnavailable | {
  status: "available";
  snapshot: LineupPowerSnapshot;
  context: HomeLineupPowerContext;
  teams: Pick<Team, "id" | "name" | "avatar">[];
  prior: null;
};
