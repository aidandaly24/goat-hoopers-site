import Image from "next/image";
import Link from "next/link";
import type { PlayableGame } from "@/domain/arcade";
import { Card } from "@/ui/Card";
import styles from "./GameCard.module.css";

/** An implemented game: actual preview, honest availability and direct launch. */
export function GameCard({ game }: { game: PlayableGame }) {
  const practice = game.play.mode === "practice";
  return (
    <Card className={styles.card}>
      <div className={styles.preview}>
        <Image src={game.play.preview.src} alt={game.play.preview.alt}
          width={1248} height={696} sizes="(max-width: 1024px) 100vw, 60vw"
          loading="eager" unoptimized className={styles.image} />
        <span className={styles.caption}>Actual gameplay</span>
      </div>
      <div className={styles.details}>
        <p className={styles.mode}>{practice ? "Local practice" : "League game"}</p>
        <h2 className={styles.name}>{game.name}</h2>
        <p className={styles.desc}>{game.description}</p>
        {practice && <p className={styles.access}>No sign-in needed. Scores stay in this session.</p>}
        <Link href={`/arcade/${game.id}`} className={styles.play} aria-label={`Play ${game.name}`}>
          Play now <span aria-hidden="true">↗</span>
        </Link>
        <div className={styles.controls}>
          <h3>On your phone</h3>
          <p>{game.play.touchInstructions}</p>
        </div>
        {game.id === "free-throw" && <p className={styles.keyboard}>Keyboard: A/D or arrows to aim. Hold Space and release to shoot.</p>}
      </div>
    </Card>
  );
}
