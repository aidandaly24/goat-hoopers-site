import type { DraftPick } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import { Badge } from "@/ui/Badge";
import styles from "./DraftBoard.module.css";

/** 2026 rookie draft results, in pick order grouped visually by round. */
export function DraftBoard({ picks }: { picks: DraftPick[] }) {
  if (picks.length === 0) {
    return (
      <Card>
        <SectionHeading eyebrow="Rookie draft" title="Draft Board" />
        <p className={styles.empty}>No draft results yet.</p>
      </Card>
    );
  }

  const rounds = new Map<number, DraftPick[]>();
  for (const p of picks) {
    const list = rounds.get(p.round) ?? [];
    list.push(p);
    rounds.set(p.round, list);
  }

  return (
    <Card>
      <SectionHeading
        eyebrow="Rookie draft"
        title="Draft Board"
        action={<Badge tone="gold">{picks.length} picks</Badge>}
      />
      {[...rounds.entries()].map(([round, roundPicks]) => (
        <div key={round} className={styles.round}>
          <div className={styles.roundLabel}>Round {round}</div>
          <ol className={styles.picks}>
            {roundPicks.map((p) => (
              <li key={p.pickNumber} className={styles.pick}>
                <span className={styles.pickNo}>{p.pickNumber}</span>
                <span className={styles.player}>
                  <span className={styles.playerName}>{p.player.fullName}</span>
                  <span className={styles.playerMeta}>
                    {[p.player.position, p.player.nbaTeam].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span className={styles.team}>{p.pickedBy.name}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </Card>
  );
}
