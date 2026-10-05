"use client";

import { useState } from "react";
import {
  ensureInviteCodes,
  getInviteOverview,
  regenerateInviteCode,
  type ActionResult,
} from "@/app/actions";
import type { InviteCode } from "@/domain/arcade";
import { Badge } from "@/ui/Badge";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "../../claim/ClaimForm.module.css";
import adminStyles from "./AdminInvites.module.css";

type Team = { id: string; name: string };

/**
 * Commissioner admin: invite codes, one per team.
 *
 * Gated by COMMISSIONER_KEY — the key is checked server-side on every
 * action and never leaves the server except in transit from this form.
 * Aidan generates codes here and distributes them privately (text/DM).
 */
export function AdminInvites({ teams }: { teams: Team[] }) {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh(k: string) {
    const res = await getInviteOverview(k);
    if (!res.ok) {
      setError(res.error);
      return false;
    }
    setCodes(res.codes);
    setError(null);
    return true;
  }

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await refresh(key);
    setUnlocked(ok);
    setBusy(false);
  }

  async function generate() {
    setBusy(true);
    const res: ActionResult = await ensureInviteCodes(key, teams);
    if (!res.ok) setError(res.error);
    else await refresh(key);
    setBusy(false);
  }

  async function regenerate(teamId: string) {
    setBusy(true);
    const res: ActionResult = await regenerateInviteCode(key, teamId);
    if (!res.ok) setError(res.error);
    else await refresh(key);
    setBusy(false);
  }

  const codeByTeam = new Map(codes.map((c) => [c.teamId, c]));

  if (!unlocked) {
    return (
      <Card className={styles.card}>
        <SectionHeading eyebrow="Admin" title="Commissioner only" />
        <p className={styles.lede}>
          Enter the commissioner key to manage invite codes.
        </p>
        <form onSubmit={unlock} className={styles.form}>
          <label className={styles.field}>
            <span>Commissioner key</span>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
              className={styles.input}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" disabled={busy} className={styles.submit}>
            {busy ? "Checking…" : "Unlock"}
          </button>
        </form>
      </Card>
    );
  }

  return (
    <div className={adminStyles.wrap}>
      <Card>
        <SectionHeading eyebrow="Admin" title="Invite codes" />
        <p className={styles.lede}>
          One single-use code per team. Send each code privately to its
          manager — anyone with the code can claim that team. Regenerating
          invalidates the old unused code.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className={`${styles.submit} ${adminStyles.generate}`}
        >
          {busy ? "Working…" : "Generate missing codes"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </Card>
      <Card>
        <div className={adminStyles.list}>
          {teams.map((team) => {
            const code = codeByTeam.get(team.id);
            return (
              <div key={team.id} className={adminStyles.row}>
                <div className={adminStyles.team}>
                  <span className={adminStyles.name}>{team.name}</span>
                  <span className={adminStyles.code}>
                    {code ? code.code : "—"}
                  </span>
                </div>
                <div className={adminStyles.status}>
                  {code ? (
                    <Badge tone={code.usedBy ? "win" : "gold"}>
                      {code.usedBy ? "Claimed" : "Unused"}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">No code</Badge>
                  )}
                  <button
                    onClick={() => regenerate(team.id)}
                    disabled={busy}
                    className={adminStyles.regen}
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
