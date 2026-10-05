import Link from "next/link";
import type { Game } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import styles from "./GameCard.module.css";

/** One game in the arcade list. Links to its detail page. */
export function GameCard({ game }: { game: Game }) {
  return (
    <Link href={`/arcade/${game.id}`} className={styles.link}>
      <Card className={styles.card}>
        <div className={styles.top}>
          <span className={styles.icon} aria-hidden="true">
            {game.icon}
          </span>
          <Badge tone={game.status === "live" ? "win" : "neutral"}>
            {game.status === "live" ? "Live" : "Coming soon"}
          </Badge>
        </div>
        <h3 className={styles.name}>{game.name}</h3>
        <p className={styles.desc}>{game.description}</p>
        <span className={styles.cta}>
          {game.status === "live" ? "Play now →" : "Details →"}
        </span>
      </Card>
    </Link>
  );
}
