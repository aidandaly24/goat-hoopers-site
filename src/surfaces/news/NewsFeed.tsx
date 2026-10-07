"use client";

import { useState } from "react";
import type { NewsArticle, NewsSection } from "@/domain";
import { NEWS_SECTIONS } from "@/domain";
import { NewsCard } from "./NewsCard";
import styles from "./NewsFeed.module.css";

/**
 * The article feed with section filter chips: Latest / Rookie Wire /
 * Rumor Mill / Hot Takes. Client-side filtering, no refetch.
 */
export function NewsFeed({ articles }: { articles: NewsArticle[] }) {
  const [section, setSection] = useState<NewsSection>("latest");

  const filtered =
    section === "latest"
      ? articles
      : articles.filter((a) => a.section === section);

  return (
    <div>
      <div className={styles.chips} role="group" aria-label="News sections">
        {NEWS_SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={section === s.id ? styles.chipActive : styles.chip}
            onClick={() => setSection(s.id)}
            aria-pressed={section === s.id}
          >
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>
          Nothing filed here yet — the press room is waiting on the league
          to make some news.
        </p>
      ) : (
        <div className={styles.feed}>
          {filtered.map((a) => (
            <NewsCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
