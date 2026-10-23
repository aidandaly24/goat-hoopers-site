/** Synthetic values and comparisons using existing approved portraits; never live history. */
import { changesDetail, changesHistory } from "./changes-fixture";

export function moversDetail(day: string, mode = "changed") {
  const d = changesDetail(day, mode);
  if (!d.players.length) return d;
  const identities = [
    { id: "2259", name: "Anthony Edwards" },
    { id: "2577", name: "Victor Wembanyama" },
    { id: "synthetic-missing-photo", name: "Synthetic Longname Alexander-Walker" },
  ];
  const after = day === "2026-10-20";
  d.players.forEach((p, i) => {
    if (identities[i]) Object.assign(p, identities[i]);
    if (i === 0) p.priceCents = mode !== "unchanged" && after ? 6280 : 5000;
    if (i === 1 && p.price) p.priceCents = mode !== "unchanged" && after ? 3050 : 4000;
    if (i === 2) p.priceCents = mode !== "unchanged" && after ? 2300 : 2500;
  });
  d.subtotalCents = d.players.reduce((sum, p) => sum + (p.priceCents ?? 0), 0);
  return d;
}
export function moversHistory(mode = "changed") {
  const h = changesHistory(mode);
  h.points = h.points.map(p => {
    const d = moversDetail(p.day, mode);
    return { ...p, subtotalCents: d.subtotalCents, priced: d.priced, rosterCount: d.rosterCount };
  });
  return h;
}
