import styles from "./Badge.module.css";

/** Small pill label — records, statuses, tags. */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "win" | "loss";
}) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
