import Link from "next/link";
import { formatSeasonStatus } from "@/domain";
import type { HomeTeamSummary, PersonalizedHomeData } from "@/domain/personalized-home";
import { AI_PROBABILITY_LABEL } from "@/domain/ai-decider";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import controls from "@/ui/controls.module.css";
import styles from "./PersonalizedHome.module.css";
import { TeamPlayerGuide } from "./TeamPlayerGuide";

const points = (value: number | null) => value !== null && Number.isFinite(value) ? value.toFixed(1) : "Pending";
const timestamp = (value: string | number | null) => value !== null && Number.isFinite(new Date(value).getTime())
  ? `${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value))} UTC` : "Unavailable";
const record = (team: HomeTeamSummary["team"]) => `${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ""}`;

function SavedTeamAnalysis({ summary }: { summary: HomeTeamSummary }) {
  const { team, ai } = summary;
  const result = ai?.pick.result;
  return <section className={styles.analysis} aria-labelledby="your-ai">
    <h4 id="your-ai">AI on your team</h4>
    {ai && result ? <>
      <p className={styles.caption}>{ai.label} · {ai.status === "stale" ? `Out-of-date saved result · Week ${ai.week}` : `Target Week ${ai.week}`}</p>
      <p>vs <Link href={`/teams/${ai.opponent.id}`} prefetch={false}>{ai.opponent.name}</Link></p>
      <dl className={styles.probabilities}>{[team, ai.opponent].map(identity => <div key={identity.id}>
        <dt>{identity.id === team.id ? "Your team" : identity.name}</dt>
        <dd className="gh-num">{(result.probabilities.find(row => row.choice === identity.id)!.probability * 100).toFixed(1)}%</dd>
      </div>)}</dl>
      <p>Model choice: <strong>{result.choice === team.id ? team.name : ai.opponent.name}</strong></p>
      <p className={styles.caption}>{AI_PROBABILITY_LABEL}. A lineup comparison is not a weekly score forecast.</p>
      <p className={styles.caption}>Saved {timestamp(ai.generatedAt)}.</p>
      <details className={styles.notes}><summary>Model provenance</summary>
        <ul>{[...ai.pick.evidence, ...result.evidence].filter((text, index, all) => all.indexOf(text) === index).slice(0, 3).map(text => <li key={text}>{text}</li>)}</ul>
        <p>Inputs captured {timestamp(result.snapshot?.capturedAt ?? null)} · Cutoff {timestamp(result.snapshot?.cutoffAt ?? null)}</p>
        <p>{result.model} · {result.promptVersion}</p>
        <p>API confidence {(result.confidence * 100).toFixed(1)}% is a separate signal. Current team names identify the saved roster IDs.</p>
      </details>
    </> : <p>A matching saved pick is unavailable for your current team pairing. Published analysis appears here when its season, week and teams match.</p>}
    <Link href="/ai-decides" prefetch={false} className={controls.quiet}>Open AI Decides</Link>
  </section>;
}

/** Personal context lives within the league edition, never before it as a dashboard.
 * Question: what matters for my team? Action: My team / inspect a player.
 * States: anonymous, unclaimed, unresolved, season phases, partial prices and AI.
 * Narrow: same reading order; compact identity wraps, content columns stack.
 * Forbid: invented form/AI, isolated dashboard, logo substitutes for player faces.
 */
export function PersonalizedHome({ data }: { data: PersonalizedHomeData }) {
  if (data.kind === "signed_out") return null;
  if (data.kind !== "member" || !data.summary) return <div className={`${styles.context} ${styles.notice}`} data-personal-home={data.kind}>
    <p>{data.kind === "unclaimed" ? "Your account is ready. Make this your team’s front page." : "Your team is temporarily unavailable."}</p>
    <Link href={data.kind === "unclaimed" ? "/account" : "/team"} prefetch={false} className={controls.quiet}>{data.kind === "unclaimed" ? "Claim my team" : "Check my team"}</Link>
  </div>;
  const { team, season, standing } = data.summary;
  const hasRecord = !!standing && standing.wins + standing.losses + standing.ties > 0;
  return <div className={styles.context} data-personal-home="member" data-team-id={team.id}>
    <div className={styles.identity}><TeamAvatar name={team.name} avatar={team.avatar} /><div>
      <Link href={`/teams/${team.id}`} prefetch={false} className={styles.teamName}>{team.name}</Link>
      <p>{team.managerName} · {season.seasonYear} {formatSeasonStatus(season.status)} · Season record <strong className="gh-num">{record(team)}</strong>{hasRecord && Number.isFinite(standing.rank) ? ` · #${standing.rank} of ${season.totalTeams}` : " · Standings begin when scoring starts"}</p>
    </div></div>
    <nav className={styles.actions} aria-label="Your team">
      <Link href="/team" prefetch={false} className={controls.secondary}>My team</Link>
      <Link href={`/teams/${team.id}#team-roster`} prefetch={false} className={controls.quiet}>Full roster</Link>

    </nav>
    <PersonalizedValue summary={data.summary} />
  </div>;
}

export function PersonalizedMatchup({ summary }: { summary: HomeTeamSummary }) {
  const { team, season, matchup, checkedAt } = summary;
  const preseason = ["pre_season", "pre_draft"].includes(season.status);
  const opponent = matchup && (matchup.home.id === team.id ? matchup.away : matchup.home);
  const ownPoints = matchup && (matchup.home.id === team.id ? matchup.homePoints : matchup.awayPoints);
  const opponentPoints = matchup && (matchup.home.id === team.id ? matchup.awayPoints : matchup.homePoints);
  const ai = summary.ai;
  const probability = ai?.pick.result?.probabilities.find(row => row.choice === team.id)?.probability;
  return <section className={styles.matchup} aria-labelledby="your-matchup" data-personal-section="matchup" data-team-id={team.id}>
    <h3 id="your-matchup" className={styles.visuallyHidden}>Your matchup details</h3>
    {opponent ? <>

      {preseason ? <p className={styles.caption}>Upcoming · scoring has not started.</p> : <p className={styles.scoreline}><span>Your score <strong className="gh-num">{points(ownPoints)}</strong></span><span>Opponent score <strong className="gh-num">{points(opponentPoints)}</strong></span></p>}
      <p className={styles.caption}>{preseason ? "Pairing from the league source." : "Reported fantasy points; live or final status is not supplied."}</p>
    </> : <p className={styles.caption}>{["off_season", "complete"].includes(season.status) ? "No active weekly matchup in this season phase." : "This week's pairing is not available yet."}</p>}
    <p className={styles.aiSummary}>{ai && probability !== undefined ? <><strong className="gh-num">{(probability * 100).toFixed(1)}%</strong> saved AI model estimate for your team <span className={styles.caption}>· {ai.label} · {ai.status === "stale" ? "Out-of-date saved result" : "Target"} Week {ai.week}</span></> : "A matching saved pick is unavailable for your current team pairing."}</p>
    <details className={styles.notes}><summary>Saved analysis & source</summary>{opponent && <p>Week {matchup!.week} vs <Link href={`/teams/${opponent.id}`} prefetch={false}>{opponent.name}</Link> · Opponent record {record(opponent)}</p>}<Link href={`/teams/${team.id}#team-matchup`} prefetch={false}>Matchup & results</Link><SavedTeamAnalysis summary={summary} /><p className={styles.caption}>League check {timestamp(checkedAt)}. Public sources may be delayed.</p></details>
  </section>;
}

export function PersonalizedPlayers({ summary, portraits }: { summary: HomeTeamSummary; portraits: Record<string, string> }) {
  const { team, players, market, coverage } = summary;
  return <aside className={styles.teamPlayers} aria-labelledby="your-players" data-personal-section="players" data-team-id={team.id}>
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>From your roster</p><h3 id="your-players">Your players</h3></div><Link href={`/teams/${team.id}#team-roster`} prefetch={false}>Full roster</Link></div>
    <TeamPlayerGuide guide={summary.playerGuide} teamId={team.id} portraits={portraits} embedded />
    <section className={styles.playerValues} aria-labelledby="your-valued-players"><h4 id="your-valued-players">Your Roster, Valued</h4>
      <p className={styles.caption}>Highest modeled FAAB value{market ? ` · ${market.pricingBasis === "preseason" ? "preseason" : "in-season"} pricing` : ""}</p>
      {players.length ? <ol className={styles.players}>{players.map(player => <li key={player.id}>
        <PlayerHeadshot portraitSrc={portraits[player.id]} espnId={player.espnId} name={player.name} teamId={team.id} size={56} />
        <Link href={`/player/${player.id}`} prefetch={false}>{player.name}<small>{player.position ?? "Position unavailable"}</small></Link>
        <div className={styles.value}><strong className="gh-num">${player.value.toFixed(1)}</strong><small>{player.changePct === null ? "Change unavailable" : `${player.changePct > 0 ? "Up" : player.changePct < 0 ? "Down" : "Flat"} ${Math.abs(player.changePct).toFixed(1)}%`}</small></div>
      </li>)}</ol> : <p className={styles.caption}>Player values are temporarily unavailable.</p>}
      <p className={styles.caption}>A dynasty value model, not a current-performance ranking.{coverage.priced < coverage.roster && ` Values available for ${coverage.priced} of ${coverage.roster} rostered players.`}</p>
      <a href="#your-roster-value-details" className={styles.textLink}>View full roster valuation</a>
    </section>
  </aside>;
}

export function PersonalizedValue({ summary }: { summary: HomeTeamSummary }) {
  const { market, team, valuation } = summary;
  return <details className={styles.valuation} id="your-roster-value" data-personal-section="valuation" data-team-id={team.id}>
    <summary><span>{valuation.complete ? "Modeled roster value" : "Known-value subtotal"}</span><strong className="gh-num">{valuation.total === null ? "Unavailable" : `$${valuation.total.toFixed(2)} FAAB`}</strong><span className={styles.caption}>View all player values</span></summary>
    <div className={styles.valueDetails}><h3 id="your-roster-value-details">Your Roster Value</h3>
      <p>{valuation.knownRoster ? <>{valuation.complete ? "Full roster total" : "Known-value subtotal"} · {valuation.priced} of {summary.rosterValues.length} roster players priced · {valuation.unpriced} unpriced</> : "Roster membership is temporarily unavailable; no roster total is inferred."}</p>
      <p className={styles.caption}>{valuation.rank ? `${valuation.rank.tied ? "Joint value rank" : "Value rank"} ${valuation.rank.rank} of ${valuation.rank.teams}, using complete current roster quotes.` : "League value rank is unavailable until all compared rosters have complete pricing."}{market ? ` ${market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing; model computed ${timestamp(market.updatedAt)}.` : " Pricing is temporarily unavailable."}</p>
      {valuation.knownRoster && <details className={styles.rosterPrices}><summary>All {summary.rosterValues.length} roster player values</summary><ul>{summary.rosterValues.map(player => <li key={player.id}><Link href={`/player/${player.id}`} prefetch={false}>{player.name}<small>{player.position ?? "Position unavailable"}</small></Link><span className="gh-num">{player.value === null ? "Unknown" : `$${player.value.toFixed(2)}`}</span></li>)}</ul></details>}
      <p className={styles.caption}>Sum of current roster player quotes in league FAAB units. This is a current-roster snapshot; team valuation history is not available.</p>
      <Link href="/stocks" prefetch={false} className={styles.textLink}>Player values & price history</Link>
    </div>
  </details>;
}

export function PersonalizedWire({ summary }: { summary: HomeTeamSummary }) {
  const { team, news, newsAvailable, moves } = summary;
  return <aside className={styles.wire} aria-labelledby="your-wire" data-personal-section="wire" data-team-id={team.id}>
    <p className={styles.eyebrow}>Your corner of the league</p><h3 id="your-wire">Around Your Team</h3>
    {news.length || moves.length ? <ul>{news.map(article => <li key={`news-${article.id}`}><p className={styles.caption}>{article.outlet.name} · {timestamp(article.publishedAt)}</p><a href={article.url}>{article.headline}</a></li>)}{moves.map(move => <li key={`move-${move.id}`}><p className={styles.caption}>League move · {timestamp(move.createdAt)}</p><p>{move.summary}</p></li>)}</ul> : <p className={styles.caption}>{newsAvailable ? "No items in the current news feed or recent league moves involve your team." : "Team news is temporarily unavailable."}</p>}
    {!newsAvailable && !!(news.length || moves.length) && <p className={styles.caption}>Team-news coverage is temporarily unavailable.</p>}
    <Link href="/news" prefetch={false} className={styles.textLink}>League news</Link><Link href="/transactions" prefetch={false} className={styles.textLink}>Full transaction wire</Link>
  </aside>;
}
