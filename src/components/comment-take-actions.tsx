"use client";

import { useState } from "react";
import { CommentBody } from "@/components/comment-body";
import { SafetyActions } from "@/components/safety-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/use-i18n";
import type { CommunityTake } from "@/components/community-ratings-panel";

export function CommentTakeActions({
  take,
  onChange,
}: {
  take: CommunityTake;
  onChange?: () => void;
}) {
  const { t } = useI18n();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [likeCount, setLikeCount] = useState(take.likeCount ?? 0);
  const [liked, setLiked] = useState(take.likedByYou ?? false);

  if (!take.commentId) return null;

  async function toggleLike() {
    if (!take.commentId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${take.commentId}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const data = (await res.json()) as { liked: boolean; likeCount: number };
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        onChange?.();
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitReply() {
    if (!take.commentId || replyText.trim().length < 2 || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${take.commentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        setReplyOpen(false);
        onChange?.();
      }
    } finally {
      setBusy(false);
    }
  }

  async function hideComment() {
    if (!take.commentId || !take.isYou || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/comments/${take.commentId}/hide`, {
        method: "POST",
      });
      if (res.ok) onChange?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t pt-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleLike()}
          className={
            liked
              ? "font-semibold text-primary"
              : "text-muted-foreground hover:text-foreground"
          }
        >
          {t.social.like} {likeCount > 0 ? `(${likeCount})` : ""}
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => setReplyOpen((v) => !v)}
        >
          {t.social.reply}
          {(take.replyCount ?? 0) > 0 ? ` (${take.replyCount})` : ""}
        </button>
        {take.isYou ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => void hideComment()}
          >
            {t.social.hide}
          </button>
        ) : (
          <SafetyActions
            targetUserId={take.userId}
            commentId={take.commentId}
            excerpt={take.body}
            onBlocked={onChange}
          />
        )}
      </div>
      {take.replies && take.replies.length > 0 ? (
        <ul className="space-y-1.5 rounded-md bg-muted/40 px-2 py-2">
          {take.replies.map((r) => (
            <li key={r.id} className="text-xs">
              <span className="font-medium">{r.author}</span>
              <CommentBody
                body={r.body}
                bodyOriginal={r.bodyOriginal}
                className="mt-0.5 leading-relaxed"
              />
            </li>
          ))}
        </ul>
      ) : null}
      {replyOpen ? (
        <div className="flex gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t.social.replyPlaceholder}
            className="h-8 text-xs"
          />
          <Button
            type="button"
            size="sm"
            disabled={busy || replyText.trim().length < 2}
            onClick={() => void submitReply()}
          >
            {t.social.sendReply}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
