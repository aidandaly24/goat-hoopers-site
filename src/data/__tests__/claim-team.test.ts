/** Atomic claim contract and production-adapter error regressions. */
import { describe, expect, it, vi } from "vitest";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DrizzleGameStore, FakeGameStore } from "../arcade";
import { schema } from "../db";
import { claimTeamContract } from "./claim-team-contract";

claimTeamContract("FakeGameStore", () => new FakeGameStore());

const input = { code: "111111", displayName: "Fixture", passwordHash: "fixture-hash" };

describe("claim conflict errors through the installed Neon HTTP adapter", () => {
  it("returns team_claimed when Drizzle wraps the team constraint failure", async () => {
    const error = Object.assign(new Error("Synthetic team conflict"), {
      code: "23505", constraint: "site_users_team_id_unique",
    });
    const client = neon("postgresql://postgres@localhost/unused");
    const query = vi.spyOn(client, "query").mockRejectedValue(error);
    const store = new DrizzleGameStore(drizzle(client, { schema }));
    await expect(store.claimTeam(input)).resolves.toEqual({ ok: false, reason: "team_claimed" });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("also handles an unwrapped team constraint failure", async () => {
    const error = Object.assign(new Error("Synthetic team conflict"), {
      code: "23505", constraint: "site_users_team_id_unique",
    });
    const db = drizzle(neon("postgresql://postgres@localhost/unused"), { schema });
    vi.spyOn(db, "execute").mockImplementation(() => { throw error; });
    await expect(new DrizzleGameStore(db).claimTeam(input)).resolves.toEqual({ ok: false, reason: "team_claimed" });
  });

  it.each([
    { code: "08006", constraint: undefined },
    { code: "23505", constraint: "site_users_pkey" },
    { code: "23505", constraint: undefined },
  ])("propagates operational and unrelated constraint failures: $code / $constraint", async details => {
    const error = Object.assign(new Error("Synthetic non-team failure"), details);
    const client = neon("postgresql://postgres@localhost/unused");
    vi.spyOn(client, "query").mockRejectedValue(error);
    const store = new DrizzleGameStore(drizzle(client, { schema }));
    await expect(store.claimTeam(input)).rejects.toMatchObject({ cause: error });
  });
});
