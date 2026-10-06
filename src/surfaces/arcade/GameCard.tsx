import Link from "next/link";
import type { GameHubSummary, SiteUser } from "@/domain/arcade";
import { WEEKLY_FAAB_PRIZE } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import styles from "./GameCard.module.css";

/**
 * One game in the arcade list. Shows the stakes (weekly FAAB prize),
 * this week's leader (or the honest empty state), and the viewer's own
 * state — "Your move" when they're logged in and scoreless on a live
 * game, a claim nudge when logged out. Coming-soon games say why and
 * when (game.launchNote), never a bare "coming soon".
 */
export function GameCard({
  summary,
  user,
}: {
  summary: GameHubSummary;
  user: SiteUser | null;
}) {
  const { game, leader, myBest } = summary;
  const live = game.status === "live";
  const yourMove = live && user !== null && myBest === null;

  return (
    <Link
      href={`/arcade/${game.id}`}
      className={styles.link}
      aria-label={`${game.name} — ${live ? "play now" : "details"}`}
    >
      <Card className={styles.card}>
        <div className={styles.top}>
          <span className={styles.icon} aria-hidden="true">
            {game.icon}
          </span>
          <span className={styles.badges}>
            {yourMove && <Badge tone="gold">Your move</Badge>}
            <Badge tone={live ? "win" : "neutral"}>
              {live ? "Live" : "Not yet live"}
            </Badge>
          </span>
        </div>
        <h3 className={styles.name}>{game.name}</h3>
        <p className={styles.desc}>{game.description}</p>
        <dl className={styles.meta}>
          <div className={styles.row}>
            <dt>Prize</dt>
            <dd className="gh-num">{WEEKLY_FAAB_PRIZE} FAAB / week</dd>
          </div>
          <div className={styles.row}>
            <dt>Leader</dt>
            <dd>
              {leader ? (
                <>
                  {leader.isCurrentUser ? "You" : leader.displayName}
                  {" — "}
                  <span className="gh-num">{leader.score}</span>
                </>
              ) : (
                <span className={styles.quiet}>No scores yet — be the first.</span>
              )}
            </dd>
          </div>
          <div className={styles.row}>
            <dt>You</dt>
            <dd>
              {!user ? (
                <span className={styles.quiet}>Claim your team to play.</span>
              ) : myBest !== null ? (
                <>
                  Your best: <span className="gh-num">{myBest}</span>
                </>
              ) : live ? (
                <span className={styles.move}>No score yet — your move.</span>
              ) : (
                <span className={styles.quiet}>On the bench until it ships.</span>
              )}
            </dd>
          </div>
        </dl>
        {game.launchNote && !live && (
          <p className={styles.soon}>{game.launchNote}</p>
        )}
        <span className={styles.cta}>{live ? "Play now →" : "Details →"}</span>
      </Card>
    </Link>
  );
}
