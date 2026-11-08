import assert from "node:assert/strict";
import test from "node:test";
import { guessCommentLocale, shouldTranslate } from "./comment-locale";
import { parseTranslationBatch } from "./comment-translate-batch";

test("guessCommentLocale detects common scripts", () => {
  assert.equal(guessCommentLocale("这场踢得真好"), "zh");
  assert.equal(guessCommentLocale("素晴らしい試合"), "ja");
  assert.equal(guessCommentLocale("Great match tonight"), "en");
});

test("shouldTranslate skips comments already in the viewer language", () => {
  assert.equal(shouldTranslate("Great match tonight", "zh"), true);
  assert.equal(shouldTranslate("这场踢得真好", "zh"), false);
  assert.equal(shouldTranslate("—", "zh"), false);
});

test("parseTranslationBatch keeps order and rejects a short list", () => {
  assert.deepEqual(
    parseTranslationBatch(JSON.stringify({ items: ["维拉领先", "角球没顶到"] }), 2),
    ["维拉领先", "角球没顶到"],
  );
  assert.equal(parseTranslationBatch(JSON.stringify({ items: ["只有一条"] }), 2), null);
});
