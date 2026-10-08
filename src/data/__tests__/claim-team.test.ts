/** Atomic claim contract and production-adapter error regressions. */
import { describe, expect, it, vi } from "vitest";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { DrizzleGameStore, FakeGameStore } from "../arcade";
import { schema } from "../db";
import { claimTeamContract } from "./claim-team-contract";

claimTeamContract("FakeGameStore", () => new FakeGameStore());

const teamConstraints = ["site_users_team_id_unique", "site_users_team_id_key"];
const input = { code: "111111", displayName: "Fixture", passwordHash: "fixture-hash" };

describe("claim conflict errors through the installed Neon HTTP adapter", () => {
  it.each(teamConstraints)("returns team_claimed when Drizzle wraps %s", async constraint => {
    const error = Object.assign(new Error("Synthetic team conflict"), {
      code: "23505", constraint,
    });
    const client = neon("postgresql://postgres@localhost/unused");
    const query = vi.spyOn(client, "query").mockRejectedValue(error);
    const store = new DrizzleGameStore(drizzle(client, { schema }));
    await expect(store.claimTeam(input)).resolves.toEqual({ ok: false, reason: "team_claimed" });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each(teamConstraints)("also handles an unwrapped %s failure", async constraint => {
    const error = Object.assign(new Error("Synthetic team conflict"), {
      code: "23505", constraint,
    });
    const db = drizzle(neon("postgresql://postgres@localhost/unused"), { schema });
    vi.spyOn(db, "execute").mockImplementation(() => { throw error; });
    await expect(new DrizzleGameStore(db).claimTeam(input)).resolves.toEqual({ ok: false, reason: "team_claimed" });
  });

  describe.each(["wrapped", "direct"] as const)("%s non-team errors", transport => {
    it.each([
      { code: "08006", constraint: undefined },
      { code: "08006", constraint: "site_users_team_id_key" },
      { code: "23505", constraint: "site_users_pkey" },
      { code: "23505", constraint: "unknown_team_constraint" },
      { code: "23505", constraint: undefined },
    ])("propagates $code / $constraint", async details => {
      const error = Object.assign(new Error("Synthetic non-team failure"), details);
      const client = neon("postgresql://postgres@localhost/unused");
      const db = drizzle(client, { schema });
      if (transport === "wrapped") vi.spyOn(client, "query").mockRejectedValue(error);
      else vi.spyOn(db, "execute").mockImplementation(() => { throw error; });
      const result = new DrizzleGameStore(db).claimTeam(input);
      if (transport === "wrapped") await expect(result).rejects.toMatchObject({ cause: error });
      else await expect(result).rejects.toBe(error);
    });
  });
});
