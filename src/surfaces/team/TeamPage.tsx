import type { Player, Team } from "@/domain";
import type { Reward } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./TeamPage.module.css";

type Props = {
  /** The Sleeper team (identity + record). */
  team: Team;
  /** Resolved roster, in Sleeper order. */
  players: Player[];
  /** FAAB rewards this manager has earned, newest first. */
  rewards: Reward[];
  /** The site display name chosen at claim. */
  displayName: string;
};

/**
 * TeamPage — "My Team". One place for everything about the logged-in
 * manager's team: identity + record, full roster, and arcade FAAB winnings.
 * Receives domain objects; never fetches.
 */
export function TeamPage({ team, players, rewards }: Props) {
  const pending = rewards.filter((r) => !r.settled);
  const pendingTotal = pending.reduce((sum, r) => sum + r.amountFaab, 0);

  return (
    <div className={styles.page}>
      <Card className={styles.identity}>
        <TeamAvatar name={team.name} avatar={team.avatar} />
        <div className={styles.identityText}>
          <p className={styles.eyebrow}>My team</p>
          <h1 className={styles.teamName}>{team.name}</h1>
          <p className={styles.manager}>managed by {team.managerName}</p>
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
        </dl>
      </Card>

      <Card>
        <SectionHeading eyebrow="Roster" title={`${players.length} players`} />
        {players.length === 0 ? (
          <p className={styles.empty}>Roster unavailable right now.</p>
        ) : (
          <ul className={styles.roster}>
            {players.map((p) => (
              <li key={p.id} className={styles.player}>
                <span className={styles.playerName}>{p.fullName}</span>
                <span className={styles.playerMeta}>
                  {p.position && <Badge>{p.position}</Badge>}
                  {p.nbaTeam && <span className={styles.nbaTeam}>{p.nbaTeam}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHeading
          eyebrow="Arcade winnings"
          title={
            pendingTotal > 0
              ? `$${pendingTotal} FAAB pending`
              : "FAAB rewards"
          }
        />
        {rewards.length === 0 ? (
          <p className={styles.empty}>
            No winnings yet — play arcade games to earn FAAB.
          </p>
        ) : (
          <ul className={styles.rewards}>
            {rewards.map((r) => (
              <li key={r.id} className={styles.reward}>
                <span className={styles.rewardAmount}>${r.amountFaab}</span>
                <span className={styles.rewardDetail}>
                  {r.gameId} · {r.week}
                </span>
                <Badge tone={r.settled ? "neutral" : "gold"}>
                  {r.settled ? "Settled" : "Pending"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
