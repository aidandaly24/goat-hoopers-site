import { test } from "vitest";
import assert from "node:assert/strict";
import { createCharge } from "./charge";

test("Space hold samples power; auto-repeat does not restart; keyup releases once", () => {
  const charge = createCharge();
  assert.equal(charge.begin(1000), true);
  assert.equal(charge.begin(1300), false);
  assert.equal(charge.power(1800), 50);
  assert.equal(charge.release(1800), 50);
  assert.equal(charge.release(1801), null);
  assert.equal(charge.active(), false);
});

test("focus loss, hidden tabs and reset cancel the pending release", () => {
  const charge = createCharge();
  for (let i = 0; i < 100; i++) {
    charge.begin(i * 2000);
    charge.cancel();
    assert.equal(charge.release(i * 2000 + 800), null);
    assert.equal(charge.active(), false);
  }
  charge.begin(200000);
  assert.equal(charge.release(200800), 50);
});

test("charge remains bounded at zero and maximum even after a long hold", () => {
  const charge = createCharge();
  charge.begin(1000);
  assert.equal(charge.power(0), 0);
  assert.equal(charge.power(1000), 0);
  assert.equal(charge.power(12000), 100);
  assert.equal(charge.release(12000), 100);
});
