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
  ? `${new Date(value).toISOString().slice(0, 16).replace("T", " ")} UTC` : "Unavailable";
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
      <details className={styles.notes}><summary>Saved analysis & source</summary>
        <ul>{[...ai.pick.evidence, ...result.evidence].filter((text, index, all) => all.indexOf(text) === index).slice(0, 3).map(text => <li key={text}>{text}</li>)}</ul>
        <p>Inputs captured {timestamp(result.snapshot?.capturedAt ?? null)} · Cutoff {timestamp(result.snapshot?.cutoffAt ?? null)}</p>
        <p>{result.model} · {result.promptVersion}</p>
        <p>API confidence {(result.confidence * 100).toFixed(1)}% is a separate signal. Current team names identify the saved roster IDs.</p>
      </details>
    </> : <p>A matching saved pick is unavailable for your current team pairing. Published analysis appears here when its season, week and teams match.</p>}
    <Link href="/ai-decides" prefetch={false} className={controls.quiet}>Open AI Decides</Link>
  </section>;
}

/** What matters for my team? A personal front-page edition above the league.
 * Primary action: open My team. Server-supplied membership only; signed-out
 * content stays intact. Preseason/offseason, pending/known scores, partial
 * pricing, saved/stale AI and source outages each retain honest labels.
 * Phone stacks Your Week, roster values and wire. No invented streaks/results.
 */
export function PersonalizedHome({ data, portraits = {} }: { data: PersonalizedHomeData; portraits?: Record<string, string> }) {
  if (data.kind === "signed_out") return null;
  if (data.kind !== "member" || !data.summary) return <section className={styles.surface} aria-labelledby="your-home-title" data-personal-home={data.kind}>
    <div className={styles.notice}>
      <div><p className={styles.eyebrow}>Your team edition</p><h2 id="your-home-title">{data.kind === "unclaimed" ? "Claim your team. Get your edition." : "Your team is temporarily unavailable."}</h2>
        <p>{data.kind === "unclaimed" ? "Your account is ready. Bring your matchup, players and league position to the front page." : "Check your account or browse the league below."}</p></div>
      <Link href={data.kind === "unclaimed" ? "/account" : "/team"} prefetch={false} className={controls.primary}>{data.kind === "unclaimed" ? "Claim my team" : "Check my team"}</Link>
    </div>
  </section>;

  const summary = data.summary;
  const { team, season, standing, matchup, checkedAt, standingsAvailable, players, coverage, market, news, newsAvailable, moves } = summary;
  const preseason = ["pre_season", "pre_draft"].includes(season.status);
  const hasRecord = !!standing && standing.wins + standing.losses + standing.ties > 0;
  const opponent = matchup && (matchup.home.id === team.id ? matchup.away : matchup.home);
  const ownPoints = matchup && (matchup.home.id === team.id ? matchup.homePoints : matchup.awayPoints);
  const opponentPoints = matchup && (matchup.home.id === team.id ? matchup.awayPoints : matchup.homePoints);
  return <section className={styles.surface} aria-labelledby="your-home-title" data-personal-home="member" data-team-id={team.id}>
    <header className={styles.header}>
      <div className={styles.identity}><TeamAvatar name={team.name} avatar={team.avatar} /><div>
        <p className={styles.eyebrow}>Your team edition</p><h2 id="your-home-title">{team.name}</h2>
        <p className={styles.dateline}>{team.managerName} · {season.seasonYear} {formatSeasonStatus(season.status)}{matchup ? ` · Week ${matchup.week}` : ""}</p>
      </div></div>
      <nav className={styles.actions} aria-label="Your team">
        <Link href="/team" prefetch={false} className={controls.primary}>My team</Link>
        <Link href={`/teams/${team.id}#team-roster`} prefetch={false} className={controls.secondary}>Full roster</Link>
      </nav>
    </header>
    <div className={styles.record}>
      <span>{hasRecord && Number.isFinite(standing.rank) ? <><strong className="gh-num">{standing.rank}</strong> of {season.totalTeams} in standings</> : "Standings begin when scoring starts"}</span>
      <span>Season record <strong className="gh-num">{record(team)}</strong></span>
      <a href="#your-roster-value">{summary.valuation.complete ? "Modeled roster value" : "Known-value subtotal"} <strong className="gh-num">{summary.valuation.total === null ? "Unavailable" : `$${summary.valuation.total.toFixed(2)} FAAB`}</strong></a>
      <a href={standingsAvailable ? "#your-standings" : "/teams"}>{standingsAvailable ? "League standings" : "League teams"}</a>
    </div>
    <div className={styles.columns}>
      <section aria-labelledby="your-matchup"><h3 id="your-matchup">Your Week{matchup ? ` · Week ${matchup.week}` : ""}</h3>
        {opponent ? <>
          <p className={styles.opponent}>vs <Link href={`/teams/${opponent.id}`} prefetch={false}>{opponent.name}</Link></p>
          <p className={styles.caption}>Your record {record(team)} · Opponent record {record(opponent)}</p>
          {preseason ? <p>Upcoming · scoring has not started.</p> : <dl className={styles.scores}>
            <div><dt>Your score</dt><dd className="gh-num">{points(ownPoints)}</dd></div>
            <div><dt>Opponent score</dt><dd className="gh-num">{points(opponentPoints)}</dd></div>
          </dl>}
          <p className={styles.caption}>{preseason ? "Pairing from the league source." : "Reported fantasy points; the source does not identify live or final status here."}</p>
        </> : <p>{["off_season", "complete"].includes(season.status) ? "No active weekly matchup in this season phase." : "This week's pairing is not available yet."}</p>}
        <Link href={`/teams/${team.id}#team-matchup`} prefetch={false} className={controls.quiet}>Matchup & results</Link>
        <SavedTeamAnalysis summary={summary} />
      </section>
      <section aria-labelledby="your-players"><h3 id="your-players">Your Roster, Valued</h3>
        <p className={styles.caption}>Highest modeled FAAB value{market ? ` · ${market.pricingBasis === "preseason" ? "preseason" : "in-season"} pricing` : ""}</p>
        {players.length ? <ol className={styles.players}>{players.map(player => <li key={player.id}>
          <PlayerHeadshot portraitSrc={portraits[player.id]} espnId={player.espnId} name={player.name} teamId={team.id} size={40} />
          <Link href={`/player/${player.id}`} prefetch={false}>{player.name}<small>{player.position ?? "Position unavailable"}</small></Link>
          <div className={styles.value}><strong className="gh-num">${player.value.toFixed(1)}</strong>
            <small>{player.changePct === null ? "Change unavailable" : `${player.changePct > 0 ? "Up" : player.changePct < 0 ? "Down" : "Flat"} ${Math.abs(player.changePct).toFixed(1)}%`}</small>
          </div>
        </li>)}</ol> : <p>Player values are temporarily unavailable.</p>}
        <p className={styles.caption}>A dynasty value model, not a current-performance ranking.{coverage.priced < coverage.roster && ` Values available for ${coverage.priced} of ${coverage.roster} rostered players.`}{market && ` Model computed ${timestamp(market.updatedAt)}.`}</p>
        <Link href="/stocks" prefetch={false} className={controls.quiet}>Open player market</Link>
        {["off_season", "complete"].includes(season.status) && <p><Link href="/arcade" prefetch={false} className={controls.secondary}>Visit the Arcade</Link></p>}
      </section>
    </div>
    <section className={styles.valuation} aria-labelledby="your-roster-value">
      <div className={styles.valueHeading}><div><p className={styles.eyebrow}>Current modeled player quotes</p><h3 id="your-roster-value">Your Roster Value</h3></div>
        <strong className={`${styles.teamValue} gh-num`}>{summary.valuation.total === null ? "Unavailable" : `$${summary.valuation.total.toFixed(2)} FAAB`}</strong>
      </div>
      <p>{summary.valuation.knownRoster ? <>{summary.valuation.complete ? "Full roster total" : "Known-value subtotal"} · {summary.valuation.priced} of {summary.rosterValues.length} roster players priced · {summary.valuation.unpriced} unpriced</> : "Roster membership is temporarily unavailable; no roster total is inferred."}</p>
      <p className={styles.caption}>{summary.valuation.rank ? `${summary.valuation.rank.tied ? "Joint value rank" : "Value rank"} ${summary.valuation.rank.rank} of ${summary.valuation.rank.teams}, using complete current roster quotes.` : "League value rank is unavailable until all compared rosters have complete pricing."}{market ? ` ${market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing; model computed ${timestamp(market.updatedAt)}.` : " Pricing is temporarily unavailable."}</p>
      {summary.valuation.knownRoster && <details className={styles.rosterPrices}><summary>All {summary.rosterValues.length} roster player values</summary>
        <ul>{summary.rosterValues.map(player => <li key={player.id}><Link href={`/player/${player.id}`} prefetch={false}>{player.name}<small>{player.position ?? "Position unavailable"}</small></Link><span className="gh-num">{player.value === null ? "Unknown" : `$${player.value.toFixed(2)}`}</span></li>)}</ul>
      </details>}
      <p className={styles.caption}>Sum of current roster player quotes in league FAAB units. This is a current-roster snapshot; team valuation history is not available.</p>
      <Link href="/stocks" prefetch={false} className={controls.secondary}>Player values & price history</Link>
    </section>
    <TeamPlayerGuide guide={summary.playerGuide} teamId={team.id} portraits={portraits} />
    {news.length || moves.length ? <section className={styles.wire} aria-labelledby="your-wire"><h3 id="your-wire">Around Your Team</h3>
      <ul>{news.map(article => <li key={`news-${article.id}`}><p className={styles.caption}>{article.outlet.name} · {timestamp(article.publishedAt)}</p><a href={article.url}>{article.headline}</a></li>)}
        {moves.map(move => <li key={`move-${move.id}`}><p className={styles.caption}>League move · {timestamp(move.createdAt)}</p><p>{move.summary}</p></li>)}</ul>
      {!newsAvailable && <p className={styles.caption}>Team-news coverage is temporarily unavailable.</p>}
      <p><Link href="/news" prefetch={false} className={controls.quiet}>League news</Link><Link href="/transactions" prefetch={false} className={controls.quiet}>Full transaction wire</Link></p>
    </section> : <p className={styles.caption}>{newsAvailable ? "No items in the current news feed or recent league moves involve your team." : "Team news is temporarily unavailable. Browse the league wire below."}</p>}
    <p className={styles.caption}>League check {timestamp(checkedAt)}. Public league sources may be delayed.</p>
  </section>;
}
