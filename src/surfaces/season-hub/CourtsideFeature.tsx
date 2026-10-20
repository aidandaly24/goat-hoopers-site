/* eslint-disable @next/next/no-img-element -- Existing, pre-sized court image bypasses optimizer quota. */
import type { CSSProperties } from "react";
import Link from "next/link";
import type { WeeklyEdition } from "@/domain/weekly-spotlight";
import { AI_PROBABILITY_LABEL, type AiWeeklySlate } from "@/domain/ai-decider";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { cs } from "./CourtsideStyles";
import type { HomeTeamFace, HomeTeamSummary } from "@/domain/personalized-home";
import { WEEK_ONE_TIP_OFF_ISO, openingPhase } from "@/domain/season-opening";
import { TipCountdown } from "./TipCountdown";
import { formatHomeStamp } from "./homeFormat";
import {
  championTeamIdOf, deriveWeekPairs, hasPairScores, memberPair, recordLine, savedPickFor,
  type PairEntry, type WeekPair,
} from "./weekPairs";

type Props = {
  edition: WeeklyEdition;
  entries: PairEntry[];
  rosterCounts: Record<string, number>;
  preseason: boolean;
  checkedAt: string;
  season: string | null;
  aiWeekly?: AiWeeklySlate;
  viewerTeamId?: string;
  /** True when this feature renders a historical (archived) edition: the
   * opening clock is a *current* clock and never appears there. */
  archived?: boolean;
  /** The signed-in member's projection: their pairing and team desk take
   * the hero. Absent for signed-out visitors — the league desk renders. */
  hero?: { summary: HomeTeamSummary; faces: HomeTeamFace[] } | null;
  portraits?: Record<string, string>;
};

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const pct = (probability: number) => `${Number((probability * 100).toFixed(1))}%`;

/** The member's full roster valuation disclosure: every roster player with
 * their modeled value (unpriced stays "Unpriced" — unknown is never $0),
 * the coverage line and the model basis. Shared by the roster-value section
 * and the missing-edition member block so the disclosure exists wherever
 * the member's value renders. Renders nothing until a valuation with
 * roster rows is actually known. */
export function RosterValuationDetails({ summary, className, style }: {
  summary: HomeTeamSummary;
  className?: string;
  style?: CSSProperties;
}) {
  if (!summary.valuation.knownRoster || summary.rosterValues.length === 0) return null;
  const marketStamp = formatHomeStamp(summary.market?.updatedAt);
  return (
    <details className={`${cs("hero-valuation")}${className ? ` ${className}` : ""}`} style={style} data-hero-valuation>
      <summary>Full roster valuation · all {summary.rosterValues.length} players</summary>
      <ul className={cs("hero-valuation-rows")}>
        {summary.rosterValues.map((player) => (
          <li key={player.id}>
            <Link href={`/player/${player.id}`} prefetch={false}>
              {player.name}
              <small>{player.position ?? "Position unavailable"}</small>
            </Link>
            <span className="gh-num">{player.value === null ? "Unpriced" : `$${player.value.toFixed(2)}`}</span>
          </li>
        ))}
      </ul>
      <p className={cs("caption")}>
        {summary.valuation.complete
          ? `All ${summary.rosterValues.length} roster players priced.`
          : `Subtotal counts priced players only · ${summary.coverage.priced} of ${summary.coverage.roster} priced · ${summary.valuation.unpriced} unpriced — unknown is never $0.`}
        {summary.market && (
          <> Modeled prices · {summary.market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing{marketStamp ? ` · computed ${marketStamp}` : ""}.</>
        )}
      </p>
    </details>
  );
}

/** The member's team actions as the desk's dark action bar: two real
 * destinations, each a ≥44px target. Shared by the team desk and the
 * missing-edition member block. */
export function MemberTeamActions({ summary, className, style }: {
  summary: HomeTeamSummary;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <nav className={`${cs("desk-actions")}${className ? ` ${className}` : ""}`} style={style} aria-label="Your team">
      <Link href="/team" prefetch={false}>My team</Link>
      <Link href={`/teams/${summary.team.id}#team-roster`} prefetch={false}>View roster</Link>
    </nav>
  );
}

/** A desk team's previous-season (preseason) or current line, e.g.
 * "2025 · 17–4 · champion" / "2025 · 16–5 · 4th place". */
function seasonLine(entry: PairEntry | undefined, preseason: boolean): string | null {
  if (!entry) return null;
  const prior = preseason ? entry.previousSeason : null;
  if (prior) return `${prior.season} · ${prior.wins}–${prior.losses}${prior.finish ? ` · ${prior.finish === 1 ? "champion" : `${ordinal(prior.finish)} place`}` : ""}${prior.ownerNote ? " · previous manager" : ""}`;
  const record = entry.currentRecord;
  return record ? `Record ${record.wins}–${record.losses}` : null;
}

/** The member's desk beside the court: identity, last season's line, the
 * Week 1 matchup, their own saved AI probability with provenance, and the
 * team actions. Every block gates on its own data — nothing renders empty. */
function MemberDesk({ summary, entries, pair, preseason, rosterCount, championTeamId, sourceCompatibility }: {
  summary: HomeTeamSummary;
  entries: PairEntry[];
  pair: WeekPair | null;
  preseason: boolean;
  rosterCount: number | undefined;
  championTeamId: string | undefined;
  sourceCompatibility: AiWeeklySlate["sourceCompatibility"];
}) {
  const team = summary.team;
  const ownEntry = entries.find((entry) => entry.identity.id === team.id);
  const ownRecord = recordLine(ownEntry, preseason);
  const prior = preseason ? ownEntry?.previousSeason : null;
  const opponent = pair
    ? (pair.home.id === team.id ? pair.away : pair.home)
    : summary.ai
      ? entries.find((entry) => entry.identity.id === summary.ai!.opponent.id)?.identity
        ?? { id: summary.ai.opponent.id, name: summary.ai.opponent.name, managerName: "", avatar: null }
      : null;
  const opponentEntry = opponent ? entries.find((entry) => entry.identity.id === opponent.id) : undefined;
  const opponentLine = seasonLine(opponentEntry, preseason);
  const ai = summary.ai;
  const result = ai?.pick.status === "ready" ? ai.pick.result : null;
  const ownProbability = result?.probabilities.find((row) => row.choice === team.id)?.probability ?? null;
  const savedStamp = ai ? formatHomeStamp(ai.generatedAt) : null;
  const choiceName = result ? (result.choice === team.id ? team.name : ai?.opponent.name) : null;
  const weekLabel = pair ? `Your Week ${pair.week}` : ai ? `Your Week ${ai.week}` : "Your matchup";
  return (
    <aside className={cs("team-desk")} data-team-desk aria-label="Your team">
      <p className={cs("desk-eyebrow")}>Your team · Roster {team.id.padStart(2, "0")}</p>
      <div className={cs("desk-identity")}>
        <TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} />
        <div>
          <h2>{team.name}</h2>
          <p className={cs("desk-manager")}>Managed by {team.managerName}</p>
        </div>
      </div>
      <dl className={cs("desk-stats")}>
        <div>
          <dt>{ownRecord.label}</dt>
          <dd className="gh-num">{ownRecord.text ?? "—"}</dd>
        </div>
        <div>
          <dt>{prior ? `${prior.season} finish` : "Standing"}</dt>
          <dd>{prior?.finish ? ordinal(prior.finish) : summary.standing ? `No. ${summary.standing.rank}` : "—"}</dd>
        </div>
        <div>
          <dt>Roster</dt>
          <dd className="gh-num">{rosterCount !== undefined ? `${rosterCount} players` : "—"}</dd>
        </div>
      </dl>
      <div className={cs("desk-matchup")}>
        <p className={cs("desk-label")}>{weekLabel}</p>
        {opponent ? (
          <>
            <div className={cs("desk-opponent")}>
              <span className={cs("desk-vs")}>vs</span>
              <TeamAvatar name={opponent.name} avatar={opponent.avatar} isChampion={opponent.id === championTeamId} />
              <Link href={`/teams/${opponent.id}`} prefetch={false}>{opponent.name}</Link>
            </div>
            {opponentLine && <p className={cs("desk-subline")}>{opponentLine}</p>}
            {pair && hasPairScores(pair) && (
              <p className={cs("desk-subline")}>Current score · <span className="gh-num">{pair.homePoints?.toFixed(1)} – {pair.awayPoints?.toFixed(1)}</span></p>
            )}
          </>
        ) : (
          <p className={cs("desk-subline")}>Pairing not set yet — the league check has no matchup for your team.</p>
        )}
      </div>
      <div className={cs("desk-ai")} data-desk-ai>
        <p className={cs("desk-label")}>Your AI win probability</p>
        {ai && result && ownProbability !== null ? (
          <>
            <p className={cs("desk-ai-value")}><strong className="gh-num">{pct(ownProbability)}</strong></p>
            <div className={cs("desk-ai-bar")} aria-hidden="true">
              <span style={{ width: `${ownProbability * 100}%` }} />
            </div>
            <p className={cs("caption")}>
              {AI_PROBABILITY_LABEL} · {ai.label}{ai.status === "stale" ? ` · Stale · saved Week ${ai.week}` : ""}{savedStamp ? ` · Saved ${savedStamp}` : ""} · Model choice: {choiceName}
            </p>
            {sourceCompatibility && <p className={cs("caption")} data-ai-source-compatibility={sourceCompatibility.status}>{sourceCompatibility.message}</p>}
          </>
        ) : (
          <p className={cs("desk-subline")}>No saved AI result for your matchup yet — the full slate is down the page.</p>
        )}
      </div>
      <MemberTeamActions summary={summary} />
    </aside>
  );
}

/** The signed-out desk beside the court: the featured game of the week,
 * both teams' season lines, and the saved AI preview for that pairing with
 * its provenance — the league's story, no account required. */
function LeagueDesk({ edition, pair, entries, preseason, aiWeekly, season, championTeamId, archived }: {
  edition: WeeklyEdition;
  pair: WeekPair | null;
  entries: PairEntry[];
  preseason: boolean;
  aiWeekly?: AiWeeklySlate;
  season: string | null;
  championTeamId: string | undefined;
  archived: boolean;
}) {
  const game = edition.game;
  const pick = pair ? savedPickFor(aiWeekly, season, pair) : undefined;
  const result = pick?.status === "ready" ? pick.result : null;
  const isEditorialPair = !!pair && game.teamIds?.every((id) => [pair.home.id, pair.away.id].includes(id));
  const headline = pair && !archived ? `${pair.home.name} vs ${pair.away.name}` : isEditorialPair ? game.context.split(". ")[0].replace(/\.$/, "") + "." : game.note;
  const dek = pair && !archived ? "The featured pairing from the current league check." : game.selectionReason;
  const savedStamp = aiWeekly?.generatedAt ? formatHomeStamp(aiWeekly.generatedAt) : null;
  return (
    <aside className={cs("team-desk")} data-league-desk aria-label="Game of the week">
      <p className={cs("desk-eyebrow")}>Game of the week{pair ? ` · Week ${pair.week}` : ""}</p>
      <h2 className={cs("desk-headline")}>{headline}</h2>
      <p className={cs("desk-dek")}>{dek}</p>
      {pair && (
        <ul className={cs("desk-teams")}>
          {[pair.home, pair.away].map((side) => {
            const entry = entries.find((candidate) => candidate.identity.id === side.id);
            const line = seasonLine(entry, preseason);
            return (
              <li key={side.id}>
                <TeamAvatar name={side.name} avatar={side.avatar} isChampion={side.id === championTeamId} />
                <span>
                  <Link href={`/teams/${side.id}`} prefetch={false}>{side.name}</Link>
                  {line && <small>{line}</small>}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {pair && (
        <div className={cs("desk-ai")} data-desk-ai>
          <p className={cs("desk-label")}>Saved AI matchup preview</p>
          {result ? (
            <>
              <p className={cs("desk-ai-split")}>
                <span><strong className="gh-num">{pct(result.probabilities.find((row) => row.choice === pair.home.id)?.probability ?? 0)}</strong> {pair.home.name}</span>
                <span>{pair.away.name} <strong className="gh-num">{pct(result.probabilities.find((row) => row.choice === pair.away.id)?.probability ?? 0)}</strong></span>
              </p>
              <div className={cs("desk-ai-bar", "desk-ai-bar-split")} aria-hidden="true">
                <span style={{ width: `${(result.probabilities.find((row) => row.choice === pair.home.id)?.probability ?? 0) * 100}%` }} />
              </div>
              <p className={cs("caption")}>
                {AI_PROBABILITY_LABEL} · {aiWeekly?.status === "stale" ? (aiWeekly.sourceCompatibility?.currentWindow && aiWeekly.sourceCompatibility.status !== "compatible" ? "Saved comparison" : "Past-week saved picks") : "Saved result"}{savedStamp ? ` · Saved ${savedStamp}` : ""} · {result.model}
              </p>
              {aiWeekly?.sourceCompatibility && <p className={cs("caption")} data-ai-source-compatibility={aiWeekly.sourceCompatibility.status}>{aiWeekly.sourceCompatibility.message}</p>}
            </>
          ) : (
            <p className={cs("desk-subline")}>No saved AI preview for this pairing yet.</p>
          )}
        </div>
      )}
      <div className={cs("desk-actions")}>
        <Link href="#ai-decides" prefetch={false}>Explore this week</Link>
        <span>All five matchups</span>
      </div>
    </aside>
  );
}

/** The homepage hero in the approved composition: the edition headline and
 * the court on the left — the Week 1 countdown riding the court as the one
 * overlay, captioned honestly — with the viewer's team desk (members) or
 * the league desk (signed out) beside it. No face-off, no panel, no pair
 * selection: personalization is the desk, and the week's AI board lives
 * down-page in the AI Decides section. */
export function CourtsideFeature({ edition, entries, rosterCounts, preseason, checkedAt, season, aiWeekly, hero, archived = false }: Props) {
  const { pairs, preseasonPreview } = deriveWeekPairs(entries, aiWeekly, season);
  const game = edition.game;
  const week = pairs[0]?.week ?? game.leagueWeek ?? null;
  const championTeamId = championTeamIdOf(entries);
  const heroSummary = hero?.summary ?? null;
  const ownPair = heroSummary ? memberPair(heroSummary, entries) : null;
  const editorialPair = pairs.find((pair) => game.leagueWeek === pair.week && game.teamIds?.every((id) => [pair.home.id, pair.away.id].includes(id))) ?? null;
  const publicPair = editorialPair ?? pairs[0] ?? null;
  const currentPair = ownPair ?? publicPair;
  // Current headings follow current roster identities. The dated editorial
  // remains available separately, rather than posing as a live team label.
  const headline = !archived && currentPair
    ? `${currentPair.home.name} vs ${currentPair.away.name}`
    : game.title;
  const status = preseasonPreview
    ? `Preseason lineup preview · target Week ${week ?? 1}`
    : ownPair || publicPair
      ? `Week ${(ownPair ?? publicPair)!.week} · ${hasPairScores((ownPair ?? publicPair)!) ? "Current score" : "Upcoming · scores pending"}`
      : game.state === "final" ? `Historical final · ${edition.season}` : "Spotlight pending";
  const captionBold = !archived && currentPair ? `${ownPair ? "Your " : ""}Week ${currentPair.week} pairing.` : game.note;
  const captionDek = !archived && currentPair
    ? preseasonPreview
      ? "Saved preseason roster pairing — a lineup comparison, not a fantasy-week score forecast."
      : hasPairScores(currentPair) ? "Current fantasy totals. This scoring week is not confirmed complete." : "Current league pairing. Scores are pending."
    : game.context;
  // The opening clock is gated by the clock itself (anchored to this server
  // check), never by the provider's phase flag: an early-regular phase still
  // counts down to the first tip, and the started state follows the tip.
  // An archived edition is historical: the archive flag closes the gate
  // outright — no current countdown or started UI on a past edition, even
  // when its own league check predates the tip.
  const opening = archived ? "past" : openingPhase(Date.parse(checkedAt), Date.parse(WEEK_ONE_TIP_OFF_ISO), week);
  return (
    <>
      <div className={cs("feature-heading")}>
        <p className={cs("feature-label")}>
          <span>{heroSummary ? "Your featured matchup" : "Featured matchup"} · {status}</span>
          <span className={cs("feature-season")}>{season ? `${season} ${preseason ? "preseason" : "season"}` : ""}{edition.status === "draft" ? " · Sample edition" : ""}</span>
        </p>
        <h1 id="game-title">{headline}</h1>
        {!archived && currentPair && (
          <details className={cs("watchlist-basis")} data-edition-story>
            <summary>From the {edition.dateLabel} edition</summary>
            <p><strong>{game.title}</strong></p>
            <p>{game.context}</p>
          </details>
        )}
      </div>
      <div className={cs("feature-grid")}>
        <div className={cs("court-column")}>
          <figure className={cs("clubhouse-court")} id="clubhouse-court">
            <img src="/courtside/arena.jpg" alt="The GOAT Hoopers basketball court, with players on the floor and fans in the stands" width="1440" height="810" fetchPriority="high" />
            {opening !== "past" && (
              <div className={cs("court-clock")}>
                <TipCountdown serverNowIso={checkedAt} week={week} />
              </div>
            )}
          </figure>
          <div className={cs("feature-caption-row")}>
            <p className={cs("feature-context")} id="matchup-context">
              <strong>{captionBold}</strong> {captionDek}
            </p>
            {!!pairs.length && (
              <Link className={cs("text-link")} href="#ai-decides" prefetch={false}>
                Week {week} matchups
              </Link>
            )}
          </div>
        </div>
        {heroSummary ? (
          <MemberDesk
            summary={heroSummary}
            entries={entries}
            pair={ownPair}
            preseason={preseason}
            rosterCount={rosterCounts[heroSummary.team.id]}
            championTeamId={championTeamId}
            sourceCompatibility={aiWeekly?.sourceCompatibility}
          />
        ) : (
          <LeagueDesk
            edition={edition}
            pair={publicPair}
            entries={entries}
            preseason={preseason}
            aiWeekly={aiWeekly}
            season={season}
            championTeamId={championTeamId}
            archived={archived}
          />
        )}
      </div>
    </>
  );
}
