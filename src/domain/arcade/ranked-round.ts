import type { PracticeAim } from "./free-throw";
import type { ShotInput } from "./competition";
import { simulateRankedShot, type RankedAdmission } from "./ranked-free-throw";

/** Browser input recorder only. The server independently verifies every submitted input. */
export class RankedRoundRecorder {
  private readonly shots: ShotInput[] = [];
  private nextAtMs = 0;
  private finishedAtMs = 0;
  private settled = true;
  private lastNow: number;
  private readonly deadline: number;
  constructor(readonly admission: RankedAdmission, requestSentAt: number, private readonly receivedAt: number) {
    this.lastNow = receivedAt;
    this.deadline = requestSentAt + admission.run.expiresAtMs - admission.run.startedAtMs;
    if (![requestSentAt, receivedAt].every(Number.isFinite) || requestSentAt > receivedAt) throw new Error("invalid_round_clock");
  }
  status(now: number) {
    const valid = Number.isFinite(now) && now >= this.lastNow;
    if (valid) this.lastNow = now;
    const elapsed = now - this.receivedAt, complete = this.shots.length === this.admission.rules.shots;
    const expired = !valid || now >= this.deadline;
    return { attempts: this.shots.length, expired, remainingMs: Math.max(0, this.deadline - now),
      canShoot: !expired && !complete && this.settled && elapsed >= this.nextAtMs,
      canSubmit: !expired && complete && this.settled && elapsed >= this.finishedAtMs };
  }
  shoot(aim: PracticeAim, now: number): boolean {
    if (!this.status(now).canShoot || !Number.isFinite(aim.direction) || Math.abs(aim.direction) > 14 ||
      !Number.isFinite(aim.power) || aim.power < 0 || aim.power > 100) return false;
    const atMs = Math.floor(now - this.receivedAt), flight = simulateRankedShot(aim, this.admission.replayContext, this.shots.length);
    if (this.receivedAt + atMs + flight.durationMs >= this.deadline) return false;
    this.shots.push({ atMs, direction: aim.direction, power: aim.power });
    this.finishedAtMs = atMs + flight.durationMs;
    this.nextAtMs = atMs + Math.max(flight.durationMs, this.admission.rules.minShotIntervalMs);
    this.settled = false;
    return true;
  }
  settle() { this.settled = true; }
  submission(now: number): { runId: string; shots: ShotInput[] } | null {
    return this.status(now).canSubmit ? { runId: this.admission.run.id, shots: this.shots.map(shot => ({ ...shot })) } : null;
  }
}
