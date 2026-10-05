import styles from "./SectionHeading.module.css";

/** Consistent section title with gold eyebrow label. */
export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.wrap}>
      <div>
        <div className={styles.eyebrow}>{eyebrow}</div>
        <h2 className={styles.title}>{title}</h2>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
