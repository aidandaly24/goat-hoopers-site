import Link from "next/link";
import type { NewsArticle, PlayerRef, PublicationId } from "@/domain";
import { PUBLICATIONS } from "@/domain";
import styles from "./NewsCard.module.css";

const PUB_ACCENT: Record<PublicationId, string> = {
  espn: "var(--gh-pub-espn)",
  athletic: "var(--gh-pub-athletic)",
  bleacher: "var(--gh-pub-bleacher)",
  shams: "var(--gh-pub-shams)",
  bayless: "var(--gh-pub-bayless)",
};

const KIND_LABEL: Record<NewsArticle["kind"], string> = {
  trade: "Trade",
  waiver: "Waiver",
  rookie: "Rookie",
  rumor: "Rumor",
  take: "Hot take",
};

function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Turn exact full-name mentions into links to /player/[playerId].
 * Longest names first so "Mikel Brown Jr." wins over any substring.
 */
function linkify(text: string, players: PlayerRef[]): React.ReactNode[] {
  if (players.length === 0) return [text];
  const sorted = [...players].sort((a, b) => b.name.length - a.name.length);
  const escaped = sorted.map((p) =>
    p.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "g"));
  return parts.map((part, i) => {
    const player = sorted.find((p) => p.name === part);
    return player ? (
      <Link
        key={i}
        href={`/player/${player.playerId}`}
        className={styles.playerLink}
      >
        {part}
      </Link>
    ) : (
      // eslint-disable-next-line react/no-array-index-key
      <span key={i}>{part}</span>
    );
  });
}

/**
 * One article: publication masthead, headline, body. Player names render
 * as links to their profile pages, both in the headline/body and the
 * meta line. Rumors and takes carry their label up front — the fiction
 * is always honest.
 */
export function NewsCard({ article: a }: { article: NewsArticle }) {
  const pub = PUBLICATIONS[a.publication];
  return (
    <article
      className={styles.card}
      style={{ "--pub": PUB_ACCENT[a.publication] } as React.CSSProperties}
    >
      <div className={styles.masthead}>
        <span className={styles.pubName}>{pub.name}</span>
        <span className={styles.time}>{timeAgo(a.publishedAt)}</span>
      </div>
      <h3 className={styles.headline}>{linkify(a.headline, a.players)}</h3>
      <div className={styles.body}>
        {a.body.map((p, i) => (
          <p key={i}>{linkify(p, a.players)}</p>
        ))}
      </div>
      <div className={styles.meta}>
        <span className={styles.kind}>{KIND_LABEL[a.kind]}</span>
        {a.players.length > 0 && (
          <span className={styles.players}>
            {a.players.map((p, i) => (
              <span key={p.playerId}>
                {i > 0 && " · "}
                <Link
                  href={`/player/${p.playerId}`}
                  className={styles.playerLink}
                >
                  {p.name}
                </Link>
              </span>
            ))}
          </span>
        )}
      </div>
    </article>
  );
}
