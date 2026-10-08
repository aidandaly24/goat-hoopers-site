import Link from "next/link";
import type { NewsArticle } from "@/domain/news";
import styles from "./NewsFeed.module.css";

/** Preserve exact actor destinations in prose; never nest them in an opener. */
export function StoryText({ text, article }: { text: string; article: NewsArticle }) {
  const targets = [
    ...article.players.map(p => ({ name: p.name, href: `/player/${p.playerId}` })),
    ...article.teams.map(t => ({ name: t.name, href: `/teams/${t.teamId}` })),
  ].filter(t => t.name.length > 0).sort((a, b) => b.name.length - a.name.length);
  if (!targets.length) return text;
  const escaped = targets.map(t => t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return text.split(new RegExp(`(${escaped.join("|")})`, "g")).map((part, i) => {
    const target = targets.find(t => t.name === part);
    return target ? <Link key={i} href={target.href} className={styles.actor}>{part}</Link> : part;
  });
}
