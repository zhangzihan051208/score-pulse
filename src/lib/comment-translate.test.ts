import assert from "node:assert/strict";
import test from "node:test";
import { guessCommentLocale, shouldTranslate } from "./comment-locale";

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
