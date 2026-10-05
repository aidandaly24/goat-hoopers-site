import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./ProvisionNotice.module.css";

/**
 * Shown by arcade pages when Vercel Postgres isn't provisioned yet.
 * The site builds and deploys fine without the database — the arcade
 * just waits for it. This keeps the preview honest instead of crashing.
 */
export function ProvisionNotice() {
  return (
    <div className={styles.wrap}>
      <Card className={styles.card}>
        <SectionHeading eyebrow="The Arcade" title="Almost open" />
        <p className={styles.body}>
          The arcade's database hasn't been provisioned yet. Aidan: create
          the Vercel Postgres database, connect it to this project, and run{" "}
          <code className={styles.code}>npx drizzle-kit push</code> — the
          full steps are in <code className={styles.code}>src/data/db.ts</code>.
        </p>
      </Card>
    </div>
  );
}
