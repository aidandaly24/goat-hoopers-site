import Image from "next/image";
import Link from "next/link";
import type { PlayableGame } from "@/domain/arcade";
import { Card } from "@/ui/Card";
import controls from "@/ui/controls.module.css";
import styles from "./GameCard.module.css";

/** An implemented game: actual preview, honest availability and direct launch. */
export function GameCard({ game }: { game: PlayableGame }) {
  const practice = game.play.mode === "practice";
  const preview = game.play.mode === "preview";
  const rankedFreeThrow = game.id === "free-throw";
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
        <p className={styles.mode}>{rankedFreeThrow ? "Ranked Free Throw · Local practice" : practice ? "Local practice" : preview ? "Week 2 · Unranked preview" : "League game"}</p>
        <h2 className={styles.name}>{game.name}</h2>
        <p className={styles.desc}>{rankedFreeThrow ? "Play a saved ranked round, or warm up on the local practice court." : game.description}</p>
        {practice && <p className={styles.access}>{rankedFreeThrow ? "Ranked rounds require a verified personal account. Local practice needs no sign-in and does not save a ranked score." : "No sign-in needed. Scores stay in this session."}</p>}
        {preview && <p className={styles.access}>Try the draft. Week 2 competition stays closed.</p>}
        <Link href={rankedFreeThrow ? "/arcade/ranked-free-throw" : `/arcade/${game.id}`} className={styles.play} aria-label={rankedFreeThrow ? "Play ranked free throws" : `${preview ? "Preview" : "Practice"} ${game.name}`}>
          {rankedFreeThrow ? "Play ranked free throws" : preview ? "Enter 82–0 preview" : "Play local practice"}
        </Link>
        {rankedFreeThrow ? <>
          <Link className={controls.quiet} href="/arcade/free-throw">Local practice court</Link>
          <Link className={controls.quiet} href="/arcade/free-throw/leaderboard">All-time ranked leaderboard</Link>
        </> : <p className={styles.access}>Unranked · no weekly or all-time leaderboard.</p>}
        <details className={styles.controls}>
          <summary>How to play</summary>
          <p>{game.play.touchInstructions}</p>
          {game.id === "free-throw" && <p className={styles.keyboard}>Keyboard: A/D or arrows to aim. Hold Space and release to shoot.</p>}
        </details>
      </div>
    </Card>
  );
}
