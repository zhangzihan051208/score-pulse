import type { LocalizedCommentBody } from "@/lib/comment-translate";
import { localizeCommentsForViewer } from "@/lib/comment-translate";
import type { CommentReply, CommunityTake } from "@/lib/community-take-types";
import type { Locale } from "@/lib/types";

type Row = {
  id: string;
  body: string;
  body_locale?: string | null;
  translations?: Record<string, string> | null;
};

function withLocalizedBody<T extends { body?: string }>(
  row: T,
  localized: LocalizedCommentBody | undefined,
): T {
  if (!localized) return row;
  return {
    ...row,
    body: localized.body,
    bodyOriginal: localized.bodyOriginal,
    bodyLocale: localized.bodyLocale,
    isTranslated: localized.isTranslated,
  };
}

export async function localizeCommunityTakes(
  takes: CommunityTake[],
  commentRows: Row[],
  viewerLocale: Locale,
): Promise<CommunityTake[]> {
  const localized = await localizeCommentsForViewer(commentRows, viewerLocale);
  const byCommentId = localized;

  return takes.map((take) => {
    const top = take.commentId ? byCommentId.get(take.commentId) : undefined;
    const next: CommunityTake =
      top && !take.isYou ? withLocalizedBody(take, top) : take;
    if (!take.replies?.length) return next;
    return {
      ...next,
      replies: take.replies.map((r) =>
        r.isYou ? r : withLocalizedBody(r, byCommentId.get(r.id)),
      ) as CommentReply[],
    };
  });
}
