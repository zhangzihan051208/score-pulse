import type { Dict } from "@/i18n/dict";

type ModerationDict = Dict["moderation"];

const KEY_MAP: Record<string, keyof ModerationDict> = {
  "moderation.blockAd": "blockAd",
  "moderation.blockProfanity": "blockProfanity",
  "moderation.blockPornViolence": "blockPornViolence",
  "moderation.blockSpam": "blockSpam",
};

export function moderationMessage(
  t: ModerationDict,
  messageKey?: string,
): string {
  if (!messageKey) return t.blockGeneric;
  const field = KEY_MAP[messageKey];
  return field ? t[field] : t.blockGeneric;
}
