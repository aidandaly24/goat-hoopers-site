import { afterEach, expect, it, vi } from "vitest";
import { authorizeReconcile, emptyReconcileBody } from "./reconcile-auth";
const TOKEN = "a".repeat(64), NOW = Date.parse("2026-10-20T19:00:00Z");
const env = () => ({ GOAT_ARCADE_RECONCILE_ENABLED: "1", GOAT_ARCADE_RECONCILE_TOKEN: TOKEN,
  GOAT_ARCADE_RECONCILE_NOT_BEFORE: "2026-10-20T18:50:00Z", GOAT_ARCADE_RECONCILE_EXPIRES_AT: "2026-10-27T04:00:00Z" });
const headers = (value = `Bearer ${TOKEN}`) => new Headers({ authorization: value });
const streamRequest = (stream: ReadableStream<Uint8Array>) => new Request("https://test.invalid/api/arcade/competition/reconcile", { method: "POST", body: stream, duplex: "half" } as RequestInit);
afterEach(() => vi.useRealTimers());
it("default-off does not inspect any credential or window setting", () => {
  const settings = new Proxy({ GOAT_ARCADE_RECONCILE_ENABLED: "0" }, { get(target, name) { if (name !== "GOAT_ARCADE_RECONCILE_ENABLED") throw Error("unexpected settings access"); return target[name]; } });
  expect(authorizeReconcile(headers(), settings, NOW)).toEqual({ status: "disabled" });
});
it("requires the dedicated token and returns no credential material", () => {
  const allowed = authorizeReconcile(headers(), env(), NOW);
  expect(allowed.status).toBe("allowed"); expect(JSON.stringify(allowed)).not.toContain(TOKEN);
  for (const header of ["", `Bearer ${"b".repeat(64)}`, `Bearer ${"a".repeat(63)}`, `Bearer ${"a".repeat(65)}`, `bearer ${TOKEN}`, `Bearer  ${TOKEN}`, `Bearer ${TOKEN},Bearer ${TOKEN}`])
    expect(authorizeReconcile(headers(header), env(), NOW)).toEqual({ status: "unauthorized" });
  expect(authorizeReconcile(new Headers(), env(), NOW)).toEqual({ status: "unauthorized" });
});
it.each([undefined, "", "short", "A".repeat(64), "g".repeat(64), `${TOKEN}\n`, "a".repeat(65)])("fails closed for invalid token configuration", token => {
  expect(authorizeReconcile(headers(), { ...env(), GOAT_ARCADE_RECONCILE_TOKEN: token }, NOW)).toEqual({ status: "held" });
});
it("fails closed for missing/malformed bounds and future/expired windows", () => {
  for (const key of ["GOAT_ARCADE_RECONCILE_NOT_BEFORE", "GOAT_ARCADE_RECONCILE_EXPIRES_AT"] as const) {
    expect(authorizeReconcile(headers(), { ...env(), [key]: "" }, NOW).status).toBe("held");
    expect(authorizeReconcile(headers(), { ...env(), [key]: "not-a-time" }, NOW).status).toBe("held");
  }
  expect(authorizeReconcile(headers(), env(), Date.parse(env().GOAT_ARCADE_RECONCILE_NOT_BEFORE) - 1).status).toBe("unauthorized");
  expect(authorizeReconcile(headers(), env(), Date.parse(env().GOAT_ARCADE_RECONCILE_EXPIRES_AT)).status).toBe("unauthorized");
});
it("never reads commissioner or cron fallback settings", () => {
  const settings = new Proxy(env(), { get(target, name) { if (name === "COMMISSIONER_KEY" || name === "CRON_SECRET") throw Error("legacy credential read"); return target[name as keyof typeof target]; } });
  expect(authorizeReconcile(headers(), settings, NOW).status).toBe("allowed");
  expect(authorizeReconcile(headers(), { ...env(), GOAT_ARCADE_RECONCILE_TOKEN: undefined, COMMISSIONER_KEY: TOKEN, CRON_SECRET: TOKEN }, NOW).status).toBe("held");
});
it("accepts only an exhausted empty body, including an empty chunk before EOF", async () => {
  expect(await emptyReconcileBody(new Request("https://test.invalid", { method: "POST" }))).toBe(true);
  expect(await emptyReconcileBody(streamRequest(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(0)); c.close(); } })))).toBe(true);
  const cancel = vi.fn();
  expect(await emptyReconcileBody(streamRequest(new ReadableStream({ start(c) { c.enqueue(new Uint8Array(0)); c.enqueue(new Uint8Array([1])); }, cancel })))).toBe(false);
  expect(cancel).toHaveBeenCalled();
});
it("bounds stalled/empty-chunk streams and does not wait on hostile cancellation", async () => {
  vi.useFakeTimers();
  const pending = emptyReconcileBody(streamRequest(new ReadableStream({ cancel: () => new Promise(() => {}) })));
  await vi.advanceTimersByTimeAsync(1000); expect(await pending).toBe(false);
  expect(await emptyReconcileBody(streamRequest(new ReadableStream({ pull(c) { c.enqueue(new Uint8Array(0)); } })))).toBe(false);
});
it("rejects consumed, locked and errored bodies", async () => {
  const consumed = new Request("https://test.invalid", { method: "POST", body: "" }); await consumed.text();
  expect(await emptyReconcileBody(consumed)).toBe(false);
  const locked = streamRequest(new ReadableStream({ start(c) { c.close(); } })), reader = locked.body!.getReader();
  expect(await emptyReconcileBody(locked)).toBe(false); await reader.cancel(); reader.releaseLock();
  expect(await emptyReconcileBody(streamRequest(new ReadableStream({ start(c) { c.error(new Error("synthetic read error")); } })))).toBe(false);
});
