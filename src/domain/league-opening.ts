/** Public league-opening evidence. A calendar date alone never certifies a tipoff. */
export type LeagueOpening =
  | { status: "unavailable"; date: null; startsAtMs: null; message: string }
  | { status: "date_only"; season: string; week: 1; date: string; startsAtMs: null; message: string }
  | { status: "verified"; season: string; week: 1; date: string; startsAtMs: number; timeZone: string; sourceUrl: string; message: string };
