/* eslint-disable @next/next/no-img-element -- Approved, pre-sized local assets are served directly without image-optimizer quota. */
import Link from "next/link";
import type { CourtsideHomeData } from "@/data/league";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { formatSeasonStatus } from "@/domain";
import type { AiWeeklySlate } from "@/domain/ai-decider";
import { CourtsideFeature, MemberTeamActions } from "./CourtsideFeature";
import { CourtsideDirectory } from "./CourtsideDirectory";
import { StatsStrip } from "./StatsStrip";
import { StandingsTable } from "./StandingsTable";
import { TransactionFeed } from "./TransactionFeed";
import { SectionLinks } from "./SectionLinks";
import { FacesStrip } from "./FacesStrip";
import { RosterValueSection } from "./RosterValueSection";
import { BarSetSection } from "./BarSetSection";
import { ScoutingNotebook } from "./ScoutingNotebook";
import { FormGuideWire } from "./FormGuideWire";
import { StudChud } from "./StudChud";
import { AiDecidesSection } from "./AiDecidesSection";
import { Reveal } from "./Reveal";
import { WEEK_ONE_TIP_OFF_ISO, openingPhase } from "@/domain/season-opening";
import { TipCountdown } from "./TipCountdown";
import type { HomeTeamFace, HomeTeamSummary, PersonalizedHomeData } from "@/domain/personalized-home";
import controls from "@/ui/controls.module.css";
import { cs } from "./CourtsideStyles";
import { championTeamIdOf, deriveWeekPairs } from "./weekPairs";
import "@/ui/courtside-tokens.css";

type Props = {
  data: CourtsideHomeData;
  archive: WeeklyEdition[];
  portraits: Record<string, string>;
  archived?: boolean;
  aiWeekly?: AiWeeklySlate;
  viewerTeamId?: string;
  /** The signed-in viewer's personalized projection, woven into the edition
   * (team desk, roster value, notebook, wire) — never a separate slab. */
  personal?: PersonalizedHomeData;
  /** Each team's top player by modeled value, for the faces strip + hero. */
  faces?: HomeTeamFace[];
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

/**
 * The homepage in the approved composition: headline + court with the
 * team desk beside it; roster value (member) or the featured pairing's
 * faces (signed out) below the court; the scouting notebook;
 * the member's form guide + team wire; the STUD/CHUD retrospective; AI
 * Decides with all five pairings down-page; faces of the league; the
 * around-the-league wire; the teams directory; standings/stats/moves as a
 * visible league section; tools and the weekly archive. There is no
 * homepage champion showcase section — the champion's crown badge and the
 * directory's champion label are the avatar/directory system's, and stay.
 */
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
  const memberSummary: HomeTeamSummary | null = personal?.kind === "member" ? personal.summary : null;
  const facesList = faces ?? [];
  const entrySlice = data.directory.map(({ identity, previousSeason, currentRecord, currentMatchup }) => ({ identity, previousSeason, currentRecord, currentMatchup }));
  const { pairs, preseasonPreview } = deriveWeekPairs(entrySlice, aiWeekly, hub?.season.seasonYear ?? null);
  const championTeamId = championTeamIdOf(entrySlice);
  const championEntry = data.directory.find((entry) => entry.identity.id === championTeamId);
  // The featured pairing the public sections anchor on: the member's own
  // pairing when signed in, else the edition's game, else the first pair.
  const featuredPair = (() => {
    if (memberSummary?.matchup) {
      const pair = pairs.find((candidate) =>
        [candidate.home.id, candidate.away.id].includes(memberSummary.matchup!.home.id) &&
        [candidate.home.id, candidate.away.id].includes(memberSummary.matchup!.away.id));
      if (pair) return pair;
    }
    if (memberSummary?.ai) {
      const pair = pairs.find((candidate) => memberSummary.ai!.pick.teamIds.every((id) => [candidate.home.id, candidate.away.id].includes(id)));
      if (pair) return pair;
    }
    if (edition?.game.teamIds) {
      const pair = pairs.find((candidate) => edition.game.teamIds?.every((id) => [candidate.home.id, candidate.away.id].includes(id)));
      if (pair) return pair;
    }
    return pairs[0] ?? null;
  })();
  const pairTeamIds: [string, string] | null = featuredPair ? [featuredPair.home.id, featuredPair.away.id] : null;
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

  const leagueSection = hub ? (
    <section className={cs("league-section")} data-league-section aria-labelledby="league-section-title">
      <div className={cs("wrap")}>
        <div className={cs("section-head")}>
          <div>
            <p className={cs("section-eyebrow")}>League table</p>
            <h2 id="league-section-title">Standings, leaders & moves.</h2>
          </div>
        </div>
        {preseason && (
          <p className={cs("caption")}>
            Preseason: Sleeper has not published the official Week 1 table yet; named directory records use verified {championEntry?.previousSeason?.season ?? "previous-season"} results, and current rows remain zero until games are played.
          </p>
        )}
        <div className={cs("live-grid")}>
          <div>
            <StandingsTable standings={hub.standings} viewerTeamId={viewerTeamId} championTeamId={championTeamId} />
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
      </div>
    </section>
  ) : (
    <section className={cs("league-section")} data-league-section aria-labelledby="league-section-title">
      <div className={cs("wrap")}>
        <div className={cs("section-head")}>
          <div>
            <p className={cs("section-eyebrow")}>League table</p>
            <h2 id="league-section-title">Standings, leaders & moves.</h2>
          </div>
        </div>
        <p className={cs("empty")}>
          Live league data is temporarily unavailable. Try again or browse the team profiles.
        </p>
      </div>
    </section>
  );

  const toolsAndArchive = (
    <>
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
              Earlier {edition?.status === "draft" ? "sample " : ""}editions stay
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
    </>
  );

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
            {!archived && openingPhase(Date.parse(data.checkedAt), Date.parse(WEEK_ONE_TIP_OFF_ISO), null) !== "past" && (
              <figure className={cs("clubhouse-court")}>
                <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" />
                <div className={cs("court-clock")}>
                  <TipCountdown serverNowIso={data.checkedAt} />
                </div>
              </figure>
            )}
            {memberSummary && (
              <RosterValueSection summary={memberSummary} portraits={portraits} />
            )}
            {memberSummary && (
              <MemberTeamActions summary={memberSummary} />
            )}
            <ScoutingNotebook summary={memberSummary} faces={facesList} pairTeamIds={pairTeamIds} edition={null} portraits={portraits} />
            {memberSummary && (
              <FormGuideWire summary={memberSummary} portraits={portraits} />
            )}
            <AiDecidesSection
              pairs={pairs}
              aiWeekly={aiWeekly}
              season={hub?.season.seasonYear ?? null}
              preseasonPreview={preseasonPreview}
              championTeamId={championTeamId}
              viewerTeamId={viewerTeamId}
            />
            {facesList.some((face) => face.player) && (
              <FacesStrip faces={facesList} portraits={portraits} />
            )}
            <SectionLinks />
          </div>
        </section>
        <CourtsideDirectory entries={data.directory} seasonLabel={seasonLabel} checkedAt={data.checkedAt} preseason={preseason} rosterNamesAvailable={data.rosterNamesAvailable} portraits={portraits} />
        {leagueSection}
        {toolsAndArchive}
      </div>
    );

  const previousIndex = archive.findIndex((entry) => entry.id === edition.id);
  const previous = archive[previousIndex + 1];
  const newer = archive[previousIndex - 1];
  const stale =
    !archived && Date.parse(data.checkedAt) >= Date.parse(edition.endsAt);
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
            entries={entrySlice}
            rosterCounts={Object.fromEntries(data.directory.map((entry) => [entry.identity.id, entry.players.length]))}
            preseason={preseason}
            checkedAt={data.checkedAt}
            season={hub?.season.seasonYear ?? null}
            aiWeekly={aiWeekly}
            viewerTeamId={viewerTeamId}
            archived={archived}
            hero={memberSummary ? { summary: memberSummary, faces: facesList } : null}
            portraits={portraits}
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
          {memberSummary ? (
            <Reveal>
              <RosterValueSection summary={memberSummary} portraits={portraits} />
            </Reveal>
          ) : (
            <Reveal>
              <BarSetSection faces={facesList} pairTeamIds={pairTeamIds} portraits={portraits} />
            </Reveal>
          )}
          <Reveal>
            <ScoutingNotebook summary={memberSummary} faces={facesList} pairTeamIds={pairTeamIds} edition={edition} portraits={portraits} />
          </Reveal>
          {memberSummary && (
            <Reveal>
              <FormGuideWire summary={memberSummary} portraits={portraits} />
            </Reveal>
          )}
          <Reveal>
            <StudChud edition={edition} portraits={portraits} />
          </Reveal>
          <Reveal>
            <AiDecidesSection
              pairs={pairs}
              aiWeekly={aiWeekly}
              season={hub?.season.seasonYear ?? null}
              preseasonPreview={preseasonPreview}
              championTeamId={championTeamId}
              viewerTeamId={viewerTeamId}
            />
          </Reveal>
          {facesList.some((face) => face.player) && (
            <Reveal>
              <FacesStrip faces={facesList} portraits={portraits} />
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
      <CourtsideDirectory
        entries={data.directory}
        seasonLabel={seasonLabel}
        checkedAt={data.checkedAt}
        preseason={preseason}
        rosterNamesAvailable={data.rosterNamesAvailable}
        portraits={portraits}
      />
      {leagueSection}
      {toolsAndArchive}
    </div>
  );
}
