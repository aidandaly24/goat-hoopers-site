/**
 * Priced In — the arcade price game, as pure domain logic.
 *
 * Five players, five lines. Each round deals one priced player and a
 * line set off their real modeled FAAB value; the visitor calls over
 * or under, then the real value lands. A correct call scores
 * `PRICED_IN_CORRECT_POINTS` plus a closeness bonus: the full
 * `PRICED_IN_MAX_BONUS` when the line sits at the tightest gap the
 * dealer can set (`PRICED_IN_MIN_LINE_OFFSET`), shrinking a point per
 * dollar the line drifts beyond that. The dealer's minimum offset and
 * the scorer's bonus anchor are the same constant, so the advertised
 * best game (`PRICED_IN_MAX_SCORE`) is always a score a real deal can
 * reach — never a theoretical one.
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
/**
 * Smallest gap between a dealt line and its price, in FAAB dollars.
 * The dealer never sets a tighter line; the scorer pays the full
 * closeness bonus at exactly this gap. One constant for both, so the
 * reachable maximum can never drift away from the advertised one.
 */
export const PRICED_IN_MIN_LINE_OFFSET = 2;
/** Points for calling the correct side of the line. */
export const PRICED_IN_CORRECT_POINTS = 100;
/** Largest closeness bonus, earned at the dealer's minimum line offset. */
export const PRICED_IN_MAX_BONUS = 50;
/** Best possible game score: every call right, every line at the tightest dealt gap. */
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
 * Set a line off a real price: 4–15% away (at least
 * `PRICED_IN_MIN_LINE_OFFSET`), direction by coin flip. The gap is
 * small enough that either call is genuinely live, large enough that
 * the closeness bonus is earnable but rarely maxed. The line never
 * equals the price, so every round has exactly one correct side.
 */
export function pricedInLine(price: number, rng: PricedInRandom): number {
  const pct = 0.04 + sample(rng) * 0.11;
  const offset = Math.max(PRICED_IN_MIN_LINE_OFFSET, Math.round(price * pct));
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
 * bonus — the full `PRICED_IN_MAX_BONUS` at the tightest gap the
 * dealer can set (`PRICED_IN_MIN_LINE_OFFSET`), minus a point per
 * dollar the line sits beyond that gap, floored at zero. A wrong call
 * earns nothing. Anchoring the bonus to the dealer's own minimum
 * offset is what makes `PRICED_IN_MAX_SCORE` reachable from real
 * deals: a perfect game is five correct calls on five minimum-gap
 * lines.
 */
export function scorePricedInCall(round: PricedInRound, call: PricedInCall): number {
  if (!pricedInCallIsCorrect(round, call)) return 0;
  const distance = Math.round(Math.abs(round.price - round.line));
  const beyondTightest = Math.max(0, distance - PRICED_IN_MIN_LINE_OFFSET);
  return PRICED_IN_CORRECT_POINTS + Math.max(0, PRICED_IN_MAX_BONUS - beyondTightest);
}

/**
 * Identity of one complete deal: every round's player, answer and
 * line. Two deals with the same players but different prices or lines
 * are different deals. Surfaces key on this and the game state resets
 * on it, so a re-deal can never pair a fresh deal's rounds with the
 * previous deal's calls or score.
 */
export function pricedInDealIdentity(rounds: readonly PricedInRound[]): string {
  return rounds
    .map((round) => `${round.playerId}:${round.price}:${round.line}`)
    .join("|");
}

/** One scored call, kept for the reveal and the final recap. */
export type PricedInResult = {
  round: PricedInRound;
  call: PricedInCall;
  points: number;
};

/**
 * One game's session state. Every transition is a pure function over
 * this shape and enforces the deal-identity rules, so the guarantees
 * hold no matter how the surface wires its rendering:
 *
 * - state belongs to exactly one deal (its `dealIdentity`); results
 *   only ever pair with that deal's rounds;
 * - while `redealing` (Play again pressed, refresh in flight) calls
 *   and advances are ignored — the old deal's rounds can sit on
 *   screen but cannot be played;
 * - delivering a deal whose identity differs starts a fresh game
 *   atomically; delivering the same deal leaves a running game
 *   standing;
 * - the state records the exact delivery it last consumed
 *   (`deliveredRounds`). Content alone cannot distinguish a pending
 *   refresh from a completed one — the refresh may legitimately
 *   redeal identical content — so while a re-deal is outstanding,
 *   any delivery other than the recorded one is that request's
 *   answer and completes it: a different deal starts fresh, and an
 *   identical one replays the same deal as a fresh game. The
 *   recorded delivery itself (the render that still has the old
 *   props) leaves the lock standing. Every delivery advances the
 *   record, even one that leaves the game standing, so the recorded
 *   delivery is always the latest one on screen — the baseline a
 *   re-deal request is measured against.
 */
export type PricedInGameState = {
  /** Identity of the deal this state belongs to. */
  dealIdentity: string;
  /** The rounds of that deal. */
  rounds: PricedInRound[];
  /**
   * The exact rounds array last consumed as a delivery. Deliveries
   * are told apart by this reference, never by content alone: while
   * `redealing`, a `receivePricedInDeal` carrying any other array is
   * the outstanding request's answer, even when its content — and so
   * its deal identity — is identical to the deal already on screen.
   * Updated by every delivery, including ones that leave the game
   * standing, so it never lags behind the props on screen.
   */
  deliveredRounds: readonly PricedInRound[];
  roundIndex: number;
  results: PricedInResult[];
  finished: boolean;
  /** Play again pressed; input locked until the refreshed deal arrives. */
  redealing: boolean;
};

/** Start a fresh game on a dealt set of rounds. */
export function startPricedInGame(rounds: readonly PricedInRound[]): PricedInGameState {
  return {
    dealIdentity: pricedInDealIdentity(rounds),
    rounds: [...rounds],
    deliveredRounds: rounds,
    roundIndex: 0,
    results: [],
    finished: false,
    redealing: false,
  };
}

/**
 * Deliver a (possibly refreshed) deal to an in-progress game:
 *
 * - a different identity starts a fresh game on the new rounds;
 * - the same identity leaves the game standing — except while a
 *   re-deal is outstanding. Then the delivery that is not the one
 *   this state already consumed is the request's answer: identical
 *   content is a valid successful refresh, so it completes the
 *   request and replays that deal as a fresh game instead of
 *   deadlocking the lock. Re-delivering the recorded array itself
 *   (the render that still has the old props) is the pending state
 *   and changes nothing.
 *
 * Every delivery is consumed, reset or not: when the game stands,
 * the delivery ledger still advances to the array just delivered.
 * Retaining a running (or finished) game's results never requires
 * retaining an obsolete delivery reference — and if it did, the
 * ledger would lag behind the props on screen, so a later re-deal
 * request would mistake the already-visible delivery for its
 * answer and unlock the old deal before the refresh arrives.
 */
export function receivePricedInDeal(
  state: PricedInGameState,
  rounds: readonly PricedInRound[],
): PricedInGameState {
  if (pricedInDealIdentity(rounds) !== state.dealIdentity) {
    return startPricedInGame(rounds);
  }
  if (state.redealing) {
    if (rounds === state.deliveredRounds) return state;
    return startPricedInGame(rounds);
  }
  if (rounds === state.deliveredRounds) return state;
  return { ...state, deliveredRounds: rounds };
}

/**
 * Score the visitor's call on the current round. Ignored (the same
 * state returned) unless the game is awaiting a call: not while
 * re-dealing, not once finished, and not after the round was already
 * revealed.
 */
export function callPricedIn(
  state: PricedInGameState,
  call: PricedInCall,
): PricedInGameState {
  if (state.redealing || state.finished) return state;
  const round = state.rounds[state.roundIndex];
  if (!round || state.results[state.roundIndex] !== undefined) return state;
  return {
    ...state,
    results: [...state.results, { round, call, points: scorePricedInCall(round, call) }],
  };
}

/** Move past a revealed round, finishing the game after the last one. */
export function advancePricedIn(state: PricedInGameState): PricedInGameState {
  if (state.redealing || state.finished) return state;
  if (state.results[state.roundIndex] === undefined) return state;
  if (state.roundIndex === state.rounds.length - 1) return { ...state, finished: true };
  return { ...state, roundIndex: state.roundIndex + 1 };
}

/**
 * Play again: lock input and wait for the refreshed deal. The final
 * score stays on screen behind the lock; the fresh game starts when
 * `receivePricedInDeal` consumes the delivery that answers this
 * request — a different deal, or the same deal redealt identically.
 */
export function requestPricedInRedeal(state: PricedInGameState): PricedInGameState {
  if (!state.finished || state.redealing) return state;
  return { ...state, redealing: true };
}
