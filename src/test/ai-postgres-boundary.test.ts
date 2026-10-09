import { once } from "node:events";
import { Socket } from "node:net";
import { readFileSync } from "node:fs";
import { expect, it, vi } from "vitest";
import { createGuardedConnect } from "./network-guard";

it.each([
  {}, { RUN_AI_POSTGRES_TEST: "1" },
  { RUN_AI_POSTGRES_TEST: "1", CI: "true" },
  { RUN_AI_POSTGRES_TEST: "true", CI: "true", GITHUB_ACTIONS: "true" },
])("rejects AI database access without the complete explicit CI opt-in: %j", async env => {
  const original = vi.fn(function (this: Socket) { return this; });
  const socket = new Socket(), connect = createGuardedConnect(original, env);
  const connected = once(socket, "connect");
  Reflect.apply(connect, socket, [55447, "127.0.0.1"]);
  await expect(connected).rejects.toThrow(/Offline tests/);
  expect(original).not.toHaveBeenCalled(); socket.destroy();
});

it("permits only the synthetic loopback port, rejecting remote, repair, default and Unix targets", async () => {
  const original = vi.fn(function (this: Socket) { return this; });
  const connect = createGuardedConnect(original, { RUN_AI_POSTGRES_TEST: "1", CI: "true", GITHUB_ACTIONS: "true" });
  const allowed = new Socket();
  Reflect.apply(connect, allowed, [55447, "127.0.0.1"]);
  expect(original).toHaveBeenCalledWith(55447, "127.0.0.1"); allowed.destroy();
  for (const args of [[55447, "db.example.invalid"], [55447, "localhost"], [55438, "127.0.0.1"], [55441, "127.0.0.1"], [5432, "127.0.0.1"], ["/tmp/postgres.sock"]]) {
    const socket = new Socket(), connected = once(socket, "connect");
    Reflect.apply(connect, socket, args);
    await expect(connected).rejects.toThrow(/Offline tests/); socket.destroy();
  }
  expect(original).toHaveBeenCalledTimes(1);
});

it("keeps the PostgreSQL suite out of offline collection and production build commands", () => {
  const dedicated = readFileSync("vitest.ai-postgres.config.mts", "utf8");
  const base = readFileSync("vitest.config.mts", "utf8");
  expect(dedicated).toContain("postgres.integration.ts");
  expect(dedicated).toContain("./src/test/ai-postgres.ts");
  expect(base).toContain('include: ["src/**/*.test.ts"]');
  expect(JSON.parse(readFileSync("package.json", "utf8")).scripts.build).toBe("next build");
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  expect(workflow).toContain("image: postgres:16.15-alpine");
  expect(workflow).toContain("127.0.0.1:55447:5432");
  expect(workflow).not.toContain("secrets.");
});
