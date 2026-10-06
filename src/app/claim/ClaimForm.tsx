"use client";

import { useActionState } from "react";
import Link from "next/link";
import { claimAccount, type ActionResult } from "@/app/actions";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./ClaimForm.module.css";

const initial: ActionResult = { ok: true };

/**
 * Claim form: invite code + display name + password. One step —
 * the server validates the code, creates the account, consumes the
 * code, and starts the session.
 */
export function ClaimForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
      return claimAccount(
        String(formData.get("code") ?? ""),
        String(formData.get("password") ?? ""),
        String(formData.get("displayName") ?? ""),
      );
    },
    initial,
  );

  return (
    <Card className={styles.card}>
      <SectionHeading eyebrow="Account" title="Claim your team" />
      <p className={styles.lede}>
        Enter the invite code Aidan sent you, pick a display name, and set a
        password. The code works from any device — claim here, play
        anywhere.
      </p>
      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Invite code</span>
          <input
            name="code"
            required
            autoComplete="off"
            placeholder="6-digit code"
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span>Display name</span>
          <input
            name="displayName"
            required
            maxLength={40}
            autoComplete="nickname"
            placeholder="e.g. NeuralNets"
            className={styles.input}
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            className={styles.input}
          />
        </label>
        {!state.ok && <p className={styles.error}>{state.error}</p>}
        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Claiming…" : "Claim team"}
        </button>
      </form>
      <p className={styles.switch}>
        Already claimed? <Link href="/login">Log in</Link>
      </p>
    </Card>
  );
}
