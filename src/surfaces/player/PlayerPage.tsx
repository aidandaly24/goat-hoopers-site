import Link from "next/link";
import type { PlayerDetail, Team } from "@/domain";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { SectionHeading } from "@/ui/SectionHeading";
import { TeamAvatar } from "@/ui/TeamAvatar";
import { TransactionSummary } from "@/ui/TransactionSummary";
import styles from "./PlayerPage.module.css";

/**
 * player — one NBA player's page.
 *
 * Answers "who is this guy and what does he mean to our league": identity
 * (headshot, position pill, NBA team), which GOAT Hoopers roster holds him
 * (or free-agent status), his rookie-draft slot, and every wire move
 * involving him. PlayerDetail arrives fully loaded — this never fetches.
 *
 * Contract:
 * - Receives `detail` (PlayerDetail) and `teams` (for transaction links).
 * - Sleeper's directory carries no per-game NBA stats, so the stats
 *   section is an honest empty state, not fabricated numbers.
 */
export function PlayerPage({
  detail,
  teams,
}: {
  detail: PlayerDetail;
  teams: Team[];
}) {
  const { player, team, transactions, draftPick } = detail;

  return (
    <div className={styles.page}>
      <Card className={styles.identity}>
        <PlayerHeadshot
          espnId={player.espnId}
          name={player.fullName}
          teamId={team?.id ?? null}
          size={88}
        />
        <div className={styles.identityText}>
          <h1 className={styles.name}>{player.fullName}</h1>
          <div className={styles.meta}>
            {player.position && <Badge>{player.position}</Badge>}
            {player.nbaTeam && <Badge tone="neutral">{player.nbaTeam}</Badge>}
            {team ? (
              <Link href={`/teams/${team.id}`} className={styles.teamLink}>
                <TeamAvatar name={team.name} avatar={team.avatar} />
                <span>{team.name}</span>
              </Link>
            ) : (
              <Badge tone="gold">Free Agent</Badge>
            )}
          </div>
        </div>
      </Card>

      <div className={styles.grid}>
        <Card>
          <SectionHeading eyebrow="League status" title="Roster spot" />
          {team ? (
            <p className={styles.body}>
              On <Link href={`/teams/${team.id}`} className={styles.inlineLink}>{team.name}</Link>{" "}
              — {team.wins}W · {team.losses}L, {(team.pointsFor / 100).toFixed(1)} PF.
            </p>
          ) : (
            <p className={styles.body}>
              Sitting on the wire. Somebody&apos;s loss, maybe your gain.
            </p>
          )}
          {draftPick && (
            <p className={styles.body}>
              Drafted{" "}
              <Link href="/draft" className={styles.inlineLink}>
                #{draftPick.pickNo} overall (Round {draftPick.round})
              </Link>{" "}
              in the 2026 rookie draft.
            </p>
          )}
        </Card>

        <Card>
          <SectionHeading eyebrow="NBA numbers" title="Season stats" />
          <p className={styles.body}>
            Sleeper&apos;s data doesn&apos;t carry per-game NBA stat lines, so
            there&apos;s nothing honest to show here yet. League numbers —
            roster, wire, draft — are the real content.
          </p>
        </Card>
      </div>

      <Card>
        <SectionHeading eyebrow="The wire" title="Transactions" />
        {transactions.length === 0 ? (
          <p className={styles.body}>
            No league moves involving {player.fullName} yet. Quiet... too quiet.
          </p>
        ) : (
          <ul className={styles.txList}>
            {transactions.slice(0, 15).map((t) => (
              <li key={t.id} className={styles.txItem}>
                <Badge tone={t.type === "trade" ? "gold" : "neutral"}>
                  {t.type === "trade"
                    ? "Trade"
                    : t.type === "waiver"
                      ? "Waiver"
                      : "FA"}
                </Badge>
                <TransactionSummary transaction={t} teams={teams} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
