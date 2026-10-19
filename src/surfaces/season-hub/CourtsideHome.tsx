/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */
import Link from "next/link";
import type { CourtsideHomeData } from "@/data/league";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { formatSeasonStatus } from "@/domain";
import type { AiWeeklySlate } from "@/domain/ai-decider";
import { CourtsideFeature, MemberTeamActions, RosterValuationDetails } from "./CourtsideFeature";
import { CourtsideDirectory } from "./CourtsideDirectory";
import { StatsStrip } from "./StatsStrip";
import { StandingsTable } from "./StandingsTable";
import { TransactionFeed } from "./TransactionFeed";
import { SectionLinks } from "./SectionLinks";
import { HomePlayersLead } from "./HomePlayersLead";
import { FacesStrip } from "./FacesStrip";
import { ChampionShowcase } from "./ChampionShowcase";
import { Reveal } from "./Reveal";
import { TipCountdown, WEEK_ONE_TIP_OFF_ISO, openingPhase } from "./TipCountdown";
import { formatHomeStamp } from "./homeFormat";
import type { HomeTeamFace, HomeTeamSummary, PersonalizedHomeData } from "@/domain/personalized-home";
import controls from "@/ui/controls.module.css";
import { cs } from "./CourtsideStyles";
import "@/ui/courtside-tokens.css";

type Props = {
  data: CourtsideHomeData;
  archive: WeeklyEdition[];
  portraits: Record<string, string>;
  archived?: boolean;
  aiWeekly?: AiWeeklySlate;
  viewerTeamId?: string;
  /** The signed-in viewer's personalized projection, woven into the edition
   * (hero, players lead, wire marks) — never a separate slab. */
  personal?: PersonalizedHomeData;
  /** Each team's top player by modeled value, for the faces strip + hero. */
  faces?: HomeTeamFace[];
};
const labels = {
  "player-of-week": "Player of the Week",
  underperformer: "Underperformer of the Week",
  "one-to-watch": "One to watch next week",
};

function Sources({ edition }: { edition: WeeklyEdition }) {
  return (
    <details className={cs("notes-sources")}>
      <summary>Editorial notes & source checks</summary>
      <p>
        {edition.status === "draft"
          ? "Proposed editorial copy for review. Muse has not published this edition."
          : `Published ${edition.publishedAt}.`}{" "}
        The editorial calendar is separate from the league’s scoring week.
      </p>
      <ul>
        {edition.sources.map((source) => (
          <li key={source.url}>
            <a href={source.url}>{source.label}</a> — checked {source.checkedAt}
          </li>
        ))}
      </ul>
    </details>
  );
}

/** The member's team wire: real headlines involving their team (the moves
 * themselves live in the recent-moves feed, marked with their team).
 * Renders items when they exist, a one-line status when the feed itself is
 * unavailable, and nothing for an available-but-empty feed. */
function TeamNews({ summary }: { summary: HomeTeamSummary }) {
  if (!summary.news.length) {
    return summary.newsAvailable ? null : (
      <p className={cs("caption", "team-news-status")} data-team-news="unavailable">
        Team news is temporarily unavailable.
      </p>
    );
  }
  return (
    <section className={cs("team-news")} aria-labelledby="team-news-title" data-team-news>
      <h3 id="team-news-title">Your team in the news</h3>
      <ul className={cs("team-news-list")}>
        {summary.news.slice(0, 3).map((item) => (
          <li key={item.id}>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.headline}
            </a>
            <span className={cs("caption")}>
              {item.outlet.name} · {formatHomeStamp(item.publishedAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlayerStory({
  player,
  lead,
  data,
  portraits,
}: {
  player: WeeklyEdition["playerSpotlights"][number];
  lead: boolean;
  data: CourtsideHomeData;
  portraits: Record<string, string>;
}) {
  const owner = data.directory.find((entry) =>
    entry.players.some((reference) => reference.id === player.playerId),
  )?.identity;
  return (
    <article className={cs(lead ? "player-lead" : "player-support")}>
      <Link
        className={cs("portrait")}
        href={`/player/${player.playerId}`}
        prefetch={false}
        aria-label={`Open ${player.name} player page`}
      >
        {portraits[player.playerId] ? (
          <img
            src={portraits[player.playerId]}
            alt=""
            width="300"
            height="200"
            loading="lazy"
          />
        ) : (
          <span className={cs("portrait-initials")}>
            {player.name
              .split(" ")
              .map((name) => name[0])
              .join("")}
          </span>
        )}
      </Link>
      <div className={cs("player-copy")}>
        <header className={cs("player-header")}>
          <p className={cs("player-role")}>{labels[player.role]}</p>
          <h3>
            <Link href={`/player/${player.playerId}`} prefetch={false}>
              {player.name}
            </Link>
          </h3>
          {owner ? (
            <Link
              className={cs("player-owner")}
              href={`/teams/${owner.id}`}
              prefetch={false}
            >
              {owner.name}
            </Link>
          ) : (
            <p className={cs("player-owner")}>Ownership check unavailable</p>
          )}
        </header>
        <div className={cs("player-take")}>
          <h4>{player.headline}</h4>
          <p>{player.opinion}</p>
        </div>
        <dl className={cs("player-stats")}>
          {player.stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.label}</dt>
              <dd>{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className={cs("stat-period")}>{player.statPeriod}</p>
      </div>
    </article>
  );
}

export function CourtsideHome({
  data,
  archive,
  portraits,
  archived = false,
  aiWeekly,
  viewerTeamId,
  personal,
  faces,
}: Props) {
  const { edition, hub } = data;
  const preseason =
    hub?.season.status === "pre_season" || hub?.season.status === "pre_draft";
  const seasonLabel = hub
    ? `${hub.season.seasonYear} ${formatSeasonStatus(hub.season.status).toLowerCase()}`
    : "Season status unavailable";
  const memberSummary = personal?.kind === "member" ? personal.summary : null;
  const facesList = faces ?? [];
  const leadVisible =
    !!memberSummary &&
    (memberSummary.players.length > 0 ||
      memberSummary.playerGuide.best.length > 0 ||
      (memberSummary.playerGuide.watch.basis !== "unavailable" &&
        memberSummary.playerGuide.watch.rows.length > 0));
  const championEntry = data.directory.find((entry) => entry.previousSeason?.finish === 1);
  // The only separate personal surface left: a one-line notice for accounts
  // whose edition cannot be built (unclaimed / unavailable). Members with a
  // summary are woven into the edition itself; signed-out sees nothing.
  const notice =
    personal && personal.kind !== "signed_out" && !memberSummary ? (
      <div className={cs("viewer-notice")} data-home-notice={personal.kind}>
        <div>
          <p className={cs("viewer-notice-title")}>
            {personal.kind === "unclaimed" ? "Claim your team. Get your edition." : "Your team is temporarily unavailable."}
          </p>
          <p className={cs("viewer-notice-copy")}>
            {personal.kind === "unclaimed"
              ? "Your account is ready. Bring your matchup, players and league position to the front page."
              : "Check your account or browse the league below."}
          </p>
        </div>
        <Link href={personal.kind === "unclaimed" ? "/account" : "/team"} prefetch={false} className={controls.primary}>
          {personal.kind === "unclaimed" ? "Claim my team" : "Check my team"}
        </Link>
      </div>
    ) : null;
  if (!edition)
    return (
      <div className={cs("surface")} data-courtside-home>
        <section className={cs("archive-page")}>
          <div className={cs("wrap")}>
            {notice}
            <h1>The next weekly story is on its way.</h1>
            <p className={cs("archive-intro")}>
              Browse the league while the next editorial edition is prepared.
            </p>
            <Link className={cs("text-link")} href="/weekly">
              Weekly archive
            </Link>
            {openingPhase(Date.parse(data.checkedAt), Date.parse(WEEK_ONE_TIP_OFF_ISO), null) !== "past" && (
              <figure className={cs("clubhouse-court")}>
                <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" />
                <div className={cs("court-clock")}>
                  <TipCountdown serverNowIso={data.checkedAt} />
                </div>
              </figure>
            )}
            {leadVisible && memberSummary && (
              <HomePlayersLead summary={memberSummary} portraits={portraits} />
            )}
            {memberSummary && (() => {
              // The hero carries the member's team context in the edition
              // state; with no edition, the same context survives here —
              // full roster valuation + team actions, never the old slab.
              const entry = data.directory.find((candidate) => candidate.identity.id === memberSummary.team.id);
              const prior = preseason ? entry?.previousSeason : null;
              const record = prior ?? entry?.currentRecord ?? null;
              return (
                <section aria-label="Your team" data-member-team>
                  <h2>{memberSummary.team.name}</h2>
                  {record && (
                    <p className={cs("caption")}>
                      {prior ? `${prior.season} record` : "Record"} · {record.wins}–{record.losses}
                      {memberSummary.valuation.rank ? ` · Roster value No. ${memberSummary.valuation.rank.rank} of ${memberSummary.valuation.rank.teams}` : ""}
                    </p>
                  )}
                  <RosterValuationDetails summary={memberSummary} />
                  <MemberTeamActions summary={memberSummary} />
                </section>
              );
            })()}
            {memberSummary && <TeamNews summary={memberSummary} />}
            {facesList.some((face) => face.player) && (
              <FacesStrip faces={facesList} portraits={portraits} />
            )}
            <SectionLinks />
            <Link className={cs("text-link")} href="/arcade">Arcade</Link>
            <Link className={cs("text-link")} href="/ai-decides">AI Decides playground</Link>
          </div>
        </section>
        {championEntry && <ChampionShowcase entry={championEntry} />}
        <CourtsideDirectory entries={data.directory} seasonLabel={seasonLabel} checkedAt={data.checkedAt} preseason={preseason} rosterNamesAvailable={data.rosterNamesAvailable} portraits={portraits} />
      </div>
    );
  const previousIndex = archive.findIndex((entry) => entry.id === edition.id);
  const previous = archive[previousIndex + 1];
  const newer = archive[previousIndex - 1];
  const stale =
    !archived && Date.parse(data.checkedAt) >= Date.parse(edition.endsAt);
  const lead = edition.playerSpotlights.find(
    (player) => player.role === "player-of-week",
  );
  const supports = edition.playerSpotlights.filter((player) => player !== lead);
  return (
    <div className={cs("surface", "editorial-home")} data-courtside-home id="content">
      <section className={cs("opening-zone")} aria-labelledby="game-title">
        <div className={cs("wrap")}>
          <div className={cs("header-edition")}>
            <time>{edition.dateLabel}</time>
            <span>
              {archived ? "Archived " : ""}
              {edition.status === "draft" ? "Sample edition" : "Weekly edition"}
            </span>
          </div>
          {notice}
          {stale && (
            <p className={cs("stale-note")}>
              You’re reading the last edition, from {edition.dateLabel}. The
              next weekly spotlight is pending.
            </p>
          )}
          <CourtsideFeature
            edition={edition}
            entries={data.directory.map(({ identity, previousSeason, currentRecord, currentMatchup }) => ({ identity, previousSeason, currentRecord, currentMatchup }))}
            rosterCounts={Object.fromEntries(data.directory.map((entry) => [entry.identity.id, entry.players.length]))}
            preseason={preseason}
            checkedAt={data.checkedAt}
            season={hub?.season.seasonYear ?? null}
            aiWeekly={aiWeekly}
            viewerTeamId={viewerTeamId}
            hero={memberSummary ? { summary: memberSummary, faces: facesList } : null}
            portraits={portraits}
            sources={<Sources edition={edition} />}
          />
          <div className={cs("edition-links")}>
            {previous && <Link href={`/weekly/${previous.id}`}>Previous edition</Link>}
            {newer && <Link href={`/weekly/${newer.id}`}>Newer edition</Link>}
            <Link href="/weekly">Weekly archive</Link>
            <Link href="/intel">League intel</Link>
          </div>
        </div>
      </section>
      <div className={cs("weekly-zone")}>
        <div className={cs("wrap")}>
          {(!!edition.playerSpotlights.length || leadVisible) && (
            <section id="watch" aria-labelledby="watch-title">
              <h2 id="watch-title">This week’s players</h2>
              <p className={cs("weekly-context")}>
                {edition.playerSpotlights.length
                  ? edition.status === "draft"
                    ? "Opening edition: two 2025–26 lookbacks and one preseason watch. Sample editorial; no 2026 scoring week has been played."
                    : `Editorial picks · ${edition.dateLabel}`
                  : "Your highest-valued players and the league’s risers, from current modeled prices."}
              </p>
              {leadVisible && memberSummary && (
                <Reveal>
                  <HomePlayersLead summary={memberSummary} portraits={portraits} />
                </Reveal>
              )}
              {!!edition.playerSpotlights.length && (
                <>
              <div className={cs("player-layout")}>
                {lead && (
                  <PlayerStory
                    player={lead}
                    lead
                    data={data}
                    portraits={portraits}
                  />
                )}
                <div className={cs("supporting-picks")}>
                  {supports.map((player) => (
                    <PlayerStory
                      key={player.playerId}
                      player={player}
                      lead={false}
                      data={data}
                      portraits={portraits}
                    />
                  ))}
                </div>
              </div>
              <details className={cs("shared-sources")}>
                <summary>Sources & why these picks</summary>
                <p>
                  Roster links reflect the current live roster check. These
                  picks are sample opinions, not computed awards or a completed
                  2026 fantasy week. Jokić and Embiid use prior-season NBA
                  averages; Dybantsa uses college averages.
                </p>
                <ul>
                  {edition.playerSpotlights.map((player) => (
                    <li key={player.playerId}>
                      <strong>{player.name}</strong> — {player.selectionReason}{" "}
                      <a href={player.source.url}>{player.source.label}</a>{" "}
                      <span className={cs("caption")}>
                        Checked {player.source.checkedAt}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
                </>
              )}
            </section>
          )}
          {facesList.some((face) => face.player) && (
            <Reveal>
              <FacesStrip faces={facesList} portraits={portraits} />
            </Reveal>
          )}
          {memberSummary && (
            <Reveal>
              <TeamNews summary={memberSummary} />
            </Reveal>
          )}
          <section className={cs("happenings")} aria-labelledby="wire-title">
            <div className={cs("section-head")}>
              <h2 id="wire-title">Around the league</h2>
              <Link className={cs("text-link")} href="/transactions">
                The full wire
              </Link>
            </div>
            <div className={cs("wire-items")}>
              {edition.happenings.map((item) => (
                <article className={cs("wire-item")} key={item.title}>
                  <time>{item.dateLabel}</time>
                  <a href={item.href.replace("https://goathoopers.com", "")}>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </a>
                </article>
              ))}
            </div>
            <Sources edition={edition} />
          </section>
        </div>
      </div>
      {championEntry && (
        <Reveal>
          <ChampionShowcase entry={championEntry} />
        </Reveal>
      )}
      <CourtsideDirectory
        entries={data.directory}
        seasonLabel={seasonLabel}
        checkedAt={data.checkedAt}
        preseason={preseason}
        rosterNamesAvailable={data.rosterNamesAvailable}
        portraits={portraits}
      >
        <details className={cs("league-details")} id="your-standings">
          <summary>Live standings, stats & recent moves</summary>
          {hub ? (
            <div className={cs("live-grid")}>
              <div>
                <StandingsTable standings={hub.standings} viewerTeamId={viewerTeamId} championTeamId={championEntry?.identity.id} />
              </div>
              <div>
                <StatsStrip stats={hub.stats} />
                <TransactionFeed
                  transactions={hub.transactions}
                  teams={hub.teams}
                  viewerTeamId={viewerTeamId}
                  extraTransactions={memberSummary?.moves}
                />
              </div>
            </div>
          ) : (
            <p className={cs("empty")}>
              Live league data is temporarily unavailable. Try again or browse
              the team profiles.
            </p>
          )}
        </details>
      </CourtsideDirectory>
      <section className={cs("home-tools")} aria-label="League tools">
        <div className={cs("wrap", "home-tools-layout")}>
          <div>
            <h2><Link href="/stocks">Stocks</Link></h2>
            <p>Player prices, trends and the next move. Inspect the market.</p>
            <Link className={cs("text-link")} href="/trade-analyzer">Price a trade</Link>
          </div>
          <div>
            <h2><Link href="/arcade">Arcade</Link></h2>
            <p>Step onto the practice court. Play free throw.</p>
            <Link className={cs("text-link")} href="/arcade/free-throw">Play free throw</Link>
          </div>
        </div>
      </section>
      <section className={cs("archive-zone")}>
        <div className={cs("wrap", "archive-preview")}>
          <div>
            <h2>Every week has a story.</h2>
            <p>
              Earlier {edition.status === "draft" ? "sample " : ""}editions stay
              available as the season moves on.
            </p>
          </div>
          <div>
            <Link className={cs("text-link")} href="/weekly">
              Weekly archive
            </Link>
            <div className={cs("archive-links")}>
              {archive.map((entry) => (
                <Link key={entry.id} href={`/weekly/${entry.id}`}>
                  <time>{entry.dateLabel}</time>
                  {entry.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className={cs("arena-strip")} aria-hidden="true">
        <img
          src="/courtside/arena.jpg"
          alt=""
          width="1440"
          height="810"
          loading="lazy"
        />
      </div>
    </div>
  );
}
