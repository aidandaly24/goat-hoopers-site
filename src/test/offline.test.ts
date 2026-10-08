import { Socket } from "node:net";
import { once } from "node:events";
import { get } from "node:https";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { getDb } from "@/data/db";

// The separate opt-in local database suite deliberately needs loopback I/O.
describe.skipIf(process.env.RUN_PRICE_HISTORY_LOCAL_TEST === "1")("offline test boundary", () => {
  it("rejects real HTTP before sending a request", async () => {
    await expect(fetch("https://example.invalid")).rejects.toThrow(/Offline tests cannot use the network/);
  });

  it("rejects sockets and a real Postgres client before connecting", async () => {
    const socket = new Socket();
    const connected = once(socket, "connect");
    socket.connect(5432, "127.0.0.1");
    await expect(connected).rejects.toThrow(/Offline tests cannot use the network/);
    const pool = new Pool({ host: "127.0.0.1", port: 5432, user: "synthetic", database: "synthetic" });
    try {
      await expect(pool.query("SELECT 1")).rejects.toThrow(/Offline tests cannot use the network/);
    } finally {
      await pool.end();
    }
  });

  it("also rejects Node HTTPS clients that do not use global fetch", async () => {
    const response = new Promise((_resolve, reject) => {
      get("https://example.invalid", () => reject(new Error("Unexpected response"))).on("error", reject);
    });
    await expect(response).rejects.toThrow(/Offline tests cannot use the network/);
  });

  it("fails closed without application database credentials", () => {
    expect(() => getDb()).toThrow(/DATABASE_URL is not set/);
  });
});
