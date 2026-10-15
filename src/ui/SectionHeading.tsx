import styles from "./SectionHeading.module.css";

/** Consistent section title with gold eyebrow label. */
export function SectionHeading({
  eyebrow,
  title,
  action,
  level = 2,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
  /** Heading level; use 1 when this is the page's primary heading. */
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <Heading className={styles.title}>{title}</Heading>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
