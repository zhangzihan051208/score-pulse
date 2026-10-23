import {
  moderateUserContent,
  moderationI18nKey,
  type ModerationVerdict,
} from "@/lib/content-moderation";

export function scanCommentBody(body: string): ModerationVerdict {
  return moderateUserContent(body);
}

export function moderationErrorPayload(verdict: Extract<ModerationVerdict, { pass: false }>) {
  return {
    error: "Comment blocked by automatic moderation.",
    code: "moderation_blocked",
    reasons: verdict.codes,
    messageKey: moderationI18nKey(verdict.codes),
  };
}
