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
 * - The Season stats card renders `detail.production`: dated season-average
 *   evidence from Sleeper's stat feed when the source has a recorded line,
 *   and a precise unavailable reason otherwise. Nothing is fabricated or
 *   relabeled across seasons.
 */
export function PlayerPage({
  detail,
  teams,
  championTeamId,
}: {
  detail: PlayerDetail;
  teams: Team[];
  /** Reigning champion's roster id — from reigningChampionRosterId (previous-season finish). */
  championTeamId?: string | null;
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
                <TeamAvatar name={team.name} avatar={team.avatar} isChampion={team.id === championTeamId} />
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
          <ProductionCard
            summary={detail.production}
            playerName={player.fullName}
          />
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

/**
 * Season-stats card body (P4, issue #224). Renders the dated production
 * evidence from `detail.production` when the source has a recorded line —
 * per-game season averages with known GP/GS — and a precise unavailable
 * reason otherwise. Never fabricated, never relabeled across seasons.
 */
function ProductionCard({
  summary,
  playerName,
}: {
  summary: PlayerDetail["production"];
  playerName: string;
}) {
  if (!summary) {
    return (
      <p className={styles.body}>
        Season production isn&apos;t available for {playerName} right now.
        League numbers — roster, wire, draft — are the real content.
      </p>
    );
  }
  if (summary.state === "unavailable") {
    return (
      <p className={styles.body}>
        {summary.reason === "no-recorded-stats"
          ? `Sleeper's stat feed has no recorded line for ${playerName} yet — the season just tipped off.`
          : `Sleeper's recorded line for ${playerName} failed validation, so it's withheld rather than shown.`}{" "}
        League numbers — roster, wire, draft — are the real content.
      </p>
    );
  }
  const { production } = summary;
  const { averages } = production;
  const cells: Array<{ label: string; value: string }> = [
    { label: "PTS", value: averages.pts.toFixed(1) },
    { label: "REB", value: averages.reb.toFixed(1) },
    { label: "AST", value: averages.ast.toFixed(1) },
    { label: "STL", value: averages.stl.toFixed(1) },
    { label: "BLK", value: averages.blk.toFixed(1) },
    { label: "3PM", value: averages.tpm.toFixed(1) },
    { label: "MIN", value: averages.min.toFixed(1) },
    { label: "FG%", value: averages.fgPct === null ? "—" : `${averages.fgPct.toFixed(1)}%` },
    { label: "FT%", value: averages.ftPct === null ? "—" : `${averages.ftPct.toFixed(1)}%` },
  ];
  return (
    <>
      <div className={styles.statGrid} role="list" aria-label="Season averages">
        {cells.map((cell) => (
          <div key={cell.label} className={styles.statCell} role="listitem">
            <span className={styles.statValue}>{cell.value}</span>
            <span className={styles.statLabel}>{cell.label}</span>
          </div>
        ))}
      </div>
      <p className={styles.statNote}>
        Recorded {production.season} season averages · {production.gp} GP ·{" "}
        {production.gs} GS · Sleeper stat feed
      </p>
    </>
  );
}
