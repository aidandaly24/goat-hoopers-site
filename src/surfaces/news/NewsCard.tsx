import type { NewsArticle, PublicationId } from "@/domain";
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
 * One article: publication masthead, headline, body. Rumors and takes
 * carry their label up front — the fiction is always honest.
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
        <span className={styles.tagline}>{pub.tagline}</span>
        <span className={styles.time}>{timeAgo(a.publishedAt)}</span>
      </div>
      <h3 className={styles.headline}>{a.headline}</h3>
      <div className={styles.body}>
        {a.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className={styles.meta}>
        <span className={styles.kind}>{KIND_LABEL[a.kind]}</span>
        {a.playerNames.length > 0 && (
          <span className={styles.players}>{a.playerNames.join(" · ")}</span>
        )}
      </div>
    </article>
  );
}
