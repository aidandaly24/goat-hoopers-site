"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login, loginForEnrollment, type ActionResult } from "@/app/actions";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "../claim/ClaimForm.module.css";

const initial: ActionResult = { ok: true };

/** Login form: pick your team, enter your password. */
export function LoginForm({
  teams,
  notice,
  enrollment = false,
  accountsAvailable = false,
  initialTeamId = "",
}: {
  teams: { id: string; name: string }[];
  notice?: string | null;
  enrollment?: boolean;
  accountsAvailable?: boolean;
  initialTeamId?: string;
}) {
  const [selectedTeam, setSelectedTeam] = useState(initialTeamId);
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      return (enrollment ? loginForEnrollment : login)(
        String(formData.get("teamId") ?? ""),
        String(formData.get("password") ?? ""),
      );
    },
    initial,
  );

  return (
    <Card className={styles.card}>
      <SectionHeading eyebrow="Account" title={enrollment ? "Confirm your existing team" : "Log in"} />
      {notice && <p className={styles.notice}>{notice}</p>}
      <p className={styles.lede}>
        {enrollment ? "Enter your old team password once to keep your team when you add email login. Next you’ll enter your email and new password. No team code is needed." : "Pick your team and enter your password. You stay logged in for 90 days — on any device."}
      </p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Team</span>
          <select name="teamId" required className={styles.input} value={selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)}>
            <option value="" disabled>
              Select your team…
            </option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>{enrollment ? "Old team password" : "Password"}</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
            className={styles.input}
          />
        </label>
        {!state.ok && <p className={styles.error}>{state.error}</p>}
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Working…" : enrollment ? "Continue to email setup" : "Log in"}
        </button>
      </form>
      {accountsAvailable && <p className={styles.switch}>
        <Link href={selectedTeam ? `/forgot-password?team=${encodeURIComponent(selectedTeam)}` : "/forgot-password"}>Reset password</Link> · <Link href="/signup">Create account</Link> · <Link href="/account/login">Log in with email</Link>
        {!enrollment && <> · <Link href="/login?legacy=1">Set up email login for my existing team</Link></>}
      </p>}
      {!enrollment && <p className={styles.switch}>
        Have a team code? <Link href="/claim">Claim your team</Link>
      </p>}
    </Card>
  );
}
