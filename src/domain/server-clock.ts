/** Page-local monotonic samples from the same request/response exchange. */
export type ClockExchange = { sequence: number; sentAtMonoMs: number; receivedAtMonoMs: number };
export type ServerClockAnchor = { asOfMs: number; exchange: ClockExchange; upperServerNowAtReceiptMs: number };
export type ServerClockReconciliation = { status: "accepted"; anchor: ServerClockAnchor } | { status: "ignored" | "uncertain" };
const monotonic = (value: number) => Number.isFinite(value) && value >= 0;

/** asOfMs must be sampled by the server between the supplied send/receipt. */
export function reconcileServerClock(asOfMs: number, exchange: ClockExchange, expectedSequence: number,
  previous: ServerClockAnchor | null = null): ServerClockReconciliation {
  if (exchange.sequence !== expectedSequence || previous && exchange.sequence <= previous.exchange.sequence) return { status: "ignored" };
  if (!Number.isSafeInteger(exchange.sequence) || exchange.sequence < 0 || !monotonic(exchange.sentAtMonoMs) ||
    !monotonic(exchange.receivedAtMonoMs) || exchange.sentAtMonoMs > exchange.receivedAtMonoMs ||
    !Number.isSafeInteger(asOfMs) || asOfMs < 0 || asOfMs > 253402214400000 ||
    previous && (asOfMs < previous.asOfMs || exchange.receivedAtMonoMs < previous.exchange.receivedAtMonoMs)) return { status: "uncertain" };
  const roundTripMs = exchange.receivedAtMonoMs - exchange.sentAtMonoMs;
  const previousUpper = previous ? previous.upperServerNowAtReceiptMs + exchange.receivedAtMonoMs - previous.exchange.receivedAtMonoMs : 0;
  const upperServerNowAtReceiptMs = Math.max(asOfMs + roundTripMs, previousUpper);
  if (!Number.isFinite(upperServerNowAtReceiptMs)) return { status: "uncertain" };
  return { status: "accepted", anchor: { asOfMs, exchange: { ...exchange }, upperServerNowAtReceiptMs } };
}

/** Null withholds certification; elapsed time never comes from the wall clock. */
export function projectServerRemaining(clock: ServerClockAnchor | null, deadlineMs: number | null,
  nowMonoMs: number, needsReconciliation = false): number | null {
  if (!clock || deadlineMs === null || !Number.isSafeInteger(deadlineMs) || deadlineMs < 0 ||
    needsReconciliation || !monotonic(nowMonoMs) || nowMonoMs < clock.exchange.receivedAtMonoMs) return null;
  return Math.max(0, deadlineMs - clock.upperServerNowAtReceiptMs - (nowMonoMs - clock.exchange.receivedAtMonoMs));
}

/** Wall time detects suspension/skew only; it never sets the countdown. */
export function clockSampleNeedsReconciliation(previous: { mono: number; wall: number }, next: { mono: number; wall: number }): boolean {
  const monoDelta = next.mono - previous.mono, wallDelta = next.wall - previous.wall;
  return ![previous.mono, previous.wall, next.mono, next.wall].every(Number.isFinite) || monoDelta < 0 ||
    monoDelta > 5000 || Math.abs(wallDelta - monoDelta) > 2000;
}

export function formatServerRemaining(remainingMs: number): string {
  if (!Number.isFinite(remainingMs)) return "—";
  const seconds = Math.ceil(Math.max(0, remainingMs) / 1000);
  const days = Math.floor(seconds / 86400), hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60, rest = seconds % 60;
  return `${days ? `${days}d ` : ""}${days || hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
