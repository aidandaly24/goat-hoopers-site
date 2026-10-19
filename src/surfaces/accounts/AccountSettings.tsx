import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import controls from "@/ui/controls.module.css";
import styles from "./AccountSettings.module.css";

/** Account settings answers “what is linked, and where can I manage it?”
 * My Team is the linked account's primary destination; password changes
 * stay on their existing protected route. Unclaimed accounts keep the
 * supplied claim form and its sole h1. Narrow rows stack without hiding
 * actions. No account lookup, mutation or page-local theme lives here. */
export function AccountSettings({ accountName, linked, claimForm }: {
  accountName: string;
  linked: boolean;
  claimForm?: ReactNode;
}) {
  if (claimForm) return <div className={styles.claimPage} data-account-settings="claim">
    <div className={styles.claimForm}>{claimForm}</div>
    <nav className={styles.claimActions} aria-label="Account navigation">
      <Link href="/" className={controls.quiet}>Back to home</Link>
      <Link href="/account/password" className={controls.secondary}>Change account password</Link>
    </nav>
  </div>;

  return <div className={styles.page} data-account-settings={linked ? "linked" : "enrollment"}>
    <header className={styles.heading}>
      <SectionHeading level={1} eyebrow="Account" title={linked ? "Account settings" : "Your email account is ready"} />
      <div className={styles.identity}>
        <p>Signed in as <strong>{accountName}</strong></p>
        <Link href="/" className={controls.quiet}>Back to home</Link>
      </div>
    </header>
    <Card className={styles.panel}>
      <section className={styles.row} aria-labelledby="account-team-heading">
        <div className={styles.description}>
          <h2 id="account-team-heading">{linked ? "Your team" : "League connection"}</h2>
          <p>{linked ? "Your email account is linked to your existing team. Your team identity and history stay together." : "You can sign in and reset your account password. New team claims will open when email login is active for the league."}</p>
        </div>
        {linked && <Link href="/team" className={controls.secondary}>My Team</Link>}
      </section>
      <section className={styles.row} aria-labelledby="account-password-heading">
        <div className={styles.description}>
          <h2 id="account-password-heading">Password</h2>
          <p>Change your account password. Other devices will need to sign in again.</p>
        </div>
        <Link href="/account/password" className={controls.secondary}>Change account password</Link>
      </section>
    </Card>
  </div>;
}
