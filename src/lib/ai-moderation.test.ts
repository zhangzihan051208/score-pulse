import assert from "node:assert/strict";
import test from "node:test";
import { codesFromModerationCategories, moderateComment } from "./ai-moderation";

test("sexual and violent categories become the existing block reason", () => {
  const codes = codesFromModerationCategories({
    sexual: true,
    harassment: true,
    violence: false,
  });
  assert.deepEqual(codes.sort(), ["porn_violence", "profanity"].sort());
});

test("a flagged result with no known category still blocks", () => {
  assert.deepEqual(codesFromModerationCategories({}), ["profanity"]);
});

test("local rules reject a contact pitch without calling out", async () => {
  const verdict = await moderateComment("加微信领取优惠码");
  assert.equal(verdict.pass, false);
  if (!verdict.pass) assert.ok(verdict.codes.includes("ad"));
});

test("ordinary match talk is allowed when no moderation key is set", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const verdict = await moderateComment("这场下半场的中场调度是真的稳");
    assert.deepEqual(verdict, { pass: true, status: "approved" });
  } finally {
    if (previous === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous;
  }
});
