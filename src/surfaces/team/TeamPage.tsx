import type { Player, Team, TeamRosterValue } from "@/domain";
import { UNAVAILABLE_TOTAL } from "@/domain";
import type { Reward } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { PlayerRow } from "@/ui/PlayerRow";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import styles from "./TeamPage.module.css";

type Props = {
  /** The Sleeper team (identity + record). */
  team: Team;
  /** Resolved roster, in Sleeper order. */
  players: Player[];
  /**
   * The roster priced in modeled FAAB dollars (issue #189). Null only when
   * the team itself couldn't load — a market outage degrades to
   * all-unknown prices inside the object instead.
   */
  rosterValue: TeamRosterValue | null;
  /** FAAB rewards this manager has earned, newest first. */
  rewards: Reward[];
  /** The site display name chosen at claim. */
  displayName: string;
  /** Reigning champion's roster id — from reigningChampionRosterId (previous-season finish). */
  championTeamId?: string | null;
};

/** $12.34 — per-player prices show cents (stocks-page convention). */
function formatFaabPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/** $1,234.56 — the team total, grouped for readability. */
function formatFaabTotal(total: number): string {
  return `$${total.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * TeamPage — "My Team". One place for everything about the logged-in
 * manager's team: identity + record, roster with each player's modeled
 * FAAB price, the team total roster value, and arcade FAAB winnings.
 * Receives domain objects; never fetches.
 *
 * Honesty rules: a rostered player with no market quote renders "—"
 * (unknown), never $0; the total footnotes its coverage ("over N of M
 * players with quotes"); the market's pricing basis (preseason vs
 * in-season) is labeled while it applies.
 */
export function TeamPage({ team, players, rosterValue, rewards, championTeamId }: Props) {
  const pending = rewards.filter((r) => !r.settled);
  const pendingTotal = pending.reduce((sum, r) => sum + r.amountFaab, 0);
  const priceById = new Map(
    (rosterValue?.players ?? []).map((p) => [p.playerId, p.price]),
  );

  return (
    <div className={styles.page}>
      <Card className={styles.identity}>
        <TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} />
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
        {rosterValue && (
          <div className={styles.rosterValue}>
            <span className={styles.rosterValueLabel}>Roster value</span>
            <span
              className={`gh-num ${styles.rosterValueTotal} ${
                rosterValue.total === null ? styles.unknown : ""
              }`}
            >
              {rosterValue.total === null
                ? UNAVAILABLE_TOTAL
                : formatFaabTotal(rosterValue.total)}
            </span>
            <span className={styles.rosterValueNote}>
              over {rosterValue.quotedCount} of {rosterValue.playerCount}{" "}
              players with quotes
            </span>
            {rosterValue.pricingBasis && (
              <Badge tone="gold">
                {rosterValue.pricingBasis === "preseason"
                  ? "Preseason pricing"
                  : "In-season pricing"}
              </Badge>
            )}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeading eyebrow="Roster" title={`${players.length} players`} />
        {players.length === 0 ? (
          <p className={styles.empty}>Roster unavailable right now.</p>
        ) : (
          <ul className={styles.roster}>
            {players.map((p) => {
              const price = priceById.get(p.id) ?? null;
              return (
                <li key={p.id} className={styles.player}>
                  <PlayerRow player={p} teamId={team.id} />
                  <span
                    className={`gh-num ${styles.playerPrice} ${
                      price === null ? styles.unknown : ""
                    }`}
                    title={
                      price === null
                        ? "No modeled price available"
                        : "Modeled FAAB price"
                    }
                  >
                    {price === null ? UNAVAILABLE_TOTAL : formatFaabPrice(price)}
                  </span>
                </li>
              );
            })}
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
