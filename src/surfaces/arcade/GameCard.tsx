import Image from "next/image";
import Link from "next/link";
import type { PlayableGame } from "@/domain/arcade";
import { Card } from "@/ui/Card";
import styles from "./GameCard.module.css";

/** An implemented game: actual preview, honest availability and direct launch. */
export function GameCard({ game }: { game: PlayableGame }) {
  const practice = game.play.mode === "practice";
  const preview = game.play.mode === "preview";
  const art = game.play.preview;
  return (
    <Card className={styles.card}>
      <div className={styles.preview}>
        {"src" in art ? <>
          <Image src={art.src} alt={art.alt}
            width={1248} height={696} sizes="(max-width: 640px) 100vw, 50vw"
            unoptimized className={styles.image} />
          <span className={styles.caption}>Actual gameplay</span>
        </> : <div className={styles.draftArt} aria-label={`${art.label} roster draft preview artwork`}>
          <span className={styles.artEdition}>{art.caption}</span>
          <strong>{art.label}</strong>
          {art.note && <span className={styles.artNote}>{art.note}</span>}
        </div>}
      </div>
      <div className={styles.details}>
        <p className={styles.mode}>{practice ? "Local practice" : preview ? "Week 2 · Unranked preview" : "League game"}</p>
        <h2 className={styles.name}>{game.name}</h2>
        <p className={styles.desc}>{game.description}</p>
        {practice && <p className={styles.access}>No sign-in needed. Scores stay in this session.</p>}
        {preview && <p className={styles.access}>Try the draft. Week 2 competition stays closed.</p>}
        <Link href={`/arcade/${game.id}`} className={styles.play} aria-label={`${preview ? "Preview" : "Play"} ${game.name}`}>
          {preview ? "Enter 82–0 preview" : "Play now"}
        </Link>
        <Link href={`/arcade/${game.id}/leaderboard`}>All-time leaderboard</Link>
        <details className={styles.controls}>
          <summary>How to play</summary>
          <p>{game.play.touchInstructions}</p>
          {game.id === "free-throw" && <p className={styles.keyboard}>Keyboard: A/D or arrows to aim. Hold Space and release to shoot.</p>}
        </details>
      </div>
    </Card>
  );
}
