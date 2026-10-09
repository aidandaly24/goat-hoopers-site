"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./AccountForm.module.css";

type Mode = "signup" | "login" | "setup" | "forgot" | "reset" | "password";
const titles: Record<Mode, string> = {
  signup: "Claim your team", login: "Log in", setup: "Set up email login",
  forgot: "Reset your password", reset: "Choose a new password", password: "Change your password",
};
const descriptions: Record<Mode, string> = {
  signup: "Use your invitation and a recovery email. Verify your email, then log in from any device.",
  login: "Log in with your email and password. Your login stays remembered for 90 days of activity.",
  setup: "Add an email and choose a password for your existing team. Your account and game history stay together.",
  forgot: "Enter your verified account email. If it matches an account, we’ll send you a reset link.",
  reset: "Choose a new password. You’ll sign in again afterward on each device.",
  password: "Enter your current password and choose a new one. Other devices will need to sign in again.",
};

/** Passwords go straight to our same-origin provider endpoint; never stored in React state or browser storage. */
export function AccountForm({ mode, token, notice }: { mode: Mode; token?: string; notice?: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const email = ["signup", "login", "setup", "forgot"].includes(mode);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    setPending(true); setError(null);
    let path: string;
    let body: Record<string, unknown>;
    if (mode === "signup" || mode === "setup") {
      path = "/api/accounts/enroll";
      body = { kind: mode === "signup" ? "invite" : "existing", email: value("email"), password: value("password"),
        ...(mode === "signup" ? { displayName: value("displayName"), inviteCode: value("inviteCode") } : {}) };
    } else if (mode === "login") {
      path = "/api/auth/sign-in/email"; body = { email: value("email"), password: value("password"), rememberMe: true };
    } else if (mode === "forgot") {
      path = "/api/auth/request-password-reset"; body = { email: value("email"), redirectTo: `${window.location.origin}/reset-password` };
    } else if (mode === "reset") {
      path = "/api/auth/reset-password"; body = { token, newPassword: value("password") };
    } else {
      path = "/api/auth/change-password"; body = { currentPassword: value("currentPassword"), newPassword: value("password"), revokeOtherSessions: true };
    }
    try {
      const response = await fetch(path, { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        setError(mode === "login" ? "Could not log in. Check your email, password and email verification." :
          mode === "password" ? "Could not change your password. Check your current password or sign in again." :
          mode === "reset" ? "This reset link could not be used. Request a new one." :
          "Could not complete this request. Check your details or try again later.");
      } else {
        form.reset();
        if (mode === "login") { router.replace("/team"); router.refresh(); return; }
        setDone(true);
      }
    } catch { setError("Account service is unavailable. Try again shortly."); }
    finally { setPending(false); }
  }

  return <Card className={styles.card}>
    <SectionHeading eyebrow="Account" title={titles[mode]} />
    {notice && <p className={styles.notice}>{notice}</p>}
    <p className={styles.lede}>{descriptions[mode]}</p>
    {done ? <p role="status" className={styles.notice}>
      {mode === "password" ? "Your password changed." : mode === "reset" ? "Your password changed. Log in with your new password." :
        "Check your email for the next step. Check spam too; you can request another email from the login page."}
    </p> : <form onSubmit={submit} className={styles.form} aria-busy={pending}>
      {mode === "signup" && <>
        <label className={styles.field}><span>Invite code</span><input name="inviteCode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" className={styles.input} /></label>
        <label className={styles.field}><span>Display name</span><input name="displayName" required maxLength={40} autoComplete="nickname" className={styles.input} /></label>
      </>}
      {email && <label className={styles.field}><span>Email</span><input name="email" type="email" required maxLength={254} autoComplete={mode === "login" ? "username" : "email"} className={styles.input} /></label>}
      {mode === "password" && <label className={styles.field}><span>Current password</span><input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className={styles.input} /></label>}
      {mode !== "forgot" && <label className={styles.field}><span>{mode === "password" || mode === "reset" ? "New password" : "Password"}</span>
        <input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className={styles.input} />
      </label>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" disabled={pending || (mode === "reset" && !token)} className={styles.submit}>
        {pending ? "Working…" : mode === "login" ? "Log in" : mode === "forgot" ? "Send reset link" : mode === "signup" ? "Claim team" : "Continue"}
      </button>
    </form>}
    <p className={styles.switch}><Link href="/login">Log in</Link> · <Link href="/forgot-password">Password recovery</Link>
      {mode === "password" && <> · <Link href="/login?notice=reverify">Confirm your login again</Link></>}
      {mode === "login" && <> · <Link href="/claim">Have an invitation?</Link> · <Link href="/login?legacy=1">Set up your existing team</Link></>}
    </p>
  </Card>;
}
