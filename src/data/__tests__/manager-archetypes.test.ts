import { test } from "vitest";
import assert from "node:assert/strict";
import {
  getManagerArchetype,
  getManagerArchetypes,
} from "../manager-archetypes";
import { currentArchetype } from "@/domain/manager-archetype";

test("getManagerArchetypes returns one profile per roster, sorted", () => {
  const all = getManagerArchetypes();
  assert.equal(all.length, 10);
  assert.deepEqual(
    all.map((p) => p.rosterId),
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  );
});

test("getManagerArchetype finds roster 8 with the prior-manager note", () => {
  const p = getManagerArchetype("8");
  assert.ok(p);
  assert.equal(p.rosterId, "8");
  assert.equal(p.seasons[0].managerName, "slennox");
  assert.equal(currentArchetype(p), "hoarder");
  assert.match(p.seasons[0].priorManagerNote ?? "", /slennox/);
});

test("getManagerArchetype returns null for an unknown roster id", () => {
  assert.equal(getManagerArchetype("99"), null);
  assert.equal(getManagerArchetype("0"), null);
});
