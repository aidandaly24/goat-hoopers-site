import type { Game, LeaderboardEntry, Reward, SiteUser } from "@/domain/arcade";
import { WEEKLY_FAAB_PRIZE } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { Leaderboard } from "./Leaderboard";
import { RewardLedger } from "./RewardLedger";
import styles from "./GameDetail.module.css";

/**
 * One game's detail page: how to play, the weekly leaderboard, the
 * reward note, and the logged-in user's reward ledger.
 *
 * Contract: receives everything as domain objects. The page
 * (`src/app/arcade/[gameId]/`) loads via the GameStore and hands the
 * results here. Nothing here knows about Postgres.
 */
export function GameDetail({
  game,
  week,
  entries,
  rewards,
  user,
}: {
  game: Game;
  week: string;
  entries: LeaderboardEntry[];
  rewards: Reward[];
  user: SiteUser | null;
}) {
  return (
    <div className={styles.surface}>
      <header className={styles.hero}>
        <span className={styles.icon} aria-hidden="true">
          {game.icon}
        </span>
        <div>
          <p className={styles.eyebrow}>The Arcade</p>
          <h1 className={styles.title}>{game.name}</h1>
        </div>
        <Badge tone={game.status === "live" ? "win" : "neutral"}>
          {game.status === "live" ? "Live" : "Not yet live"}
        </Badge>
      </header>

      <div className={styles.grid}>
        <div className={styles.main}>
          <Card>
            <SectionHeading eyebrow="How to play" title="The rules" />
            <p className={styles.howTo}>{game.howToPlay}</p>
            {game.status === "coming-soon" && (
              <p className={styles.soon}>
                {game.launchNote ??
                  "This game isn't playable yet — the leaderboard opens the moment it goes live."}
              </p>
            )}
          </Card>
          <Leaderboard
            entries={entries}
            week={week}
            highlightTeamId={user?.teamId ?? null}
          />
        </div>

        <aside className={styles.side}>
          <Card className={styles.prizeCard}>
            <SectionHeading eyebrow="Prize" title="What's at stake" />
            <p className={styles.prize}>
              <strong>{WEEKLY_FAAB_PRIZE} FAAB</strong> to the weekly winner.
            </p>
            <p className={styles.note}>
              Winners are tracked in the reward ledger below. The
              commissioner settles FAAB — the Sleeper API doesn't expose
              FAAB adjustments, so settlement stays human.
            </p>
          </Card>
          <RewardLedger rewards={rewards} user={user} />
        </aside>
      </div>
    </div>
  );
}
