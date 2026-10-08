import { clamp } from "./physics";

/** A held key/touch produces one release. Repeat starts cannot restart it;
 * cancel removes the release on blur, hidden tabs and resets.
 */
export function createCharge() {
  let started: number | null = null;
  return {
    begin(now: number): boolean {
      if (started !== null) return false;
      started = now;
      return true;
    },
    active: () => started !== null,
    power(now: number): number {
      return started === null ? 0 : Math.round(clamp((now - started) / 1600 * 100, 0, 100));
    },
    release(now: number): number | null {
      if (started === null) return null;
      const power = this.power(now);
      started = null;
      return power;
    },
    cancel() { started = null; },
  };
}
