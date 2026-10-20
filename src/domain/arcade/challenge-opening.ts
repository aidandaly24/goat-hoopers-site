/** An approved opening intent, separate from a complete competition period or admission rules. */
export type ChallengeOpening = { scheduleVersion: string; startsAtMs: number; timeZone: string };

export const WEEK_ONE_RANKED_OPENING: Readonly<ChallengeOpening> = Object.freeze({
  scheduleVersion: "week-one-opening-2026-10-20-v1",
  startsAtMs: Date.parse("2026-10-20T19:00:00.000Z"),
  timeZone: "America/New_York",
});
