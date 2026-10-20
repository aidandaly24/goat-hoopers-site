import Link from "next/link";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./page.module.css";
import { loadCompetitionArchives } from "@/data/arcade-competition/service";
export const dynamic = "force-dynamic";
export default async function CompetitionHistoryPage() {
  const result = await loadCompetitionArchives();
  return <section className={styles.page}><Card><SectionHeading eyebrow="The Arcade" title="Mini-game weekly history" level={1} /><p><Link href="/arcade">Back to Arcade</Link></p>
    {result.status === "unavailable" ? <p>History could not be verified.</p> : result.status === "held" ? <p>Ranked history is held until competition storage is enabled.</p>
      : result.archives.length ? <ol>{result.archives.map(a => <li key={a.id}><Link href={`/arcade/history/${a.id}`}>{a.label}</Link> · finalized {new Date(a.finalizedAtMs).toISOString()}</li>)}</ol>
        : <p>No mini-game weeks have been finalized yet.</p>}</Card></section>;
}
