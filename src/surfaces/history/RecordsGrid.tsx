import Link from "next/link";
import type { LeagueRecord } from "@/domain";
import styles from "./RecordsGrid.module.css";

/**
 * Engraved record plaques — the numbers nobody can take away.
 */
export function RecordsGrid({ records }: { records: LeagueRecord[] }) {
  return (
    <ul className={styles.plaques}>
      {records.map((r) => (
        <li key={r.id} className={styles.plaque}>
          <span className={styles.label}>{r.label}</span>
          <span className={styles.value}>{r.value}</span>
          {r.holder && (
            <Link
              href={`/teams/${r.holder.teamId}`}
              className={styles.holder}
            >
              {r.holder.teamName}
            </Link>
          )}
          <span className={styles.detail}>{r.detail}</span>
        </li>
      ))}
    </ul>
  );
}
