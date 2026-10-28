import assert from "node:assert/strict";
import test from "node:test";
import {
  blockUpstream,
  resetUpstreamBudgets,
  takeUpstreamSlot,
  thesportsdbBudgets,
  upstreamAllows,
} from "./upstream-budget";

const minute = [{ key: "minute", limit: 2, windowMs: 60_000 }];

test("a window refuses the call that would pass the cap", () => {
  resetUpstreamBudgets();
  assert.equal(takeUpstreamSlot("demo", minute, 1_000), true);
  assert.equal(takeUpstreamSlot("demo", minute, 1_500), true);
  assert.equal(takeUpstreamSlot("demo", minute, 2_000), false);
  assert.equal(upstreamAllows("demo", minute, 2_000), false);
});

test("an old hit leaves the window", () => {
  resetUpstreamBudgets();
  assert.equal(takeUpstreamSlot("demo", minute, 0), true);
  assert.equal(takeUpstreamSlot("demo", minute, 1_000), true);
  assert.equal(takeUpstreamSlot("demo", minute, 61_000), true);
});

test("429 blocks later calls without spending them", () => {
  resetUpstreamBudgets();
  blockUpstream("demo", minute, 10_000, 5_000);
  assert.equal(takeUpstreamSlot("demo", minute, 6_000), false);
  assert.equal(takeUpstreamSlot("demo", minute, 16_000), true);
});

test("a private sports key uses the premium cap, the shared key does not", () => {
  const previous = process.env.THESPORTSDB_API_KEY;
  process.env.THESPORTSDB_API_KEY = "premium-key";
  assert.equal(thesportsdbBudgets()[0]?.limit, 40);
  process.env.THESPORTSDB_API_KEY = "123";
  assert.equal(thesportsdbBudgets()[0]?.limit, 8);
  if (previous === undefined) delete process.env.THESPORTSDB_API_KEY;
  else process.env.THESPORTSDB_API_KEY = previous;
});
