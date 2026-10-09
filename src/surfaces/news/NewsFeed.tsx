"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RealNewsArticle, RealNewsSection } from "@/domain/news";
import { NEWS_SECTIONS } from "@/domain/news";
import styles from "./NewsFeed.module.css";

function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Relative timestamp, computed after mount so server/client rendering
 * never disagrees across a minute boundary.
 */
function RelativeTime({ ts }: { ts: number }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (ts) setLabel(timeAgo(ts));
  }, [ts]);
  if (!ts) return null;
  return (
    <time
      className="gh-num"
      dateTime={new Date(ts).toISOString()}
      title={new Date(ts).toLocaleString()}
    >
      {label}
    </time>
  );
}

function PlayerChips({ article }: { article: RealNewsArticle }) {
  if (article.players.length === 0) return null;
  return (
    <p className={styles.mentions}>
      <span className={styles.mentionsLabel}>Mentions</span>
      {article.players.map((p, i) => (
        <span key={p.playerId}>
          {i > 0 && " · "}
          <Link href={`/player/${p.playerId}`} className={styles.playerChip}>
            {p.name}
          </Link>
        </span>
      ))}
    </p>
  );
}

function ArticleLink({
  article,
  className,
  children,
}: {
  article: RealNewsArticle;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
      <span className={styles.arrow} aria-hidden="true">
        {" "}
        ↗
      </span>
    </a>
  );
}

/**
 * The real-article feed with section filter chips: Latest /
 * League Players / Rookie Wire / Free Agency. Client-side filtering,
 * no refetch. Headlines link out to the real article on the outlet's
 * site; mentioned players chip-link to their /player pages.
 */
export function NewsFeed({ articles }: { articles: RealNewsArticle[] }) {
  const [section, setSection] = useState<RealNewsSection>("latest");

  const filtered =
    section === "latest"
      ? articles
      : articles.filter((a) => a.sections.includes(section));

  const [lead, ...rest] = filtered;

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="News sections">
        {NEWS_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={section === s.id}
            className={section === s.id ? styles.filterActive : styles.filter}
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className={styles.count} role="status">
        <span className="gh-num">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "article" : "articles"} ·{" "}
        {NEWS_SECTIONS.find((s) => s.id === section)?.label}
      </p>

      {!lead ? (
        <div className={styles.empty}>
          <h2>
            {articles.length
              ? "Nothing filed in this section yet."
              : "The newsroom is quiet."}
          </h2>
          <p>
            {articles.length
              ? "Try Latest for the rest of the day's NBA coverage."
              : "No articles are available right now — the outlet feeds may be down. Check back soon."}
          </p>
        </div>
      ) : (
        <div className={styles.layout}>
          <article className={styles.lead}>
            <p className={styles.kicker}>
              {lead.outlet.name} <span>/ lead story</span>
            </p>
            <h2 className={styles.leadTitle}>
              <ArticleLink article={lead}>{lead.headline}</ArticleLink>
            </h2>
            {lead.summary && <p className={styles.excerpt}>{lead.summary}</p>}
            <div className={styles.byline}>
              <span>{lead.outlet.name}</span>
              <RelativeTime ts={lead.publishedAt} />
            </div>
            <PlayerChips article={lead} />
          </article>
          {rest.length > 0 && (
            <section className={styles.headlines} aria-labelledby="news-headlines">
              <h2 id="news-headlines" className={styles.listTitle}>
                More headlines
              </h2>
              <ol className={styles.list}>
                {rest.map((a) => (
                  <li key={a.id} className={styles.row}>
                    <p className={styles.rowMeta}>
                      {a.outlet.name} · <RelativeTime ts={a.publishedAt} />
                    </p>
                    <h3>
                      <ArticleLink article={a}>{a.headline}</ArticleLink>
                    </h3>
                    {a.summary && <p className={styles.rowSummary}>{a.summary}</p>}
                    <PlayerChips article={a} />
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
