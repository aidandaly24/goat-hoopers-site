/** Declared active lineup only. BN, reserve and taxi never add starting slots.
 * Slot assignment/position eligibility and game-selection rules require their
 * own source evidence; this declaration does not establish either of them.
 * This v1 declaration is immutable: add a new version and retain this decoder
 * rather than editing its slots or coverage when league rules change. */
export const GOAT_LINEUP_POLICY = Object.freeze({
  version: "goat-eleven-starters-v1" as const,
  starterSlots: Object.freeze(["PG", "SG", "G", "SF", "PF", "F", "C", "UTIL", "UTIL", "UTIL", "UTIL"]),
  /** At least 80% observed prior production: ceil(11 * .8), never 8/11. */
  minimumObservedStarters: 9,
});
