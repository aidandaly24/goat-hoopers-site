"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type {
  LeagueNewsEdition,
  NewsCoverage,
  RealNewsArticle,
  RealNewsSection,
} from "@/domain/news";
import { NEWS_SECTIONS, sectionCoverageStatus } from "@/domain/news";
import {
  clearLegacyParamsHref,
  hasLegacyStoryParams,
  parseSectionParam,
  sectionHref,
} from "./newsUrls";
import styles from "./NewsFeed.module.css";

function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Deterministic UTC timestamp for the title attribute.
 * Date#toLocaleString differs by server/client locale AND timezone, so
 * it must never appear in rendered HTML — hydration would disagree.
 */
function utcTitle(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ` +
    `${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`
  );
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
      title={utcTitle(ts)}
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

/** Why a section is unavailable, in plain language. */
function unavailableReason(
  section: RealNewsSection,
  coverage: NewsCoverage
): string {
  if (coverage.directory === "unknown")
    return "We couldn't load the player directory, so no articles could be matched to players.";
  if (section === "rookies")
    return "We couldn't load the rookie draft board, so Rookie Wire can't be classified right now.";
  return "We couldn't load league rosters, so player classification is unavailable right now.";
}

const NAV_EVENT = "newsroom-navigation";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAV_EVENT, callback);
  };
}
function getSearchSnapshot() {
  return window.location.search;
}
function getServerSnapshot() {
  return "";
}

/**
 * Push (or replace) a newsroom URL and notify subscribers. Section
 * changes push so Back/Forward walk the section history; the retired
 * notice dismisses with replace so it doesn't add a history entry.
 */
function navigate(href: string, replace = false) {
  const url = new URL(href, window.location.href);
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
}

/**
 * The real-article feed with URL-driven section chips: Latest / League
 * Players / Rookie Wire / Free Agency.
 *
 * URL contract (see ./newsUrls.ts):
 * - `?section=<id>` selects the section; Back/Forward/refresh work.
 * - `?story=` / `?revision=` are legacy params from the retired
 *   fictional story reader: they render an honest "retired" notice with
 *   a path back to the headlines, never a broken reader.
 *
 * Sections whose identity input failed (see NewsCoverage) render as
 * explicitly unavailable — never silently empty. Headlines link out to
 * the real article on the outlet's site; mentioned players chip-link to
 * their /player pages. Client-side filtering, no refetch.
 */
export function NewsFeed({ edition }: { edition: LeagueNewsEdition }) {
  // URL-driven section: server renders "latest" (getServerSnapshot),
  // the client re-reads after hydration — no mismatch, and Back/Forward
  // work through the popstate subscription.
  const search = useSyncExternalStore(
    subscribe,
    getSearchSnapshot,
    getServerSnapshot
  );
  const section = parseSectionParam(search);
  const showRetired = hasLegacyStoryParams(search);
  const { articles, coverage } = edition;

  const availability = sectionCoverageStatus(section, coverage);
  const filtered =
    section === "latest"
      ? articles
      : articles.filter((a) => a.sections.includes(section));

  const [lead, ...rest] = availability === "available" ? filtered : [];

  function selectSection(next: RealNewsSection) {
    if (next !== section) navigate(sectionHref(next));
  }

  function dismissRetired() {
    navigate(clearLegacyParamsHref(search), true);
  }

  const sectionLabel =
    NEWS_SECTIONS.find((s) => s.id === section)?.label ?? "Latest";

  return (
    <div>
      {showRetired && (
        <div className={styles.retired} role="status">
          <p>
            <strong>Story links have retired.</strong> The previous
            newsroom&apos;s story reader is gone — headlines now link
            directly to the outlet&apos;s site instead.
          </p>
          <button type="button" onClick={dismissRetired}>
            Back to the latest headlines
          </button>
        </div>
      )}
      <div className={styles.filters} role="group" aria-label="News sections">
        {NEWS_SECTIONS.map((s) => {
          const unavailable =
            sectionCoverageStatus(s.id, coverage) === "unavailable";
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={section === s.id}
              aria-label={unavailable ? `${s.label} (unavailable)` : s.label}
              title={unavailable ? "Currently unavailable" : undefined}
              className={section === s.id ? styles.filterActive : styles.filter}
              onClick={() => selectSection(s.id)}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      <p className={styles.count} role="status">
        <span className="gh-num">{filtered.length}</span>{" "}
        {filtered.length === 1 ? "article" : "articles"} · {sectionLabel}
      </p>

      {availability === "unavailable" ? (
        <div className={styles.empty}>
          <h2>{sectionLabel} is unavailable right now.</h2>
          <p>{unavailableReason(section, coverage)}</p>
          <p>
            <button
              type="button"
              className={styles.filter}
              onClick={() => selectSection("latest")}
            >
              Show Latest
            </button>
          </p>
        </div>
      ) : !lead ? (
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
            <section
              className={styles.headlines}
              aria-labelledby="news-headlines"
            >
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
                    {a.summary && (
                      <p className={styles.rowSummary}>{a.summary}</p>
                    )}
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
