import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createPriceHistoryArtifact, validatePriceHistoryArtifact } from "../price-history-artifact";
import type { ReconstructionInput } from "../../domain/price-history-import";
import {
  buildReconstructionConfig, deriveDirectoryProjection, deriveDraftPicks, deriveSeasonHistory,
} from "../../../scripts/lib/reconstruction-inputs";

/**
 * Pinned-input guarantees for the #217 Stage 2 producer:
 * 1. The committed inputs under data/reconstruction/ are exactly what
 *    the derivations produce from their committed sources (no drift).
 * 2. The artifact they define validates and is the dataset the
 *    committed manifest pins — gamelog points only, no annual points.
 * 3. The legacy-minutes question (the dot's post-#252 validation
 *    focus), answered empirically: minutes enter the reconstruction
 *    only as cumulative career minutes (the emaAlpha experience input
 *    and the prospectWeight blend in reconstruct-price-history.ts);
 *    trailing production reads fppg totals only, and annual points use
 *    synthetic games x 30. Of the legacy seasons, only 2024-25 carries
 *    the clock-misread (its stored tenths are the MM.SS source values
 *    misread as decimals and rounded to 0.1 — the .0/.6-thin, .7-absent
 *    tenths signature); 2021-22..2023-24 store whole minutes, where no
 *    misreading exists. Decoding the 2024-25 rows back (an
 *    approximation within ±0.1 min/row, since the stored values were
 *    already rounded) moves 2025-26 prices by a bounded amount,
 *    asserted below — the initialization sensitivity the series
 *    carries until a regeneration decision is taken separately.
 */

const DATA = fileURLToPath(new URL("../../../data/", import.meta.url));
const FIXTURES = fileURLToPath(new URL("../../test/fixtures/roster-replay/", import.meta.url));
const readJson = (base: string, name: string) => JSON.parse(readFileSync(`${base}${name}`, "utf8"));

function loadPinnedInput(): ReconstructionInput {
  const config = readJson(DATA, "reconstruction/inputs.json");
  return {
    directorySeason: config.directorySeason,
    currentSeasonStartYear: config.currentSeasonStartYear,
    directory: readJson(DATA, "reconstruction/directory.json"),
    players: readJson(DATA, "gamelog_mapped.json").players,
    seasonHistory: readJson(DATA, "reconstruction/season-history.json"),
    draftPicks: readJson(DATA, "reconstruction/draft-picks.json"),
  };
}

function modelCodeHash(): string {
  const root = fileURLToPath(new URL("../../../", import.meta.url));
  return createHash("sha256")
    .update(readFileSync(`${root}src/data/transform.ts`))
    .update(readFileSync(`${root}src/data/reconstruct-price-history.ts`))
    .digest("hex");
}

/** Mirror of scripts/prepare-gamelog.py `source_minutes_to_decimal`,
 *  applied to a stored 0.1-rounded misread value: the stored tenths
 *  digit is the source's seconds decade (29.4 was 29:35–29:44), so the
 *  decode recovers true minutes to within ±0.1. */
function decodeMisreadMinutes(raw: number): number {
  const whole = Math.floor(raw);
  const seconds = Math.round((raw - whole) * 100);
  const totalSeconds = whole * 60 + seconds;
  return Math.floor((totalSeconds * 10 + 30) / 60) / 10;
}

describe("pinned reconstruction inputs", () => {
  it("regenerate exactly from their committed sources", () => {
    const gamelog = readJson(DATA, "gamelog_mapped.json");
    const directorySnapshot = readJson(DATA, "sleeper_players.json");
    const receipts = ["2025", "2026"].map(season => ({
      draft: readJson(FIXTURES, `season-${season}-draft.json`),
      picks: readJson(FIXTURES, `season-${season}-draft-picks.json`),
    }));
    expect(deriveDirectoryProjection(directorySnapshot, Object.keys(gamelog.players)))
      .toEqual(readJson(DATA, "reconstruction/directory.json"));
    expect(deriveSeasonHistory(gamelog.players)).toEqual(readJson(DATA, "reconstruction/season-history.json"));
    expect(deriveDraftPicks(receipts)).toEqual(readJson(DATA, "reconstruction/draft-picks.json"));
    expect(buildReconstructionConfig()).toEqual(readJson(DATA, "reconstruction/inputs.json"));
  });

  it("define the manifest's dataset: valid, gamelog-only points", () => {
    const config = readJson(DATA, "reconstruction/inputs.json");
    const artifact = createPriceHistoryArtifact(loadPinnedInput(), config.source, modelCodeHash());
    validatePriceHistoryArtifact(artifact);
    const manifest = readJson(DATA, "reconstruction/manifest.json");
    expect(artifact.manifest.datasetId).toBe(manifest.datasetId);
    expect(artifact.manifest.pointsHash).toBe(manifest.pointsHash);
    expect(artifact.points.every(p => p.source === "gamelog")).toBe(true);
    expect(artifact.points.some(p => p.playerId === "1380" && p.season === "2025-26")).toBe(true);
  }, 60_000);

  it("bounds the legacy-minutes sensitivity of the emitted prices", () => {
    const config = readJson(DATA, "reconstruction/inputs.json");
    const input = loadPinnedInput();
    const asIs = createPriceHistoryArtifact(input, config.source, modelCodeHash());

    const correctedPlayers: ReconstructionInput["players"] = {};
    for (const [id, player] of Object.entries(input.players)) {
      correctedPlayers[id] = {
        games: player.games.map(game => game.season === "2024-25"
          ? { ...game, minutes: decodeMisreadMinutes(game.minutes) }
          : game),
      };
    }
    const corrected = createPriceHistoryArtifact({ ...input, players: correctedPlayers }, config.source, modelCodeHash());
    expect(corrected.manifest.datasetId).not.toBe(asIs.manifest.datasetId);

    const correctedPrices = new Map(corrected.points.map(p => [`${p.playerId}|${p.date}`, p.priceCents]));
    const bySeason = new Map<string, { total: number; changed: number; maxDelta: number }>();
    for (const point of asIs.points) {
      const bucket = bySeason.get(point.season) ?? { total: 0, changed: 0, maxDelta: 0 };
      bucket.total += 1;
      const other = correctedPrices.get(`${point.playerId}|${point.date}`);
      if (other !== point.priceCents) {
        bucket.changed += 1;
        bucket.maxDelta = Math.max(bucket.maxDelta, Math.abs((other ?? 0) - point.priceCents));
      }
      bySeason.set(point.season, bucket);
    }

    // Whole-minute seasons cannot be misread, and points priced before
    // any 2024-25 game cannot depend on 2024-25 minutes: exactly zero.
    expect(bySeason.get("2022-23")).toMatchObject({ changed: 0, maxDelta: 0 });
    expect(bySeason.get("2023-24")).toMatchObject({ changed: 0, maxDelta: 0 });
    // The misread season itself: a real but bounded effect.
    expect(bySeason.get("2024-25")!.changed).toBeGreaterThan(0);
    expect(bySeason.get("2024-25")!.changed).toBeLessThanOrEqual(5_000);
    expect(bySeason.get("2024-25")!.maxDelta).toBeLessThanOrEqual(75);
    // The season the producer emits: the effect arrives only through
    // cumulative-minutes initialization and stays within 25 cents.
    expect(bySeason.get("2025-26")!.changed).toBeGreaterThan(0);
    expect(bySeason.get("2025-26")!.changed).toBeLessThanOrEqual(2_500);
    expect(bySeason.get("2025-26")!.maxDelta).toBeLessThanOrEqual(25);
  }, 120_000);
});
