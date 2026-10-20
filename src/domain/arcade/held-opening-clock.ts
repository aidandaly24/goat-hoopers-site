import { WEEK_ONE_RANKED_OPENING, type ChallengeOpening } from "./challenge-opening";

/** Display evidence only. This protocol cannot represent active admission or an invented end. */
export type HeldOpeningClock = {
  protocol: "held-opening-v1";
  phase: "held";
  asOfMs: number;
  opening: ChallengeOpening;
  period: null;
};

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/** Reject incompatible phases/schedules; return only bounded public fields. */
export function parseHeldOpeningClock(value: unknown): HeldOpeningClock | null {
  if (!record(value) || value.protocol !== "held-opening-v1" || value.phase !== "held" || value.period !== null ||
    typeof value.asOfMs !== "number" || !Number.isSafeInteger(value.asOfMs) || value.asOfMs < 0 || value.asOfMs > 253402214400000 ||
    !record(value.opening) || value.opening.scheduleVersion !== WEEK_ONE_RANKED_OPENING.scheduleVersion ||
    value.opening.startsAtMs !== WEEK_ONE_RANKED_OPENING.startsAtMs || value.opening.timeZone !== WEEK_ONE_RANKED_OPENING.timeZone) return null;
  return { protocol: "held-opening-v1", phase: "held", asOfMs: value.asOfMs, opening: { ...WEEK_ONE_RANKED_OPENING }, period: null };
}
