import { createConnection, Socket } from "node:net";
import { once } from "node:events";
import { Pool } from "pg";
import { describe, expect, it, vi } from "vitest";
import { createGuardedConnect } from "./network-guard";

const price = { RUN_PRICE_HISTORY_LOCAL_TEST: "1" };
const claim = { RUN_CLAIM_TEAM_LOCAL_TEST: "1" };
const modes: { env: Record<string, string | undefined>; allowed: number[] }[] = [
  { env: {}, allowed: [] },
  { env: price, allowed: [55438] },
  { env: claim, allowed: [55441] },
  { env: { ...price, ...claim }, allowed: [55438, 55441] },
  { env: { RUN_PRICE_HISTORY_LOCAL_TEST: "true", RUN_CLAIM_TEAM_LOCAL_TEST: "true" }, allowed: [] },
];
const deniedTargets: unknown[][] = [
  [55438, "db.example.invalid"], [55441, "db.example.invalid"],
  [55438, "127.0.0.2"], [55441, "localhost"],
  [5432, "127.0.0.1"], [55438], ["/tmp/synthetic-postgres.sock"],
  [{ host: "127.0.0.1", port: 55438, path: "/tmp/synthetic-postgres.sock" }],
  [{ port: 55441 }], [{ host: "db.example.invalid", port: 55441 }],
];

describe("local integration network boundary", () => {
  it.each(modes)("only enables the matching fixed endpoint: $env", async ({ env, allowed }) => {
    const original = vi.fn(function (this: Socket) { return this; });
    const connect = createGuardedConnect(original, env);
    for (const port of [55438, 55441]) {
      const socket = new Socket();
      if (allowed.includes(port)) {
        Reflect.apply(connect, socket, [port, "127.0.0.1"]);
        expect(original).toHaveBeenLastCalledWith(port, "127.0.0.1");
      } else {
        const connected = once(socket, "connect");
        const calls = original.mock.calls.length;
        Reflect.apply(connect, socket, [port, "127.0.0.1"]);
        await expect(connected).rejects.toThrow(/Offline tests cannot use the network/);
        expect(original.mock.calls).toHaveLength(calls);
      }
      socket.destroy();
    }
  });

  it.each([price, claim, { ...price, ...claim }])("rejects remote/ambiguous/other targets with opt-ins: %j", async env => {
    const original = vi.fn(function (this: Socket) { return this; });
    const connect = createGuardedConnect(original, env);
    for (const args of deniedTargets) {
      const socket = new Socket();
      const connected = once(socket, "connect");
      Reflect.apply(connect, socket, args);
      await expect(connected).rejects.toThrow(/Offline tests cannot use the network/);
    }
    expect(original).not.toHaveBeenCalled();
  });

  it("forwards a validated endpoint instead of caller DNS/options, preserving the listener", () => {
    const original = vi.fn(function (this: Socket) { return this; });
    const lookup = vi.fn();
    const listener = vi.fn();
    let reads = 0;
    const connect = createGuardedConnect(original, claim);
    const socket = new Socket();
    Reflect.apply(connect, socket, [{
      get host() { return reads++ === 0 ? "127.0.0.1" : "db.example.invalid"; },
      port: "55441", lookup,
    }, listener]);
    expect(original).toHaveBeenCalledWith(55441, "127.0.0.1", listener);
    expect(lookup).not.toHaveBeenCalled();
    socket.destroy();
  });

  it.each([{ env: price, port: 55438 }, { env: claim, port: 55441 }])(
    "permits the real pg and public net call shapes for port $port without contacting a database",
    async ({ env, port }) => {
      const saved = Socket.prototype.connect;
      const transport = vi.fn(function (this: Socket) {
        queueMicrotask(() => this.destroy(new Error("Synthetic transport reached")));
        return this;
      });
      Socket.prototype.connect = createGuardedConnect(transport, env);
      const pool = new Pool({ host: "127.0.0.1", port, user: "synthetic", database: "synthetic" });
      try {
        await expect(pool.query("SELECT 1")).rejects.toThrow("Synthetic transport reached");
        expect(transport).toHaveBeenCalledWith(port, "127.0.0.1");
        const socket = createConnection({ host: "127.0.0.1", port });
        await expect(once(socket, "connect")).rejects.toThrow("Synthetic transport reached");
        expect(transport).toHaveBeenCalledTimes(2);
      } finally {
        await pool.end();
        Socket.prototype.connect = saved;
      }
    },
  );
});
