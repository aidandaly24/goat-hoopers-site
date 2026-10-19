/**
 * Priced In — the arcade price game, as pure domain logic.
 *
 * Five players, five lines. Each round deals one priced player and a
 * line set off their real modeled FAAB value; the visitor calls over
 * or under, then the real value lands. A correct call scores
 * `PRICED_IN_CORRECT_POINTS` plus a closeness bonus that shrinks as
 * the line drifts from the real value.
 *
 * This module owns the arcade context's own candidate shape: the app
 * layer adapts the league's stock quotes into `PricedInCandidate`s, so
 * the arcade never imports league types (the two contexts share
 * nothing but ids). All randomness is injected — tests pass a
 * deterministic source, the page passes Math.random.
 *
 * Practice only: scores live in the visitor's session. Nothing here —
 * or in the surface — reports a score to the GameStore, so no
 * client-computed score is ever treated as a leaderboard truth.
 */

/** Rounds in one game. */
export const PRICED_IN_ROUND_COUNT = 5;
/** Cheapest player worth dealing: below this the line has no room to move. */
export const PRICED_IN_MIN_PRICE = 5;
/** Points for calling the correct side of the line. */
export const PRICED_IN_CORRECT_POINTS = 100;
/** Largest closeness bonus, earned when the line lands on the value. */
export const PRICED_IN_MAX_BONUS = 50;
/** Best possible game score: every call right, every line exact. */
export const PRICED_IN_MAX_SCORE =
  PRICED_IN_ROUND_COUNT * (PRICED_IN_CORRECT_POINTS + PRICED_IN_MAX_BONUS);

/** One priced player, adapted from a stock quote by the app layer. */
export type PricedInCandidate = {
  /** Sleeper player_id. */
  playerId: string;
  playerName: string;
  position: string | null;
  /** NBA team abbreviation, e.g. "LAL". Null when unknown. */
  nbaTeam: string | null;
  /** ESPN athlete id for the headshot. Null renders initials. */
  espnId: string | null;
  /** The real modeled FAAB value. The answer — never shown pre-call. */
  price: number;
  /** Change vs the previous snapshot, percent. Null with no history. */
  changePct: number | null;
  trend: "up" | "down" | "flat";
};

/** A dealt round: a candidate plus the line the visitor calls against. */
export type PricedInRound = PricedInCandidate & {
  /** The line in FAAB dollars. Never equal to the real price. */
  line: number;
};

/** The visitor's call on a round. */
export type PricedInCall = "over" | "under";

/** Injected randomness: returns a sample in [0, 1), like Math.random. */
export type PricedInRandom = () => number;

/** Clamp a random sample into [0, 1) so a bad source can't skew a shuffle. */
function sample(rng: PricedInRandom): number {
  const value = rng();
  if (!Number.isFinite(value) || value < 0) return 0;
  return value >= 1 ? 0.999999 : value;
}

/** Fisher–Yates shuffle on a copy, driven by the injected source. */
function shuffled<T>(items: readonly T[], rng: PricedInRandom): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(sample(rng) * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

/**
 * Set a line off a real price: 4–15% away (at least $2), direction by
 * coin flip. The gap is small enough that either call is genuinely
 * live, large enough that the closeness bonus is earnable but rarely
 * maxed. The line never equals the price, so every round has exactly
 * one correct side.
 */
export function pricedInLine(price: number, rng: PricedInRandom): number {
  const pct = 0.04 + sample(rng) * 0.11;
  const offset = Math.max(2, Math.round(price * pct));
  const direction = sample(rng) < 0.5 ? -1 : 1;
  const line = price + direction * offset;
  return line >= 1 ? line : price + offset;
}

/**
 * Deal a game: up to `PRICED_IN_ROUND_COUNT` rounds from the priced
 * pool. Players with a headshot (espnId) deal first — faces make the
 * game — and the rest fill in only when the pool runs short. Returns
 * fewer rounds when the pool itself is short; callers render the
 * honest unavailable state below a full game.
 */
export function samplePricedInRounds(
  candidates: readonly PricedInCandidate[],
  rng: PricedInRandom = Math.random,
): PricedInRound[] {
  const seen = new Set<string>();
  const priced = candidates.filter((candidate) => {
    if (!Number.isFinite(candidate.price) || candidate.price < PRICED_IN_MIN_PRICE) {
      return false;
    }
    if (seen.has(candidate.playerId)) return false;
    seen.add(candidate.playerId);
    return true;
  });
  const withFaces = shuffled(
    priced.filter((candidate) => candidate.espnId !== null),
    rng,
  );
  const withoutFaces = shuffled(
    priced.filter((candidate) => candidate.espnId === null),
    rng,
  );
  return [...withFaces, ...withoutFaces]
    .slice(0, PRICED_IN_ROUND_COUNT)
    .map((candidate) => ({ ...candidate, line: pricedInLine(candidate.price, rng) }));
}

/** True when the call names the side of the line the real price landed on. */
export function pricedInCallIsCorrect(round: PricedInRound, call: PricedInCall): boolean {
  return call === "over" ? round.price > round.line : round.price < round.line;
}

/**
 * Score one call: correct side earns the base points plus a closeness
 * bonus — `PRICED_IN_MAX_BONUS` minus the line's distance from the
 * real value, floored at zero. A wrong call earns nothing.
 */
export function scorePricedInCall(round: PricedInRound, call: PricedInCall): number {
  if (!pricedInCallIsCorrect(round, call)) return 0;
  const distance = Math.round(Math.abs(round.price - round.line));
  return PRICED_IN_CORRECT_POINTS + Math.max(0, PRICED_IN_MAX_BONUS - distance);
}
