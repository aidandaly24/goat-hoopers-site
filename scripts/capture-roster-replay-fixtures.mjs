/**
 * capture-roster-replay-fixtures.mjs — re-capture the Sleeper receipts
 * behind the roster-replay ground-truth acceptance tests (#224/#217).
 *
 *   node scripts/capture-roster-replay-fixtures.mjs
 *
 * Fetches the two league-chain seasons' drafts, draft picks,
 * transactions and rosters from Sleeper's public API (no auth), writes
 * field projections (only the fields the replay reads) to
 * src/test/fixtures/roster-replay/ plus a manifest with per-file and
 * per-raw-response SHA-256 hashes. Raw responses should be retained
 * alongside the manifest's hashes (the 2026-10-21 capture lives in the
 * goal's hidden_files, roster-replay-capture-2026-10-21).
 *
 * Re-running this re-bases the ground truth: the 2026 league is live,
 * so its current rosters and feed grow, and the acceptance test's
 * captured counts must be updated with the new capture. That is
 * deliberate — the fixtures are evidence, not constants.
 */
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://api.sleeper.app/v1";
const LEAGUES = [
  { season: "2025", leagueId: "1282883196567977984", weeks: Array.from({ length: 24 }, (_, i) => i + 1) },
  { season: "2026", leagueId: "1387473752807190528", weeks: [1] },
];
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "test", "fixtures", "roster-replay");

const sha = bytes => createHash("sha256").update(bytes).digest("hex");

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Sleeper API ${res.status} on ${path}`);
  const text = await res.text();
  return { data: JSON.parse(text), rawSha256: sha(text) };
}

const pick = (obj, keys) => Object.fromEntries(keys.map(key => [key, obj?.[key] ?? null]));
const DRAFT_KEYS = ["draft_id", "league_id", "season", "status", "type", "start_time", "last_picked"];
const DRAFT_PROJECTION = [...DRAFT_KEYS, "settings.rounds", "settings.teams", "draft_order"];
// The replay proves each pick receipt against the draft's own
// declared dimensions, so the projection carries exactly those:
// settings.rounds / settings.teams and the draft_order slot map.
const projectDraft = draft => ({
  ...pick(draft, DRAFT_KEYS),
  settings: { rounds: draft.settings?.rounds ?? null, teams: draft.settings?.teams ?? null },
  draft_order: draft.draft_order ?? null,
});
const PICK_KEYS = ["pick_no", "round", "draft_slot", "roster_id", "player_id"];
const TX_KEYS = ["transaction_id", "type", "status", "roster_ids", "leg", "created", "status_updated", "adds", "drops", "draft_picks", "settings"];
const ROSTER_KEYS = ["roster_id", "owner_id", "players"];

const manifest = {
  description: "Captured Sleeper receipts for the roster-replay ground-truth acceptance tests (#224/#217). Each fixture is a field projection of the raw response (only the fields the replay reads); raw responses are retained verbatim in the goal hidden_files (roster-replay-capture-2026-10-21) and hashed below.",
  capturedAt: new Date().toISOString(),
  projection: { draft: DRAFT_PROJECTION, draftPicks: PICK_KEYS, transactions: TX_KEYS, rosters: ROSTER_KEYS },
  files: {},
};

await mkdir(OUT, { recursive: true });

for (const { season, leagueId, weeks } of LEAGUES) {
  const drafts = await getJson(`/league/${leagueId}/drafts`);
  const completed = drafts.data.filter(draft => draft.status === "complete");
  if (completed.length !== 1) throw new Error(`League ${leagueId}: expected exactly one completed draft`);
  const draft = completed[0];
  const picks = await getJson(`/draft/${draft.draft_id}/picks`);
  const rosters = await getJson(`/league/${leagueId}/rosters`);
  const txWeeks = [];
  const txRaws = {};
  for (const week of weeks) {
    const result = await getJson(`/league/${leagueId}/transactions/${week}`);
    txWeeks.push(result.data);
    txRaws[`tx${season}_w${week}`] = result.rawSha256;
  }
  const entries = [
    [`season-${season}-draft.json`, projectDraft(draft), [`${BASE}/league/${leagueId}/drafts`], { [`drafts_${season}`]: drafts.rawSha256 }],
    [`season-${season}-draft-picks.json`, picks.data.map(entry => pick(entry, PICK_KEYS)), [`${BASE}/draft/${draft.draft_id}/picks`], { [`draft_picks_${draft.draft_id}`]: picks.rawSha256 }],
    [`season-${season}-transactions.json`, txWeeks.flat().map(entry => pick(entry, TX_KEYS)), weeks.map(week => `${BASE}/league/${leagueId}/transactions/${week}`), txRaws],
    [`season-${season}-rosters.json`, rosters.data.map(entry => pick(entry, ROSTER_KEYS)), [`${BASE}/league/${leagueId}/rosters`], { [`rosters_${season}`]: rosters.rawSha256 }],
  ];
  for (const [name, data, sources, rawSha256] of entries) {
    const blob = `${JSON.stringify(data, null, 1)}\n`;
    await writeFile(join(OUT, name), blob);
    manifest.files[name] = { sha256: sha(blob), bytes: Buffer.byteLength(blob), sources, rawSha256 };
    console.log(name, Buffer.byteLength(blob), "bytes");
  }
}

await writeFile(join(OUT, "manifest.json"), `${JSON.stringify(manifest, null, 1)}\n`);
console.log("manifest written");
