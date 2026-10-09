"use client";

import { useActionState } from "react";
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
}: {
  teams: { id: string; name: string }[];
  notice?: string | null;
  enrollment?: boolean;
}) {
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
      <SectionHeading eyebrow="Account" title="Log in" />
      {notice && <p className={styles.notice}>{notice}</p>}
      <p className={styles.lede}>
        {enrollment ? "Sign in with your existing team password to keep your account when you add email login." : "Pick your team and enter your password. You stay logged in for 90 days — on any device."}
      </p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Team</span>
          <select name="teamId" required className={styles.input} defaultValue="">
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
          <span>Password</span>
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
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className={styles.switch}>
        Have an invite code? <Link href="/claim">Claim your team</Link>
      </p>
    </Card>
  );
}
