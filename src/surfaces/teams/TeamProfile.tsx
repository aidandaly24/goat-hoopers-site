import Link from "next/link";
import { Suspense } from "react";
import type {
  FranchiseHistory,
  ManagerArchetype,
  Matchup,
  Team,
  TeamProfile,
} from "@/domain";
import { fmtTotal, isFinal, totalLabel } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { PlayerName } from "@/ui/PlayerRow";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { TransactionSummary } from "@/ui/TransactionSummary";
import { FranchiseSection } from "@/surfaces/history/FranchiseSection";
import { GmArchetypeCard } from "./GmArchetypeCard";
import { TeamRoster, TeamRosterList } from "./TeamRoster";
import "@/ui/courtside-tokens.css";
import styles from "./TeamProfile.module.css";

function streakBadge(streak: number) {
  if (streak > 0)
    return (
      <Badge tone="win">
        W{streak}
      </Badge>
    );
  if (streak < 0)
    return (
      <Badge tone="loss">
        L{Math.abs(streak)}
      </Badge>
    );
  return null;
}

function fmtPts(p: number | null): string {
  if (p === null) return "—";
  return p.toFixed(1);
}

function MatchupRow({ matchup }: { matchup: Matchup }) {
  const final = isFinal(matchup);
  const homeWon =
    final && (matchup.homePoints as number) > (matchup.awayPoints as number);
  const awayWon =
    final && (matchup.awayPoints as number) > (matchup.homePoints as number);
  return (
    <li className={styles.game} data-matchup-week={matchup.week}>
      <div className={styles.gameHead}>
        <span>
          Week <span className="gh-num">{matchup.week}</span>
        </span>
        <span>{final ? (homeWon || awayWon ? "Final" : "Tie") : "Pending"}</span>
      </div>
      <Link href={`/teams/${matchup.home.id}`} className={styles.gameTeam}>
        <TeamAvatar name={matchup.home.name} avatar={matchup.home.avatar} />
        <span className={styles.gameTeamName}>{matchup.home.name}</span>
        {homeWon && <Badge tone="win">W</Badge>}
        {awayWon && <Badge tone="loss">L</Badge>}
      </Link>
      <span
        className={`${styles.score} gh-num`}
        aria-label={`${matchup.home.name} points: ${fmtPts(matchup.homePoints)}`}
      >
        {fmtPts(matchup.homePoints)}
      </span>
      <Link href={`/teams/${matchup.away.id}`} className={styles.gameTeam}>
        <TeamAvatar name={matchup.away.name} avatar={matchup.away.avatar} />
        <span className={styles.gameTeamName}>{matchup.away.name}</span>
        {awayWon && <Badge tone="win">W</Badge>}
        {homeWon && <Badge tone="loss">L</Badge>}
      </Link>
      <span
        className={`${styles.score} gh-num`}
        aria-label={`${matchup.away.name} points: ${fmtPts(matchup.awayPoints)}`}
      >
        {fmtPts(matchup.awayPoints)}
      </span>
    </li>
  );
}

/**
 * teams — one franchise's public profile (/teams/[rosterId]).
 *
 * Answers "what's this team's deal": identity + record + streak, the full
 * roster (every name a link to their player page), the season game log,
 * their rookie-draft haul, and recent wire moves. Receives domain objects;
 * never fetches. The logged-in /team page composes this with private
 * data (arcade FAAB winnings) rather than duplicating it.
 *
 * Contract:
 * - Receives `profile` (TeamProfile) and `teams` (all league teams, for
 *   transaction actor links).
 * - Optional `archetype` (ManagerArchetype | null): the GM IQ card renders
 *   when provided (null = honest empty state).
 *   Omitted = no card (callers without archetype data are untouched).
 * - Empty sections (preseason game log, no transactions) render honest
 *   empty states, never fake rows.
 * - Documented composite surface (ARCHITECTURE.md §3): composes the
 *   public `FranchiseSection` entrypoint from the history surface.
 */
export function TeamProfile({
  profile,
  teams,
  franchise,
  archetype,
}: {
  profile: TeamProfile;
  teams: Team[];
  franchise?: FranchiseHistory | null;
  archetype?: ManagerArchetype | null;
}) {
  const { team, players, matchups, streak, draftPicks, transactions } =
    profile;
  // Supplied weeks are newest-first. Find the earliest unfinished pairing
  // without sorting/mutating the full game log or inventing a current week.
  const nextMatchup = matchups.reduce<Matchup | null>(
    (next, matchup) =>
      !isFinal(matchup) && (!next || matchup.week < next.week) ? matchup : next,
    null,
  );
  const opponent = nextMatchup && (
    nextMatchup.home.id === team.id ? nextMatchup.away : nextMatchup.home
  );

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumbs}>
        <Link href="/teams">← All teams</Link>
        <span>Public team profile</span>
      </div>
      <header className={styles.identity}>
        <TeamAvatar name={team.name} avatar={team.avatar} />
        <div className={styles.identityText}>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.manager}>managed by {team.managerName}</p>
          {streak !== 0 && (
            <div className={styles.badges} aria-label="Active streak">
              {streakBadge(streak)}
            </div>
          )}
        </div>
        <dl className={styles.record}>
          <div>
            <dt>W</dt>
            <dd className={`${styles.win} gh-num`}>{team.wins}</dd>
          </div>
          <div>
            <dt>L</dt>
            <dd className={`${styles.loss} gh-num`}>{team.losses}</dd>
          </div>
          {team.ties !== 0 && (
            <div>
              <dt>T</dt>
              <dd className="gh-num">{team.ties}</dd>
            </div>
          )}
          <div>
            <dt>PF</dt>
            <dd className="gh-num" aria-label={totalLabel("Points for", team.pointsFor)}>
              {(team.pointsFor / 100).toFixed(1)}
            </dd>
          </div>
          <div>
            <dt>PA</dt>
            <dd className="gh-num" aria-label={totalLabel("Points against", team.pointsAgainst)}>
              {fmtTotal(team.pointsAgainst)}
            </dd>
          </div>
        </dl>
      </header>
      <nav className={styles.sections} aria-label="Team profile sections">
        <a href="#team-roster">Roster</a>
        <a href="#team-matchup">Matchup</a>
        <a href="#team-games">Game log</a>
        <a href="#team-picks">Picks</a>
        <a href="#team-moves">Moves</a>
        {archetype !== undefined && <a href="#team-gm">GM IQ</a>}
        {franchise && <a href="#team-history">History</a>}
      </nav>

      <section id="team-matchup" aria-label="Next matchup">
        <Card className={styles.next}>
          <div className={styles.nextHeading}>
            <h2>Next matchup</h2>
            {nextMatchup && (
              <span>Week <span className="gh-num">{nextMatchup.week}</span></span>
            )}
          </div>
          {opponent ? (
            <Link className={styles.opponent} href={`/teams/${opponent.id}`}>
              <TeamAvatar name={opponent.name} avatar={opponent.avatar} />
              <span className={styles.opponentIdentity}>
                <strong>{opponent.name}</strong>
                <span>managed by {opponent.managerName}</span>
              </span>
              <span className="gh-num" aria-label={`${opponent.wins} wins, ${opponent.losses} losses`}>
                {opponent.wins}–{opponent.losses}
              </span>
            </Link>
          ) : (
            <p className={styles.empty}>No upcoming matchup supplied.</p>
          )}
        </Card>
      </section>

      <div className={styles.grid}>
        <section id="team-roster" className={styles.rosterSection} aria-label="Roster">
          <div className={styles.heading}>
            <SectionHeading eyebrow="Roster" title={`${players.length} players`} />
          </div>
          {players.length === 0 ? (
            <p className={styles.empty}>Roster unavailable right now.</p>
          ) : (
            <Suspense fallback={<TeamRosterList players={players} teamId={team.id} />}>
              <TeamRoster players={players} teamId={team.id} />
            </Suspense>
          )}
        </section>

        <div className={styles.side}>
          <section id="team-games" className={styles.detail} aria-label="Game log">
            <div className={styles.heading}>
              <SectionHeading eyebrow="Season" title="Game log" />
            </div>
            {matchups.length === 0 ? (
              <p className={styles.empty}>No games supplied yet.</p>
            ) : (
              <ul className={styles.games}>
                {matchups.map((m) => (
                  <MatchupRow key={`${m.week}-${m.home.id}`} matchup={m} />
                ))}
              </ul>
            )}
          </section>

          <section id="team-picks" className={styles.detail} aria-label="Rookie picks">
            <div className={styles.heading}>
              <SectionHeading eyebrow="Draft" title="Rookie picks" />
            </div>
            {draftPicks.length === 0 ? (
              <p className={styles.empty}>No picks on record.</p>
            ) : (
              <ul className={styles.picks}>
                {draftPicks.map((p) => (
                  <li key={p.pickNo} className={styles.pick} data-pick-number={p.pickNo}>
                    <Badge tone="gold">#{p.pickNo}</Badge>
                    <PlayerName
                      player={{ id: p.playerId, fullName: p.playerName }}
                    />
                    {p.position && <Badge>{p.position}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="team-moves" className={styles.detail} aria-label="Recent moves">
            <div className={styles.heading}>
              <SectionHeading eyebrow="The wire" title="Recent moves" />
            </div>
            {transactions.length === 0 ? (
              <p className={styles.empty}>No recent moves supplied.</p>
            ) : (
              <ul className={styles.moves}>
                {transactions.map((t) => (
                  <li key={t.id} className={styles.move} data-transaction-id={t.id}>
                    <TransactionSummary transaction={t} teams={teams} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
      {archetype !== undefined && (
        <section id="team-gm" aria-label="GM IQ">
          <GmArchetypeCard archetype={archetype} />
        </section>
      )}
      {franchise && (
        <div id="team-history"><FranchiseSection history={franchise} /></div>
      )}
    </div>
  );
}
