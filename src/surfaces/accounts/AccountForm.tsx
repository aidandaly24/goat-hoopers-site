"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./AccountForm.module.css";

type Mode = "signup" | "login" | "setup" | "forgot" | "team-recovery" | "reset" | "password" | "claim" | "link";
const titles: Record<Mode, string> = {
  signup: "Create your account", login: "Log in with email", setup: "Set up email login",
  forgot: "Reset your password", reset: "Choose a new password", password: "Change your password",
  "team-recovery": "Reset your password", claim: "Claim your team", link: "Link your existing team",
};
const descriptions: Record<Mode, string> = {
  signup: "Choose your own username and create an email account. You can play as yourself; claiming a league team is optional and separate.",
  login: "Log in with your email and password. Your login stays remembered for 90 days of activity.",
  setup: "Choose your own username, add an email and set a password. Your existing team stays linked to your account.",
  forgot: "Enter your verified account email. If it matches an account, we’ll send you a reset link.",
  reset: "Choose a new password. You’ll sign in again afterward on each device.",
  password: "Enter your current password and choose a new one. Other devices will need to sign in again.",
  "team-recovery": "Choose your team. If a verified email is linked to it, we’ll send a reset link there. You don’t need your old password or a team code.",
  claim: "Your account is ready. Use your team code to claim an unclaimed team. Once claimed, no one else can claim it.",
  link: "Confirm the link to the team you already own. Its identity, scores and history stay together. No team code is needed.",
};

/** Account access: create/recover an email account, then claim/link a team separately.
 * Pending/error/verification states stay in one narrow form; codes never serve as passwords.
 * Passwords go straight to same-origin endpoints, never React state or browser storage. */
export function AccountForm({ mode, token, notice, teams = [], initialTeamId = "" }: {
  mode: Mode; token?: string; notice?: string | null; teams?: { id: string; name: string }[]; initialTeamId?: string;
}) {
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
    if (mode === "signup") {
      path = "accounts/register";
      body = { email: value("email"), password: value("password"), username: value("username") };
    } else if (mode === "setup") {
      path = "accounts/enroll";
      body = { kind: "existing", email: value("email"), password: value("password"), displayName: value("username") };
    } else if (mode === "claim") {
      path = "accounts/claim"; body = { inviteCode: value("inviteCode") };
    } else if (mode === "link") {
      path = "accounts/link-existing"; body = {};
    } else if (mode === "team-recovery") {
      path = "accounts/reset-team-password"; body = { teamId: value("teamId") };
    } else if (mode === "login") {
      path = "auth/sign-in/email"; body = { email: value("email"), password: value("password"), rememberMe: true };
    } else if (mode === "forgot") {
      path = "auth/request-password-reset"; body = { email: value("email"), redirectTo: `${window.location.origin}/reset-password` };
    } else if (mode === "reset") {
      path = "auth/reset-password"; body = { token, newPassword: value("password") };
    } else {
      path = "auth/change-password"; body = { currentPassword: value("currentPassword"), newPassword: value("password"), revokeOtherSessions: true };
    }
    try {
      const response = await fetch(`/api/${path}`, { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) {
        setError(mode === "login" ? "Could not log in. Check your email, password and email verification." :
          mode === "setup" || mode === "link" ? "Could not link this account. Confirm your existing team password again before retrying. If you already have an email account, sign in with email first." :
          mode === "claim" ? "Could not claim this team. Check the code and your email verification. A claimed team cannot be claimed again." :
          mode === "password" ? "Could not change your password. Check your current password or sign in again." :
          mode === "reset" ? "This reset link could not be used. Request a new one." :
          "Could not complete this request. Check your details or try again later.");
      } else {
        form.reset();
        if (mode === "login" || mode === "claim" || mode === "link") { router.replace("/account"); router.refresh(); return; }
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
        mode === "team-recovery" ? "If your team has a verified recovery email, a reset link will arrive there. Check spam too. If you haven’t added an email yet, set up email login first." :
        mode === "forgot" ? "If this email matches a verified account, a reset link will arrive there. Check spam too." :
        "Check your email to verify your account, then log in with email. Check spam too."}
      {(mode === "signup" || mode === "setup") && <> <Link href="/account/login">Log in with email</Link></>}
    </p> : <form onSubmit={submit} className={styles.form} aria-busy={pending}>
      {(mode === "signup" || mode === "setup") && <>
        <label className={styles.field}><span>Username</span><input name="username" required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]{3,20}" autoComplete="nickname" autoCapitalize="none" className={styles.input} /><small>3–20 letters, numbers or underscores. Separate from your team name.</small></label>
      </>}
      {mode === "claim" && <label className={styles.field}><span>Team code</span><input name="inviteCode" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="off" className={styles.input} /></label>}
      {mode === "team-recovery" && <label className={styles.field}><span>Team</span>
        <select name="teamId" required defaultValue={initialTeamId} className={styles.input}>
          <option value="" disabled>Select your team…</option>
          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
        </select>
      </label>}
      {email && <label className={styles.field}><span>Email</span><input name="email" type="email" required maxLength={254} autoComplete={mode === "login" ? "username" : "email"} className={styles.input} /></label>}
      {mode === "password" && <label className={styles.field}><span>Current password</span><input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className={styles.input} /></label>}
      {!["forgot", "team-recovery", "claim", "link"].includes(mode) && <label className={styles.field}><span>{mode === "password" || mode === "reset" ? "New password" : "Password"}</span>
        <input name="password" type="password" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} className={styles.input} />
      </label>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <button type="submit" disabled={pending || (mode === "reset" && !token)} className={styles.submit}>
        {pending ? "Working…" : mode === "login" ? "Log in" : mode === "forgot" || mode === "team-recovery" ? "Send reset email" : mode === "signup" ? "Create account" : mode === "claim" ? "Claim team" : mode === "link" ? "Link my existing team" : "Continue"}
      </button>
    </form>}
    <p className={styles.switch}><Link href="/account/login">Log in with email</Link> · <Link href="/forgot-password?account=1">Reset password</Link>
      {mode === "team-recovery" && <> · <Link href="/login?legacy=1">Set up email login for my existing team</Link> · <Link href="/signup">Create account</Link></>}
      {(mode === "setup" || mode === "link") && <> · <Link href="/login?legacy=1">Confirm existing team password</Link></>}
      {mode === "password" && <> · <Link href="/login?notice=reverify">Confirm your login again</Link></>}
      {mode === "login" && <> · <Link href="/signup">Create account</Link> · <Link href="/login?legacy=1">Link your existing team</Link></>}
      {["claim", "link", "password"].includes(mode) && <> · <button type="button" disabled={pending} onClick={async () => {
        setPending(true);
        try {
          const response = await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin",
            headers: { "Content-Type": "application/json" }, body: "{}" });
          if (!response.ok) { setError("Could not sign out. Try again shortly."); return; }
          router.replace("/account/login"); router.refresh();
        } catch { setError("Could not sign out. Try again shortly."); }
        finally { setPending(false); }
      }}>Log out of email account</button></>}
    </p>
  </Card>;
}
