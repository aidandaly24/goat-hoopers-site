import type { DraftPick, Team } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./DraftBoard.module.css";

export type DraftBoardProps = {
  /** Completed rookie-draft picks, in pick order. */
  picks: DraftPick[];
  /** All league teams, for avatar/name lookup by pick.teamId. */
  teams: Team[];
};

/**
 * draft — the league's rookie draft board.
 *
 * One coherent experience for "how did every team get here": every pick
 * of the completed rookie draft, grouped by round, with the drafting
 * team and the drafted player's identity.
 *
 * Contract:
 * - Receives `picks` (in pick order) and `teams` as domain objects.
 * - Never fetches. Never touches Sleeper. Domain objects in, JSX out.
 * - Empty picks renders the honest empty state (draft hasn't happened).
 */
export function DraftBoard({ picks, teams }: DraftBoardProps) {
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Group picks by round for readable sections (single pass, no hooks).
  const rounds: { round: number; picks: DraftPick[] }[] = [];
  for (const p of picks) {
    const last = rounds[rounds.length - 1];
    if (last && last.round === p.round) last.picks.push(p);
    else rounds.push({ round: p.round, picks: [p] });
  }

  return (
    <Card>
      <SectionHeading eyebrow="The league" title="2026 Rookie Draft" />
      {picks.length === 0 ? (
        <p className={styles.empty}>
          No draft on record yet. The board appears once the league drafts.
        </p>
      ) : (
        <div className={styles.board}>
          {rounds.map(({ round, picks: roundPicks }) => (
            <section key={round} aria-label={`Round ${round}`}>
              <h3 className={styles.round}>Round {round}</h3>
              <ol className={styles.picks}>
                {roundPicks.map((p) => {
                  const team = teamById.get(p.teamId);
                  return (
                    <li key={p.pickNo} className={styles.row}>
                      <span className={styles.pickNo}>{p.pickNo}</span>
                      <span className={styles.team}>
                        <TeamAvatar
                          name={team?.name ?? "Unknown team"}
                          avatar={team?.avatar ?? null}
                        />
                        <span className={styles.teamName}>
                          {team?.name ?? "Unknown team"}
                        </span>
                      </span>
                      <span className={styles.player}>
                        <span className={styles.playerName}>
                          {p.playerName}
                        </span>
                        <span className={styles.playerMeta}>
                          {p.position && <Badge>{p.position}</Badge>}
                          {p.nbaTeam && (
                            <span className={styles.nbaTeam}>{p.nbaTeam}</span>
                          )}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}
