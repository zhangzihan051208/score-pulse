import assert from "node:assert/strict";
import test from "node:test";
import { guessCommentLocale } from "./comment-translate";

test("guessCommentLocale detects common scripts", () => {
  assert.equal(guessCommentLocale("这场踢得真好"), "zh");
  assert.equal(guessCommentLocale("素晴らしい試合"), "ja");
  assert.equal(guessCommentLocale("Great match tonight"), "en");
});
