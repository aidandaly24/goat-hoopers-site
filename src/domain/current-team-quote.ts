import type { HomeTeamSummary } from "./personalized-home";

/** The existing headline calculation, never a saved or retrospective point.
 * calculationId binds this view's time, roster, prices and basis. It is not an
 * assertion about a historical dataset or an unavailable engine revision. */
export type CurrentTeamQuote = {
  version: 1;
  kind: "current-modeled";
  calculationId: string;
  teamId: string;
  calculatedAt: string;
  pricingBasis: "preseason" | "in-season";
  knownRoster: boolean;
  rosterCount: number | null;
  priced: number;
  subtotalCents: number | null;
  complete: boolean;
  players: { id: string; name: string; position: string | null; priceCents: number | null }[];
};

type CurrentQuoteInput = Pick<HomeTeamSummary, "market" | "valuation" | "rosterValues"> & {
  team: Pick<HomeTeamSummary["team"], "id">;
};
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 300;
const cents = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
function identity(quote: Omit<CurrentTeamQuote, "calculationId"> | CurrentTeamQuote): string {
  return "cq1:" + JSON.stringify([quote.teamId, quote.calculatedAt, quote.pricingBasis, quote.knownRoster,
    quote.players.map(player => [player.id, player.priceCents])]);
}

export function isCurrentTeamQuote(value: unknown): value is CurrentTeamQuote {
  if (!value || typeof value !== "object") return false;
  const q = value as CurrentTeamQuote;
  if (q.version !== 1 || q.kind !== "current-modeled" || !text(q.teamId)
    || typeof q.calculatedAt !== "string" || !Number.isFinite(Date.parse(q.calculatedAt))
    || new Date(q.calculatedAt).toISOString() !== q.calculatedAt
    || !["preseason", "in-season"].includes(q.pricingBasis)
    || typeof q.knownRoster !== "boolean" || typeof q.complete !== "boolean"
    || !cents(q.priced) || !Array.isArray(q.players) || q.players.length > 60) return false;
  const ids = new Set<string>();
  let total = 0, priced = 0, previous = "";
  for (const p of q.players) {
    if (!p || !text(p.id) || !text(p.name) || !(p.position === null || text(p.position))
      || ids.has(p.id) || p.id < previous || !(p.priceCents === null || cents(p.priceCents))) return false;
    ids.add(p.id); previous = p.id;
    if (p.priceCents !== null) { total += p.priceCents; priced++; }
  }
  if (!Number.isSafeInteger(total) || priced !== q.priced) return false;
  if (!q.knownRoster) {
    if (q.players.length || q.rosterCount !== null || q.priced || q.subtotalCents !== null || q.complete) return false;
  } else {
    if (q.rosterCount !== q.players.length || q.subtotalCents !== (priced || !q.players.length ? total : null)
      || q.complete !== (q.priced === q.rosterCount && q.subtotalCents !== null)) return false;
  }
  return q.calculationId === identity(q);
}

/** Pure projection of one HomeTeamSummary; no pricing, fetching or persistence. */
export function currentTeamQuote(summary: CurrentQuoteInput): CurrentTeamQuote | null {
  const { valuation, market, team, rosterValues } = summary;
  if (!market || !Number.isFinite(market.updatedAt) || !Number.isFinite(new Date(market.updatedAt).getTime())) return null;
  if (!(valuation.total === null || Number.isFinite(valuation.total) && valuation.total >= 0)) return null;
  const byId = new Map(rosterValues.map(player => [player.id, player]));
  if (byId.size !== rosterValues.length || valuation.players.length !== rosterValues.length) return null;
  const players: CurrentTeamQuote["players"] = [];
  for (const player of valuation.players) {
    const named = byId.get(player.id);
    if (!named || named.value !== player.value || !(player.value === null
      || Number.isFinite(player.value) && player.value >= 0 && cents(Math.round(player.value * 100)))) return null;
    players.push({ id: player.id, name: named.name, position: named.position,
      priceCents: player.value === null ? null : Math.round(player.value * 100) });
  }
  players.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const q: CurrentTeamQuote = {
    version: 1, kind: "current-modeled", calculationId: "", teamId: team.id,
    calculatedAt: new Date(market.updatedAt).toISOString(), pricingBasis: market.pricingBasis,
    knownRoster: valuation.knownRoster, rosterCount: valuation.knownRoster ? players.length : null,
    priced: valuation.priced, subtotalCents: valuation.total === null ? null : Math.round(valuation.total * 100),
    complete: valuation.complete, players,
  };
  q.calculationId = identity(q);
  return valuation.unpriced === players.length - q.priced && isCurrentTeamQuote(q) ? q : null;
}
