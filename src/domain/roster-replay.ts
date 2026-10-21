/**
 * roster-replay.ts — dated roster membership contract (issues #224/#217).
 *
 * The team-value-history producer (`src/data/team-value-history.ts`)
 * proves 2026 membership by inverting completed moves from today's
 * roster anchor, and — by contract — asserts nothing about 2025: the
 * 2025 roster band stays `ambiguous` there and its day detail lists the
 * 2025 league's moves as sourced events only. This contract is the
 * separate, forward direction: membership replayed FORWARD from a
 * pinned anchor, so a day's roster is asserted by the events that
 * produced it, not inferred backwards from a later one.
 *
 * Two anchor kinds exist, one per season in the league chain:
 *
 * - `draft` — the completed startup draft of the 2025 league
 *   (`1282883196567977984`, draft `1282883197582987264`). The anchor is
 *   the draft's own player→roster assignments at its completion
 *   instant; the season's completed transaction feed replays forward
 *   from it. Moves effective at or before the anchor instant are
 *   pre-anchor evidence (the four mid-draft pick-only trades) and are
 *   never applied — the anchor already reflects the draft's outcome.
 *
 * - `boundary-reconciliation` — the 2026 league (`1387473752807190528`)
 *   has no draft anchor for its keeper core: the offseason gap
 *   (2026-04-02 → 2026-08-12) carries no rows in either league's
 *   transaction feed, so no feed replays across it. The boundary
 *   roster — the state the 2026 feed's first move acted on — is
 *   DERIVED by inverting the 2026 feed from the observed current
 *   rosters, segmented at the 2026 draft (2026-10-05): post-draft
 *   moves invert first, the draft's own additions are stripped, then
 *   pre-draft moves invert. The derivation is checked against the
 *   prior season's final rosters and the per-slot silent deltas are
 *   enumerated as a reconciliation (below) — labeled reconciliation,
 *   never dressed up as transactions. On the captured evidence the
 *   delta is empty for every slot: no silent keeper cuts occurred,
 *   every departure is a recorded move, and the only non-transaction
 *   membership event in the chain is the 2026 draft itself, which is
 *   recorded in that league's draft feed and applied as a dated draft
 *   event. Gap days assert no membership at all.
 *
 * Team identity follows the roster SLOT, not the owner: slot 8 was
 * another owner's team in 2025 and is NeuralNets in 2026; the replay
 * never keys on owners.
 *
 * This contract carries membership only. Valuation is out of scope:
 * no price — recorded, modeled, or otherwise — appears here. The
 * pre-Oct-2026 price-source decision is still open and joint, and no
 * dated model inputs exist.
 *
 * Consumers (the dot's history UI) read this contract; wiring it into
 * the live team-value-history envelope — flipping the 2025 band off
 * `ambiguous` — is a separate gated step that follows the contract
 * handoff on #224, not part of the producer slice that introduced it.
 */

/** How a segment's starting roster was established. */
export type RosterReplayAnchorKind = "draft" | "boundary-reconciliation";

/**
 * One roster slot's silent delta at the season boundary: players the
 * derivation found added to or removed from the slot's roster across
 * the offseason gap with no transaction record. Both arrays are empty
 * when the boundary roster equals the prior season's final roster —
 * the proven case for the 2025→2026 boundary — but the contract
 * carries them explicitly so a future boundary with real silent cuts
 * is reported, never smoothed over.
 */
export type RosterReconciliationEntry = {
  rosterId: number;
  /** Prior-season final players absent from the derived boundary roster. */
  cuts: string[];
  /** Boundary players absent from the prior-season final roster. */
  additions: string[];
};

/** Where a membership snapshot's roster came from. */
export type RosterMembershipProvenance = {
  anchorKind: RosterReplayAnchorKind;
  /** The league whose anchor starts this segment. */
  anchorLeagueId: string;
  /** ISO instant the anchor describes. */
  anchorAt: string;
  /**
   * Completed moves applied between the anchor and this snapshot,
   * counted league-wide — the snapshot's depth in the replay, not
   * just the moves that touched this team.
   */
  movesApplied: number;
  /**
   * The slot's boundary reconciliation when the anchor is a
   * `boundary-reconciliation`; null for a draft anchor.
   */
  reconciliation: RosterReconciliationEntry | null;
};

/** One team's roster at one instant, with its provenance. */
export type RosterMembership = {
  rosterId: number;
  /** ISO instant the snapshot describes. */
  at: string;
  /** Rostered player ids, sorted. */
  playerIds: string[];
  provenance: RosterMembershipProvenance;
};
