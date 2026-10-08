"use client";

import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import type { NewsArticle, NewsSection } from "@/domain/news";
import { NEWS_SECTIONS, PUBLICATIONS } from "@/domain/news";
import { KIND_LABEL, readingStories, storyDate } from "./stories";
import { resolveStory, storyHref, storyRevision } from "./storyLinks";
import { StoryText } from "./StoryText";
import styles from "./NewsFeed.module.css";

const NAV_EVENT = "newsroom-navigation";
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAV_EVENT, callback);
  return () => { window.removeEventListener("popstate", callback); window.removeEventListener(NAV_EVENT, callback); };
}
function snapshot() { return window.location.search; }
function serverSnapshot() { return ""; }
function navigate(section: NewsSection, story: NewsArticle | null, replace = false, readerVisit?: string) {
  const url = new URL(window.location.href);
  if (section === "latest") url.searchParams.delete("section"); else url.searchParams.set("section", section);
  if (story) {
    url.searchParams.set("story", story.id);
    url.searchParams.set("revision", storyRevision(story));
  } else {
    url.searchParams.delete("story");
    url.searchParams.delete("revision");
  }
  const state = readerVisit ? { ...window.history.state, newsroomReader: readerVisit } : window.history.state;
  window.history[replace ? "replaceState" : "pushState"](state, "", url);
  window.dispatchEvent(new Event(NAV_EVENT));
}

/** Receives the existing article contract. Filtering/reading never fetches. */
export function NewsFeed({ articles }: { articles: NewsArticle[] }) {
  const search = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const params = new URLSearchParams(search);
  const candidate = params.get("section");
  const section: NewsSection = NEWS_SECTIONS.find(s => s.id === candidate)?.id ?? "latest";
  const storyId = params.get("story");
  const stories = readingStories(articles, section);
  const selected = resolveStory(articles, storyId, params.get("revision"));
  const selectedStory = selected ? readingStories(articles, "latest").find(s => s.reactions.includes(selected)) : undefined;
  const lead = stories[0];
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedHeading = useRef<HTMLParagraphElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const readerVisit = useRef<string | null>(null);
  const wasOpen = useRef(false);
  const closing = useRef(false);

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    closing.current = false;
    if (storyId) {
      if (!node.open) {
        node.showModal();
        heading.current?.focus();
        node.scrollTop = 0;
        wasOpen.current = true;
      } else if (!selected) heading.current?.focus();
    } else if (node.open) {
      node.close();
      if (wasOpen.current) {
        const target = opener.current?.isConnected ? opener.current : feedHeading.current;
        target?.focus();
        wasOpen.current = false;
      }
    }
  }, [storyId, selected]);

  useEffect(() => {
    if (!storyId) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [storyId]);

  function open(event: MouseEvent<HTMLAnchorElement>, article: NewsArticle) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener.current = event.currentTarget;
    readerVisit.current ??= window.crypto.randomUUID();
    navigate(section, article, false, readerVisit.current);
  }
  function close() {
    if (closing.current) return;
    closing.current = true;
    if (readerVisit.current && window.history.state?.newsroomReader === readerVisit.current) window.history.back();
    else navigate(section, null, true);
  }

  return <div>
    <div className={styles.filters} role="group" aria-label="News sections">
      {NEWS_SECTIONS.map(s => <button key={s.id} type="button" aria-pressed={section === s.id}
        className={section === s.id ? styles.filterActive : styles.filter}
        onClick={() => { if (section !== s.id) navigate(s.id, null); }}>{s.label}</button>)}
    </div>
    <p ref={feedHeading} tabIndex={-1} className={styles.count} role="status">
      <span className="gh-num">{stories.length}</span> {stories.length === 1 ? "story" : "stories"} · {NEWS_SECTIONS.find(s => s.id === section)?.label}
    </p>
    {!lead ? <div className={styles.empty}>
      <h2>{articles.length ? "No reactions in this section yet." : "The newsroom is quiet."}</h2>
      <p>{articles.length ? "Try Latest for the rest of the league’s coverage." : "No generated stories are available in this feed yet. Check the league’s moves or draft board."}</p>
      {articles.length ? <button className={styles.action} onClick={() => { navigate("latest", null); feedHeading.current?.focus(); }}>Show Latest</button> : <p className={styles.destinations}><Link href="/transactions">League moves</Link><Link href="/draft">Draft board</Link></p>}
    </div> : <div className={styles.layout}>
      <article className={styles.lead}>
        <p className={styles.kicker}>Lead story <span> / {KIND_LABEL[lead.primary.kind]}</span></p>
        <h2 className={styles.leadTitle}><a href={storyHref(section, lead.primary)} onClick={e => open(e, lead.primary)}>{lead.primary.headline}</a></h2>
        <p className={styles.excerpt}><StoryText text={lead.primary.body[0] ?? "Full reaction available in the reader."} article={lead.primary} /></p>
        <div className={styles.byline}><span>{PUBLICATIONS[lead.primary.publication].name} voice</span><time className="gh-num" dateTime={new Date(lead.primary.publishedAt).toISOString()} title="Generated story time, not the event date">{storyDate(lead.primary.publishedAt)}</time></div>
        <a className={styles.read} href={storyHref(section, lead.primary)} onClick={e => open(e, lead.primary)}>Read story <span aria-hidden="true">↗</span></a>
        <p className={styles.voiceCount}><span className="gh-num">{lead.reactions.length}</span> {lead.reactions.length === 1 ? "voice" : "voices"} · generated reactions</p>
      </article>
      {stories.length > 1 && <section className={styles.headlines} aria-labelledby="news-headlines">
        <h2 id="news-headlines" className={styles.listTitle}>More from the league</h2>
        <ol className={styles.list}>{stories.slice(1).map(story => <li key={story.primary.id} className={styles.row}>
          <p className={styles.rowMeta}>{KIND_LABEL[story.primary.kind]} <span>· <span className="gh-num">{story.reactions.length}</span> {story.reactions.length === 1 ? "voice" : "voices"}</span></p>
          <h3><a href={storyHref(section, story.primary)} onClick={e => open(e, story.primary)}>{story.primary.headline}<span className={styles.arrow} aria-hidden="true"> ↗</span></a></h3>
          <p className={styles.rowDate}><span>{PUBLICATIONS[story.primary.publication].name} voice</span><time className="gh-num" dateTime={new Date(story.primary.publishedAt).toISOString()} title="Generated story time, not the event date">{storyDate(story.primary.publishedAt)}</time></p>
        </li>)}</ol>
      </section>}
    </div>}
    <dialog ref={dialog} className={styles.reader} aria-labelledby="news-reader-title" aria-describedby="news-reader-disclosure"
      onCancel={e => { e.preventDefault(); close(); }}>
      <div className={styles.readerBar}><span>League reading room</span><button type="button" onClick={close} aria-label="Close story">Close <span aria-hidden="true">×</span></button></div>
      <div className={styles.readerContent}>
        <p id="news-reader-disclosure" className={styles.notice}>Generated league reactions · parody. These stories are unaffiliated with the named outlets; sources, opinions and predictions are fictionalized.</p>
        {selected ? <>
          <p className={styles.kicker}>{KIND_LABEL[selected.kind]} · {PUBLICATIONS[selected.publication].name} voice</p>
          <h2 ref={heading} id="news-reader-title" tabIndex={-1} className={styles.readerTitle}>{selected.headline}</h2>
          <p className={styles.rowDate}>Generated story time <time className="gh-num" dateTime={new Date(selected.publishedAt).toISOString()}>{storyDate(selected.publishedAt)} · UTC</time></p>
          {selectedStory && selectedStory.reactions.length > 1 && <div className={styles.voices} role="group" aria-label="Reaction voices">
            {selectedStory.reactions.map(a => <button type="button" key={a.id} aria-pressed={a.id === storyId}
              onClick={() => navigate(section, a, true)}>{PUBLICATIONS[a.publication].name} voice</button>)}
          </div>}
          <p className={styles.srOnly} role="status">Reading {PUBLICATIONS[selected.publication].name} voice.</p>
          <div className={styles.body}>{selected.body.map((text, i) => <p key={i}><StoryText text={text} article={selected} /></p>)}</div>
          {(selected.players.length > 0 || selected.teams.length > 0) && <nav className={styles.actors} aria-label="People and teams in this story">
            <p>In this story</p>
            {selected.players.map(p => <Link key={`p-${p.playerId}`} href={`/player/${p.playerId}`}>{p.name}</Link>)}
            {selected.teams.map(t => <Link key={`t-${t.teamId}`} href={`/teams/${t.teamId}`}>{t.name}</Link>)}
          </nav>}
        </> : <><h2 ref={heading} id="news-reader-title" tabIndex={-1} className={styles.readerTitle}>Story unavailable</h2><p>This story is no longer in the current feed. Its link has not been replaced with a different reaction.</p><button className={styles.action} onClick={close}>Return to headlines</button></>}
      </div>
    </dialog>
  </div>;
}
