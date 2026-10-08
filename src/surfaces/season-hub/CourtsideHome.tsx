/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */
import Link from "next/link";
import type { CourtsideHomeData } from "@/data/league";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import type { Team } from "@/domain";
import { formatSeasonStatus } from "@/domain";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { CourtsideDialog } from "./CourtsideDialog";
import { CourtsideMoment } from "./CourtsideMoment";
import { CourtsideDirectory } from "./CourtsideDirectory";
import { StatsStrip } from "./StatsStrip";
import { StandingsTable } from "./StandingsTable";
import { TransactionFeed } from "./TransactionFeed";
import { SectionLinks } from "./SectionLinks";
import { cs } from "./CourtsideStyles";
import "@/ui/courtside-tokens.css";

type Props = {
  data: CourtsideHomeData;
  archive: WeeklyEdition[];
  portraits: Record<string, string>;
  archived?: boolean;
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

function MatchTeam({ team, score }: { team: Team; score: number | null }) {
  const pennant =
    team.id === "1"
      ? "banner-roster-1-reaves-dropper.webp"
      : team.id === "5"
        ? "banner-roster-5-josh-diddys-roster.webp"
        : null;
  return (
    <Link
      className={cs("match-team")}
      href={`/teams/${team.id}`}
      prefetch={false}
    >
      {pennant ? (
        <img
          className={cs("pennant-image")}
          src={`/courtside/${pennant}`}
          alt={`${team.name}${team.id === "5" ? ", 2025 champion" : ""} embroidered pennant`}
          width="512"
          height="896"
        />
      ) : (
        <TeamAvatar name={team.name} avatar={team.avatar} />
      )}
      <div>
        <strong>{team.name}</strong>
        <small>{team.managerName}</small>
        {score !== null && (
          <span className={cs("historical-score", "gh-num")}>
            {score.toFixed(1)}
          </span>
        )}
      </div>
    </Link>
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
              {owner.name} ↗
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
}: Props) {
  const { edition, hub } = data;
  if (!edition)
    return (
      <main className={cs("surface")} data-courtside-home>
        <section className={cs("archive-page")}>
          <div className={cs("wrap")}>
            <h1>The next weekly story is on its way.</h1>
            <p className={cs("archive-intro")}>
              Browse the league while the next editorial edition is prepared.
            </p>
            <Link className={cs("text-link")} href="/weekly">
              Weekly archive →
            </Link>
            <SectionLinks />
          </div>
        </section>
      </main>
    );
  const game = edition.game;
  const pair = game.teamIds?.map((id) =>
    hub?.teams.find((team) => team.id === id),
  );
  const validPair =
    pair?.length === 2 &&
    pair.every((team): team is Team => !!team) &&
    game.state !== "unavailable";
  const scores =
    game.state === "final" && game.scores ? game.scores : [null, null];
  const previousIndex = archive.findIndex((entry) => entry.id === edition.id);
  const previous = archive[previousIndex + 1];
  const newer = archive[previousIndex - 1];
  const stale =
    !archived && Date.parse(data.checkedAt) >= Date.parse(edition.endsAt);
  const preseason =
    hub?.season.status === "pre_season" || hub?.season.status === "pre_draft";
  const seasonLabel = hub
    ? `${hub.season.seasonYear} ${formatSeasonStatus(hub.season.status).toLowerCase()}`
    : "Season status unavailable";
  const lead = edition.playerSpotlights.find(
    (player) => player.role === "player-of-week",
  );
  const supports = edition.playerSpotlights.filter((player) => player !== lead);
  return (
    <main className={cs("surface")} data-courtside-home id="content">
      <a className={cs("skip")} href="#watch">
        Skip to this week’s players
      </a>
      <section className={cs("opening-zone")} aria-labelledby="game-title">
        <div className={cs("wrap")}>
          <div className={cs("header-edition")}>
            <time>{edition.dateLabel}</time>
            <span>
              {archived ? "Archived " : ""}
              {edition.status === "draft" ? "Sample edition" : "Weekly edition"}
            </span>
          </div>
          {stale && (
            <p className={cs("stale-note")}>
              You’re reading the last edition, from {edition.dateLabel}. The
              next weekly spotlight is pending.
            </p>
          )}
          <div className={cs("opening-layout")}>
            <div className={cs("arena-scene")}>
              <img
                src="/courtside/arena.jpg"
                alt="The league’s existing Blender basketball arena"
                width="1440"
                height="810"
                fetchPriority="high"
              />
            </div>
            <div className={cs("game-story")}>
              <div className={cs("game-meta")}>
                <strong>Game of the week</strong>
                <span>
                  {game.state === "final"
                    ? "Historical final · 2025"
                    : game.state === "upcoming"
                      ? `Week ${game.leagueWeek} · Upcoming`
                      : "Spotlight pending"}
                </span>
              </div>
              <h1 id="game-title">{game.title}</h1>
              <p className={cs("context")}>{game.context}</p>
              <div className={cs("board-actions")}>
                <CourtsideDialog
                  label="Matchup notes"
                  title="Why this matchup?"
                >
                  <p className={cs("context-label")}>{game.note}</p>
                  <h2>Why this matchup?</h2>
                  <p>{game.selectionReason}</p>
                  <p className={cs("caption")}>
                    {edition.status === "draft"
                      ? "Proposed editorial selection for review."
                      : "Curated weekly selection."}{" "}
                    {game.state === "upcoming" &&
                      "No projected result or live score is implied."}
                  </p>
                  <div className={cs("notes-teams")}>
                    {pair?.map(
                      (team) =>
                        team && (
                          <Link
                            className={cs("text-link")}
                            key={team.id}
                            href={`/teams/${team.id}`}
                          >
                            {team.name} ↗
                          </Link>
                        ),
                    )}
                  </div>
                  <Sources edition={edition} />
                </CourtsideDialog>
                <Link className={cs("text-link")} href="/intel">
                  League intel ↗
                </Link>
              </div>
              <div className={cs("edition-links")}>
                {previous && (
                  <Link href={`/weekly/${previous.id}`}>Previous edition</Link>
                )}
                {newer && (
                  <Link href={`/weekly/${newer.id}`}>Newer edition</Link>
                )}
                <Link href="/weekly">Weekly archive</Link>
              </div>
            </div>
          </div>
          {validPair ? (
            <div className={cs("matchup-rail")} aria-label="Featured matchup">
              <MatchTeam team={pair[0]!} score={scores[0]} />
              <span className={cs("versus-label")}>vs</span>
              <MatchTeam team={pair[1]!} score={scores[1]} />
            </div>
          ) : (
            <p className={cs("empty")}>
              The selected team identities are temporarily unavailable. Team
              profiles remain available below.
            </p>
          )}
        </div>
      </section>
      <div className={cs("weekly-zone")}>
        <CourtsideMoment />
        <div className={cs("wrap")}>
          {!!edition.playerSpotlights.length && (
            <section id="watch" aria-labelledby="watch-title">
              <h2 id="watch-title">This week’s players</h2>
              <p className={cs("weekly-context")}>
                {edition.status === "draft"
                  ? "Opening edition: two 2025–26 lookbacks and one preseason watch. Sample editorial; no 2026 scoring week has been played."
                  : `Editorial picks · ${edition.dateLabel}`}
              </p>
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
            </section>
          )}
          <section className={cs("happenings")} aria-labelledby="wire-title">
            <div className={cs("section-head")}>
              <h2 id="wire-title">Around the league</h2>
              <Link className={cs("text-link")} href="/transactions">
                The full wire ↗
              </Link>
            </div>
            <div className={cs("wire-items")}>
              {edition.happenings.map((item) => (
                <article className={cs("wire-item")} key={item.title}>
                  <time>{item.dateLabel}</time>
                  <a href={item.href.replace("https://goathoopers.com", "")}>
                    <h3>{item.title} ↗</h3>
                    <p>{item.text}</p>
                  </a>
                </article>
              ))}
            </div>
            <Sources edition={edition} />
          </section>
        </div>
      </div>
      <CourtsideDirectory
        entries={data.directory}
        seasonLabel={seasonLabel}
        checkedAt={data.checkedAt}
        preseason={preseason}
        rosterNamesAvailable={data.rosterNamesAvailable}
        portraits={portraits}
      >
        <details className={cs("league-details")}>
          <summary>Live standings, stats & recent moves</summary>
          {hub ? (
            <div className={cs("live-grid")}>
              <div>
                <StandingsTable standings={hub.standings} />
              </div>
              <div>
                <StatsStrip stats={hub.stats} />
                <TransactionFeed
                  transactions={hub.transactions}
                  teams={hub.teams}
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
        <details className={cs("league-details")}>
          <summary>Explore teams, league intel, stocks & trades</summary>
          <SectionLinks />
        </details>
      </CourtsideDirectory>
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
              Weekly archive →
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
    </main>
  );
}
