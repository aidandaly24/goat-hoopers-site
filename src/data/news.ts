import type {
  DraftPick,
  NewsArticle,
  NewsKind,
  NewsSection,
  PlayerMove,
  PlayerRef,
  PublicationId,
  Team,
  Transaction,
} from "@/domain";

/**
 * generateLeagueNews — the League News Network's printing press.
 *
 * Pure function: real league events in, voiced articles out. Every major
 * event (trades, waiver splashes, rookie draft picks) becomes a set of
 * articles, one per fictional publication, each with its own voice:
 * ESPN (serious), The Athletic (nerd shit), Bleacher Report (DRAMATIC),
 * Shams (trade breaking), Skip Bayless (insane). Rumors and hot takes are
 * generated from real signals (repeat trades, busy front offices) and are
 * always labeled as what they are.
 *
 * Deterministic from the inputs — no AI, no invented facts beyond the
 * color commentary.
 */

export type NewsInputs = {
  transactions: Transaction[];
  picks: DraftPick[];
  teams: Team[];
};

const MAX_ARTICLES = 40;

function article(
  id: string,
  publication: PublicationId,
  kind: NewsKind,
  section: NewsSection,
  headline: string,
  body: string[],
  publishedAt: number,
  players: PlayerRef[]
): NewsArticle {
  // Dedupe by player — the same name can surface twice in a trade.
  const seen = new Set<string>();
  const unique = players.filter((p) =>
    seen.has(p.playerId) ? false : (seen.add(p.playerId), true)
  );
  return {
    id,
    publication,
    kind,
    section,
    headline,
    body,
    publishedAt,
    players: unique,
  };
}

/** "A, B and C" human joining. */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

type TradeView = {
  tx: Transaction;
  a: { teamName: string; received: string[] };
  b: { teamName: string; received: string[] };
  headliner: string;
  /** Every player changing teams, for cross-linking. */
  players: PlayerRef[];
};

function tradeView(tx: Transaction): TradeView | null {
  const sides = (tx.sides ?? []).filter((s) => s.received.length > 0);
  if (sides.length < 2) return null;
  const [a, b] = sides;
  const headlinerMove = a.received[0] ?? b.received[0];
  if (!headlinerMove) return null;
  const toRefs = (moves: PlayerMove[]): PlayerRef[] =>
    moves.map((m) => ({ playerId: m.playerId, name: m.name }));
  return {
    tx,
    a: { teamName: a.teamName, received: a.received.map((m) => m.name) },
    b: { teamName: b.teamName, received: b.received.map((m) => m.name) },
    headliner: headlinerMove.name,
    players: [...toRefs(a.received), ...toRefs(b.received)],
  };
}

function tradeCoverage(t: TradeView, key: string): NewsArticle[] {
  const { tx, a, b, headliner } = t;
  const out: NewsArticle[] = [];
  // Stagger timestamps so the five voices read as a developing story.
  const at = (mins: number) => tx.createdAt + mins * 60_000;

  out.push(
    article(
      `trade-${key}-shams`,
      "shams",
      "trade",
      "latest",
      `Sources: ${a.teamName} finalizing deal to acquire ${headliner} from ${b.teamName}`,
      [
        `League sources tell Shams that ${a.teamName} and ${b.teamName} are finalizing a trade centered on ${headliner}.`,
        `${a.teamName} will receive ${joinNames(a.received)}. ${b.teamName} gets ${joinNames(b.received)} in return.`,
        `The deal is expected to process ahead of the next waiver run. A developing story — more to come.`,
      ],
      at(0),
      t.players
    ),
    article(
      `trade-${key}-espn`,
      "espn",
      "trade",
      "latest",
      `${a.teamName} lands ${headliner} from ${b.teamName}: what it means`,
      [
        `${a.teamName} made its move, acquiring ${headliner} from ${b.teamName} in a deal that reshapes both sides' dynasty outlooks.`,
        `For ${a.teamName}, the logic is straightforward: ${joinNames(a.received)} ${a.received.length > 1 ? "add" : "adds"} win-now juice to a roster that is clearly not waiting around. For ${b.teamName}, this is the long game — ${joinNames(b.received)} ${b.received.length > 1 ? "are" : "is"} a bet on runway over results.`,
        `Verdict: both teams walk away with something real, but ${a.teamName} is swinging for the fences while ${b.teamName} plays the odds. That is how dynasties get built — or broken.`,
      ],
      at(25),
      t.players
    ),
    article(
      `trade-${key}-athletic`,
      "athletic",
      "trade",
      "latest",
      `The ${headliner} trade, by the numbers: surplus value, roster construction and who actually won`,
      [
        `Start with the surplus math. In a ten-team dynasty where every FAAB dollar is a vote, ${headliner} moving to ${a.teamName} reprices two rosters at once — and the market rarely gets these wrong in the first 48 hours.`,
        `${b.teamName}'s return — ${joinNames(b.received)} — reads like a portfolio rebalance: diversified, younger-leaning, and insulated against a single point of failure. ${a.teamName}, meanwhile, consolidated. Consolidation wins championships when the consolidated piece is the best player in the deal.`,
        `The nerd verdict: ${a.teamName} paid fair value for certainty, ${b.teamName} bought variance at a discount. Both GMs can defend this with a straight face, which is the hallmark of a genuinely good trade.`,
      ],
      at(70),
      t.players
    ),
    article(
      `trade-${key}-bleacher`,
      "bleacher",
      "trade",
      "latest",
      `LEAGUE-SHAKING BLOCKBUSTER: ${a.teamName.toUpperCase()} SWIPES ${headliner.toUpperCase()}`,
      [
        `STOP WHAT YOU ARE DOING. ${a.teamName} just detonated the trade market, prying ${headliner} away from ${b.teamName} in a deal nobody saw coming.`,
        `${b.teamName} walks away with ${joinNames(b.received)}, which is a perfectly respectable return right up until you remember they just handed ${a.teamName} a franchise cornerstone.`,
        `Winners: ${a.teamName}. Losers: the other eight teams, who now have to game-plan around ${headliner} for the next decade. The group chat is in shambles.`,
      ],
      at(120),
      t.players
    ),
    article(
      `trade-${key}-bayless`,
      "bayless",
      "trade",
      "takes",
      `${a.teamName} just made the most OVERRATED move in league history, and I will tell you why`,
      [
        `I have NEVER seen a more overrated asset than ${headliner}. NEVER. And ${a.teamName} just backed up the truck for him like he is some kind of can't-miss cornerstone.`,
        `${b.teamName} just robbed ${a.teamName} blind, and the rest of this league is too polite to say it. I am not polite. ${joinNames(b.received)} ${b.received.length > 1 ? "are" : "is"} going to age like fine wine while ${headliner} ages like milk.`,
        `Mark my words: five years from now, this trade will be remembered as the exact moment ${a.teamName}'s so-called dynasty DIED. You heard it here first.`,
      ],
      at(180),
      t.players
    )
  );
  return out;
}

function waiverCoverage(
  tx: Transaction,
  key: string,
  teamName: (id: string) => string
): NewsArticle[] {
  const team = teamName(tx.teamIds[0] ?? "");
  const names = tx.adds.map((m) => m.name);
  if (names.length === 0) return [];
  const headliner = names[0];
  const at = (mins: number) => tx.createdAt + mins * 60_000;
  return [
    article(
      `waiver-${key}-shams`,
      "shams",
      "waiver",
      "latest",
      `Sources: ${team} adds ${headliner}${names.length > 1 ? ` in multi-player waiver swoop` : ""}`,
      [
        `League sources tell Shams that ${team} has claimed ${joinNames(names)} off the wire.`,
        `The move signals ${team} is done waiting on its current rotation. Expect the FAAB ledger to reflect it.`,
      ],
      at(0),
      tx.adds.map((m) => ({ playerId: m.playerId, name: m.name }))
    ),
    article(
      `waiver-${key}-espn`,
      "espn",
      "waiver",
      "latest",
      `${team} shakes up its roster, betting on ${headliner}`,
      [
        `In a league where the wire is a second draft, ${team} just made its move — adding ${joinNames(names)}.`,
        `${headliner} is the name to watch: this is the kind of low-cost, high-upside swing that separates active managers from passengers.`,
        `The cost was opportunity, not capital. If it hits, ${team} looks brilliant. If it misses, nobody remembers by December.`,
      ],
      at(40),
      tx.adds.map((m) => ({ playerId: m.playerId, name: m.name }))
    ),
    article(
      `waiver-${key}-bleacher`,
      "bleacher",
      "waiver",
      "latest",
      `${team.toUpperCase()} IS COOKING: ${headliner.toUpperCase()} HEADS TO A NEW HOME`,
      [
        `The waiver wire just got SPICY. ${team} swooped in and grabbed ${joinNames(names)}, and the rest of the league was apparently asleep at the wheel.`,
        `Is ${headliner} a league-winner? Probably not. Is this the kind of move that wins leagues in the margins? ABSOLUTELY.`,
      ],
      at(90),
      tx.adds.map((m) => ({ playerId: m.playerId, name: m.name }))
    ),
  ];
}

function rookieCoverage(pick: DraftPick, teams: Team[]): NewsArticle[] {
  const team = teams.find((t) => t.id === pick.teamId)?.name ?? "A team";
  const now = Date.now();
  const at = (hours: number) => now - hours * 3_600_000;
  const pos = pick.position ? ` (${pick.position})` : "";
  const nba = pick.nbaTeam ? `, ${pick.nbaTeam}` : "";
  return [
    article(
      `rookie-${pick.pickNo}-espn`,
      "espn",
      "rookie",
      "rookies",
      `${pick.playerName} goes No. ${pick.pickNo} to ${team}: instant reaction`,
      [
        `${team} didn't overthink it, taking ${pick.playerName}${pos}${nba} with the No. ${pick.pickNo} overall pick in the rookie draft.`,
        `The fit is clean: a dynasty roster is a portfolio, and ${pick.playerName} is a growth asset with a long runway. ${team} just bought years.`,
        `Early verdict: sensible process, sensible pick. The boring picks are usually the right ones.`,
      ],
      at(pick.pickNo),
      [{ playerId: pick.playerId, name: pick.playerName }]
    ),
    article(
      `rookie-${pick.pickNo}-athletic`,
      "athletic",
      "rookie",
      "rookies",
      `The math behind ${pick.playerName} at No. ${pick.pickNo}: draft-slot value and the rookie curve`,
      [
        `Draft slot value is the most underpriced inefficiency in dynasty, and ${team} just exploited it. Historical hit rates say a top-${Math.min(pick.pickNo, 10)} pick returns a starter far more often than the market prices in.`,
        `${pick.playerName}${pos} profiles as exactly the archetype that beats the rookie curve: young, with a real NBA pathway${nba ? ` in ${pick.nbaTeam}'s rotation mix` : ""}. The variance is real, but the expected value at No. ${pick.pickNo} is firmly positive.`,
        `Translation for the non-nerds: good pick. The spreadsheet approves.`,
      ],
      at(pick.pickNo + 2),
      [{ playerId: pick.playerId, name: pick.playerName }]
    ),
    article(
      `rookie-${pick.pickNo}-bleacher`,
      "bleacher",
      "rookie",
      "rookies",
      `${team.toUpperCase()} JUST DRAFTED A PROBLEM: ${pick.playerName.toUpperCase()} AT NO. ${pick.pickNo}`,
      [
        `The rest of the league should be TERRIFIED. ${team} just walked out of the rookie draft with ${pick.playerName}${pos}, and the timeline on this pick is measured in years of regret for everyone else.`,
        `No. ${pick.pickNo} overall. Remember where you were when the steal of the draft happened, because you will be telling this story for a decade.`,
      ],
      at(pick.pickNo + 4),
      [{ playerId: pick.playerId, name: pick.playerName }]
    ),
  ];
}

function rumorMill(
  transactions: Transaction[],
  teamName: (id: string) => string
): NewsArticle[] {
  const out: NewsArticle[] = [];
  const now = Date.now();

  // Players moved in 2+ trades: "on the block" energy.
  const tradeCount = new Map<string, { name: string; n: number }>();
  for (const t of transactions) {
    if (t.type !== "trade") continue;
    for (const m of [...t.adds, ...t.drops]) {
      const cur = tradeCount.get(m.playerId) ?? { name: m.name, n: 0 };
      cur.n += 1;
      tradeCount.set(m.playerId, cur);
    }
  }
  let i = 0;
  for (const [playerId, { name, n }] of tradeCount.entries()) {
    if (n < 2 || i >= 2) continue;
    i += 1;
    out.push(
      article(
        `rumor-block-${i}`,
        "shams",
        "rumor",
        "rumors",
        `Sources: ${name} generating trade buzz after being moved ${n} times`,
        [
          `League sources tell Shams that ${name}'s name keeps coming up in trade talks around GOAT Hoopers.`,
          `Moved ${n} times already, ${name} has become the league's most-rumored asset — and where there's this much smoke, rival GMs are at least making calls.`,
          `This is the rumor mill, not a done deal. But the phones are ringing.`,
        ],
        now - i * 5 * 3_600_000,
        [{ playerId, name }]
      )
    );
  }

  // Busiest front office.
  const movesByTeam = new Map<string, number>();
  for (const t of transactions) {
    for (const id of t.teamIds) {
      movesByTeam.set(id, (movesByTeam.get(id) ?? 0) + 1);
    }
  }
  const busiest = [...movesByTeam.entries()].sort((a, b) => b[1] - a[1])[0];
  if (busiest && busiest[1] >= 3) {
    const name = teamName(busiest[0]);
    out.push(
      article(
        `rumor-busy-1`,
        "espn",
        "rumor",
        "rumors",
        `${name} is running the league's busiest front office — what's next?`,
        [
          `Nobody in GOAT Hoopers is working the phones like ${name}, already involved in ${busiest[1]} transactions and counting.`,
          `League sources describe the approach as "aggressively opportunistic" — every wire run, every trade call, every marginal upgrade.`,
          `The speculation around the league: something bigger is brewing. Front offices this active don't stay quiet for long.`,
        ],
        now - 9 * 3_600_000,
        []
      )
    );
  }

  // Most-dropped notable player: buy-low watch.
  const dropCount = new Map<string, { name: string; n: number }>();
  for (const t of transactions) {
    for (const m of t.drops) {
      const cur = dropCount.get(m.playerId) ?? { name: m.name, n: 0 };
      cur.n += 1;
      dropCount.set(m.playerId, cur);
    }
  }
  const mostDropped = [...dropCount.entries()].sort((a, b) => b[1].n - a[1].n)[0];
  if (mostDropped && mostDropped[1].n >= 1) {
    const [playerId, { name }] = mostDropped;
    out.push(
      article(
        `rumor-buylow-1`,
        "athletic",
        "rumor",
        "rumors",
        `Buy-low watch: the nerd case for stashing ${name}`,
        [
          `Cut loose and sitting on the wire, ${name} is the kind of profile the model flags: real NBA pathway, short-term noise depressing the price.`,
          `The base rate on post-drop breakouts is low — let's be honest about that — but the acquisition cost is zero FAAB dollars and a roster spot. The expected value math is quietly friendly.`,
          `File under: speculation, but the spreadsheet-approved kind.`,
        ],
        now - 14 * 3_600_000,
        [{ playerId, name }]
      )
    );
  }

  return out;
}

function hotTakes(
  transactions: Transaction[],
  picks: DraftPick[],
  teamName: (id: string) => string
): NewsArticle[] {
  const out: NewsArticle[] = [];
  const now = Date.now();

  const trades = transactions.filter((t) => t.type === "trade");
  const view = trades.length > 0 ? tradeView(trades[0]) : null;
  if (view) {
    const { a, headliner } = view;
    const headlinerRef =
      view.players.find((p) => p.name === headliner) ?? view.players[0];
    out.push(
      article(
        `take-trade-1`,
        "bayless",
        "take",
        "takes",
        `I am DONE being quiet: ${headliner} is fool's gold and ${a.teamName} fell for it`,
        [
          `Everybody wants to celebrate ${a.teamName} today. Not me. I have watched this movie before, and it ends with ${headliner} on somebody's bench by February while ${a.teamName}'s group chat goes silent.`,
          `You want the truth? The best ability is AVAILABILITY, and I have questions. Big questions. Questions nobody in this league wants to ask because they're all too busy high-fiving.`,
          `Bookmark this. SCREENSHOT this. When I'm right — and I am ALWAYS right — I don't want to hear a word.`,
        ],
        now - 3 * 3_600_000,
        headlinerRef ? [headlinerRef] : []
      )
    );
  }

  const firstPick = picks.find((p) => p.pickNo === 1) ?? picks[0];
  if (firstPick) {
    const team = teamName(firstPick.teamId);
    out.push(
      article(
        `take-rookie-1`,
        "bayless",
        "take",
        "takes",
        `The No. 1 pick is a SMOKESCREEN and ${team} knows it`,
        [
          `${firstPick.playerName} at No. 1? Please. I've seen summer-league mirages before, and ${team} just bet its future on a HIGHLIGHT REEL.`,
          `Meanwhile the REAL steal of this draft is going to come from the back half of the first round, and when it happens, remember who told you first. ME.`,
          `The draft industrial complex wants you to believe in consensus. I believe in CHAOS.`,
        ],
        now - 7 * 3_600_000,
        [{ playerId: firstPick.playerId, name: firstPick.playerName }]
      )
    );
  }

  return out;
}

/**
 * Build the full news feed, newest first. Empty inputs → empty feed;
 * surfaces render their honest empty states.
 */
export function generateLeagueNews(input: NewsInputs): NewsArticle[] {
  const { transactions, picks, teams } = input;
  const teamName = (id: string) =>
    teams.find((t) => t.id === id)?.name ?? "A team";

  const articles: NewsArticle[] = [];

  // Trades: up to 3 most recent, full five-publication treatment.
  const trades = transactions.filter((t) => t.type === "trade").slice(0, 3);
  trades.forEach((tx, i) => {
    const view = tradeView(tx);
    if (view) articles.push(...tradeCoverage(view, `${i}-${tx.id.slice(0, 6)}`));
  });

  // Waiver splashes: multi-add moves, up to 2.
  const splashes = transactions
    .filter((t) => t.type !== "trade" && t.adds.length >= 2)
    .slice(0, 2);
  splashes.forEach((tx, i) =>
    articles.push(...waiverCoverage(tx, `${i}-${tx.id.slice(0, 6)}`, teamName))
  );

  // Rookie draft: top 10 picks.
  picks
    .filter((p) => p.pickNo <= 10)
    .forEach((p) => articles.push(...rookieCoverage(p, teams)));

  // Rumor mill + hot takes from real signals.
  articles.push(...rumorMill(transactions, teamName));
  articles.push(...hotTakes(transactions, picks, teamName));

  return articles
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, MAX_ARTICLES);
}
