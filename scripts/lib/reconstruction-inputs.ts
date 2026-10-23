/**
 * Pinned reconstruction inputs for the #217 Stage 2 modeled backfill.
 *
 * The price-history artifact's inputs (directory / seasonHistory /
 * draftPicks) previously existed only in an operator-run prepare flow
 * and were never committed, so the published dataset could not be
 * reproduced from the repo. These derivations pin them to committed
 * sources, deterministically:
 *
 * - directory: a projection of the committed Sleeper directory snapshot
 *   (data/sleeper_players.json), restricted to the gamelog's scope.
 * - seasonHistory: derived from the committed game logs themselves
 *   (per-player per-season games played and mean fppg). Because the
 *   derived totals exactly match the gamelog coverage, the
 *   reconstruction engine's annual ("backtest") fallback can never
 *   fire from these inputs — the artifact is gamelog points only,
 *   which is what the frozen #217 contract admits to the daily series.
 * - draftPicks: the league's two Sleeper draft receipts, captured as
 *   committed roster-replay fixtures, with availableOn set to each
 *   draft's completion day (a pick can only influence prices from the
 *   day its draft completed).
 *
 * Pure functions only — the prepare script does the file IO.
 */
import type { ReconstructionInput } from "../../src/domain/price-history-import";

type DirectorySource = Record<string, { birth_date?: unknown; years_exp?: unknown } | undefined>;
type GamelogPlayers = ReconstructionInput["players"];
type DraftReceipt = { last_picked: number };
type DraftPickReceipt = { pick_no: number; player_id: string };

const round2 = (n: number) => Math.round(n * 100) / 100;
const byNumericId = (a: string, b: string) => Number(a) - Number(b);

/** Directory projection for exactly the gamelog's player scope. Fails
 *  loudly if the snapshot cannot describe a scoped player: a silently
 *  defaulted birth date or experience would corrupt the model inputs. */
export function deriveDirectoryProjection(
  directory: DirectorySource,
  scopePlayerIds: readonly string[]
): ReconstructionInput["directory"] {
  const out: ReconstructionInput["directory"] = {};
  for (const id of [...scopePlayerIds].sort(byNumericId)) {
    const entry = directory[id];
    if (!entry) throw new Error(`Directory snapshot has no entry for gamelog player ${id}`);
    if (typeof entry.birth_date !== "string" || entry.birth_date.length === 0) {
      throw new Error(`Directory snapshot has no birth_date for gamelog player ${id}`);
    }
    if (typeof entry.years_exp !== "number" || !Number.isFinite(entry.years_exp)) {
      throw new Error(`Directory snapshot has no years_exp for gamelog player ${id}`);
    }
    out[id] = { birth_date: entry.birth_date, years_exp: entry.years_exp };
  }
  return out;
}

/** Per-player per-season totals from the game logs: games played and
 *  mean fppg (the engine's own season-history shape). Minutes are
 *  deliberately NOT carried: trailing production in the reconstruction
 *  reads fppg totals only. */
export function deriveSeasonHistory(players: GamelogPlayers): ReconstructionInput["seasonHistory"] {
  const out: ReconstructionInput["seasonHistory"] = {};
  for (const id of Object.keys(players).sort(byNumericId)) {
    const bySeason = new Map<string, { fppgTotal: number; games: number }>();
    for (const game of players[id].games) {
      const season = game.season.slice(0, 4);
      const bucket = bySeason.get(season) ?? { fppgTotal: 0, games: 0 };
      bucket.fppgTotal += game.fppg;
      bucket.games += 1;
      bySeason.set(season, bucket);
    }
    out[id] = [...bySeason.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([season, bucket]) => ({ season, fppg: round2(bucket.fppgTotal / bucket.games), games: bucket.games }));
  }
  return out;
}

/** League draft picks from the captured draft receipts. availableOn is
 *  the UTC day the draft completed (its last pick), so no pick can
 *  influence a price dated before its draft finished. */
export function deriveDraftPicks(
  drafts: readonly { draft: DraftReceipt; picks: readonly DraftPickReceipt[] }[]
): ReconstructionInput["draftPicks"] {
  const out: ReconstructionInput["draftPicks"] = [];
  for (const { draft, picks } of drafts) {
    const availableOn = new Date(draft.last_picked).toISOString().slice(0, 10);
    for (const pick of picks) out.push({ playerId: pick.player_id, pick: pick.pick_no, availableOn });
  }
  return out.sort((a, b) => a.availableOn.localeCompare(b.availableOn) || a.pick - b.pick
    || Number(a.playerId) - Number(b.playerId));
}

/** The artifact source block: what the inputs are, their frozen
 *  revision, the scoring the gamelog fppg was derived under, and the
 *  limitations a reviewer must know — including the legacy-minutes one. */
export function reconstructionSource() {
  return {
    description: "GOAT Hoopers #217 Stage 2 pinned reconstruction inputs: Sleeper-mapped NBA game logs "
      + "(data/gamelog_mapped.json), a directory projection of the committed Sleeper directory snapshot "
      + "(data/sleeper_players.json), season history derived deterministically from the same game logs, and "
      + "the league's two Sleeper draft receipts (committed roster-replay fixtures).",
    revision: "gamelog_mapped.json at PR #252 (merge 3bcc19b; 2025-26 mapped sha256 b0a888af), "
      + "sleeper_players.json committed snapshot, roster-replay fixtures captured 2026-10-21",
    scoring: {
      pts: 0.5, reb: 1, ast: 1, stl: 2, blk: 2, tov: -1, fg3m: 0.5,
      dd_bonus: 1, td_bonus: 2, bonus_40p: 2, bonus_50p: 2, bonus_ast15: 2, bonus_reb20: 2,
    },
    limitations: [
      "Season history is derived from the same committed game logs (per-player per-season games and mean "
        + "fppg); no external season-total export is pinned. Derived coverage is therefore complete for "
        + "every listed season and the artifact emits no backtest (annual) points.",
      "Directory birth dates and years_exp are as of the committed snapshot (directorySeason 2026).",
      "Draft picks are the 2025 startup draft (availableOn 2025-10-20) and the 2026 rookie draft "
        + "(availableOn 2026-10-05); a player in neither draft carries the replacement-level pedigree prior.",
      "Pre-2025-26 minutes in data/gamelog_mapped.json remain in the legacy clock-misread units disclosed "
        + "on PR #252 (regenerating them is a separate decision). Minutes enter the reconstruction only as "
        + "cumulative career minutes — the emaAlpha experience input and the prospectWeight pedigree blend "
        + "(src/data/reconstruct-price-history.ts) — never in trailing production (fppg totals only) and "
        + "never in annual points (synthetic games x 30). The measured sensitivity of the artifact to "
        + "decoding those legacy minutes is pinned in data/reconstruction/README.md and guarded by "
        + "src/data/__tests__/modeled-backfill-inputs.test.ts.",
      "Gamelog fppg omits ff/tf penalties; the source logs carry neither field (inherited from the dataset audit).",
    ],
  };
}

/** The frozen prepare config (the shape scripts/backfill-price-history.ts
 *  consumes), with paths relative to data/reconstruction/. */
export function buildReconstructionConfig() {
  return {
    directorySeason: 2026,
    currentSeasonStartYear: 2026,
    directoryPath: "directory.json",
    gamelogPath: "../gamelog_mapped.json",
    seasonHistoryPath: "season-history.json",
    draftPicksPath: "draft-picks.json",
    source: reconstructionSource(),
  };
}
