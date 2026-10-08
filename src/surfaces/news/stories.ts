import type { NewsArticle, NewsSection } from "@/domain/news";

/** A presentation bundle, not a new league event or upstream identity. */
export type ReadingStory = { primary: NewsArticle; reactions: NewsArticle[] };
export const KIND_LABEL: Record<NewsArticle["kind"], string> = {
  trade: "Trade", waiver: "Waiver", rookie: "Rookie", rumor: "Rumor", take: "Hot take",
};
const VOICE_ORDER = ["espn", "athletic", "shams", "bleacher", "bayless"];
function family(a: NewsArticle): string | null {
  const suffix = `-${a.publication}`;
  if (!a.id.endsWith(suffix)) return null;
  const key = a.id.slice(0, -suffix.length);
  if (a.kind === "rookie" && /^rookie-[1-9]\d*$/.test(key)) return key;
  if ((a.kind === "trade" || a.kind === "waiver") &&
      new RegExp(`^${a.kind}-\\d+-[a-zA-Z0-9]{1,6}$`).test(key)) return key;
  return null;
}
function references(a: NewsArticle): string {
  return JSON.stringify([
    a.players.map(p => [p.playerId, p.name]).sort(),
    a.teams.map(t => [t.teamId, t.name]).sort(),
  ]);
}
/** Fail closed for unknown/ambiguous keys. Never infer an event from names. */
export function readingStories(articles: NewsArticle[], section: NewsSection): ReadingStory[] {
  const visible = articles.filter(a => section === "latest" || a.section === section)
    .toSorted((a, b) => b.publishedAt - a.publishedAt || a.id.localeCompare(b.id));
  const families = new Map<string, NewsArticle[]>();
  for (const a of visible) {
    const key = family(a);
    if (key) {
      const scoped = `${a.kind}:${a.section}:${key}`;
      families.set(scoped, [...(families.get(scoped) ?? []), a]);
    }
  }
  const emitted = new Set<string>();
  const out: ReadingStory[] = [];
  for (const a of visible) {
    if (emitted.has(a.id)) continue;
    const key = family(a);
    const candidates = key ? families.get(`${a.kind}:${a.section}:${key}`)! : [a];
    const safe = candidates.every(b => references(b) === references(a)) &&
      new Set(candidates.map(b => b.publication)).size === candidates.length;
    const reactions = (safe ? candidates : [a]).toSorted((x, y) =>
      VOICE_ORDER.indexOf(x.publication) - VOICE_ORDER.indexOf(y.publication));
    reactions.forEach(b => emitted.add(b.id));
    out.push({ primary: reactions[0], reactions });
  }
  return out;
}
/** Fixed UTC metadata avoids hydration drift and does not imply event dates. */
export function storyDate(ts: number): string {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(ts);
}
