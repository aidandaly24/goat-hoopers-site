import Link from "next/link";
import type { FranchiseHistory, Matchup, Team, TeamProfile } from "@/domain";
import { fmtTotal, isFinal, totalLabel } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { PlayerName, PlayerRow } from "@/ui/PlayerRow";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { TransactionSummary } from "@/ui/TransactionSummary";
import { FranchiseSection } from "@/surfaces/history/FranchiseSection";
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
    <li className={styles.game}>
      <Link href={`/teams/${matchup.home.id}`} className={styles.gameTeam}>
        <TeamAvatar name={matchup.home.name} avatar={matchup.home.avatar} />
        <span className={styles.gameTeamName}>{matchup.home.name}</span>
        {homeWon && <Badge tone="win">W</Badge>}
        {awayWon && <Badge tone="loss">L</Badge>}
      </Link>
      <span className={styles.score}>
        {fmtPts(matchup.homePoints)} — {fmtPts(matchup.awayPoints)}
      </span>
      <Link href={`/teams/${matchup.away.id}`} className={styles.gameTeam}>
        {awayWon && <Badge tone="win">W</Badge>}
        {homeWon && <Badge tone="loss">L</Badge>}
        <span className={styles.gameTeamName}>{matchup.away.name}</span>
        <TeamAvatar name={matchup.away.name} avatar={matchup.away.avatar} />
      </Link>
      <span className={styles.week}>Week {matchup.week}</span>
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
 * - Empty sections (preseason game log, no transactions) render honest
 *   empty states, never fake rows.
 * - Documented composite surface (ARCHITECTURE.md §3): composes the
 *   public `FranchiseSection` entrypoint from the history surface.
 */
export function TeamProfile({
  profile,
  teams,
  franchise,
}: {
  profile: TeamProfile;
  teams: Team[];
  franchise?: FranchiseHistory | null;
}) {
  const { team, players, matchups, streak, draftPicks, transactions } =
    profile;

  return (
    <div className={styles.page}>
      <Card className={styles.identity}>
        <TeamAvatar name={team.name} avatar={team.avatar} />
        <div className={styles.identityText}>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.manager}>managed by {team.managerName}</p>
          <div className={styles.badges}>{streakBadge(streak)}</div>
        </div>
        <dl className={styles.record}>
          <div>
            <dt>W</dt>
            <dd className={styles.win}>{team.wins}</dd>
          </div>
          <div>
            <dt>L</dt>
            <dd className={styles.loss}>{team.losses}</dd>
          </div>
          <div>
            <dt>PF</dt>
            <dd>{(team.pointsFor / 100).toFixed(1)}</dd>
          </div>
          <div>
            <dt>PA</dt>
            <dd aria-label={totalLabel("Points against", team.pointsAgainst)}>
              {fmtTotal(team.pointsAgainst)}
            </dd>
          </div>
        </dl>
      </Card>

      {franchise && <FranchiseSection history={franchise} />}

      <div className={styles.grid}>
        <Card>
          <SectionHeading
            eyebrow="Roster"
            title={`${players.length} players`}
          />
          {players.length === 0 ? (
            <p className={styles.empty}>Roster unavailable right now.</p>
          ) : (
            <ul className={styles.roster}>
              {players.map((p) => (
                <li key={p.id}>
                  <PlayerRow player={p} teamId={team.id} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className={styles.side}>
          <Card>
            <SectionHeading eyebrow="Season" title="Game log" />
            {matchups.length === 0 ? (
              <p className={styles.empty}>
                No games yet — the season tips off and this fills in week by week.
              </p>
            ) : (
              <ul className={styles.games}>
                {matchups.map((m) => (
                  <MatchupRow key={`${m.week}-${m.home.id}`} matchup={m} />
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeading eyebrow="2026 draft" title="Rookie picks" />
            {draftPicks.length === 0 ? (
              <p className={styles.empty}>No picks on record.</p>
            ) : (
              <ul className={styles.picks}>
                {draftPicks.map((p) => (
                  <li key={p.pickNo} className={styles.pick}>
                    <Badge tone="gold">#{p.pickNo}</Badge>
                    <PlayerName
                      player={{ id: p.playerId, fullName: p.playerName }}
                    />
                    {p.position && <Badge>{p.position}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeading eyebrow="The wire" title="Recent moves" />
            {transactions.length === 0 ? (
              <p className={styles.empty}>
                Quiet on the wire for {team.name}. For now.
              </p>
            ) : (
              <ul className={styles.moves}>
                {transactions.map((t) => (
                  <li key={t.id} className={styles.move}>
                    <TransactionSummary transaction={t} teams={teams} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
