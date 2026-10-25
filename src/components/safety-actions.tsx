"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/use-i18n";

export function SafetyActions({
  targetUserId,
  commentId,
  eventId,
  excerpt,
  onBlocked,
}: {
  targetUserId?: string;
  commentId?: string;
  eventId?: string;
  excerpt?: string;
  onBlocked?: () => void;
}) {
  const { t } = useI18n();
  const { user, enabled } = useAuth();
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const canBlock = Boolean(targetUserId && targetUserId !== "local" && !targetUserId.startsWith("local"));

  if (!enabled) return null;

  async function report(reason: "spam" | "abuse" | "other") {
    if (!user) {
      setNote(t.auth.signInToPost);
      return;
    }
    const res = await fetch("/api/safety/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, targetUserId, commentId, eventId, excerpt }),
    });
    setOpen(false);
    setNote(res.ok ? t.safety.reported : t.safety.failed);
  }

  async function block() {
    if (!user || !targetUserId) {
      setNote(t.auth.signInToPost);
      return;
    }
    const res = await fetch("/api/safety/block", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: targetUserId }),
    });
    setNote(res.ok ? t.safety.blocked : t.safety.failed);
    if (res.ok) onBlocked?.();
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
      <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen((v) => !v)}>
        {t.safety.report}
      </button>
      {canBlock ? (
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => void block()}>
          {t.safety.block}
        </button>
      ) : null}
      {open ? (
        <span className="flex gap-2">
          <button type="button" className="text-primary" onClick={() => void report("spam")}>
            {t.safety.spam}
          </button>
          <button type="button" className="text-primary" onClick={() => void report("abuse")}>
            {t.safety.abuse}
          </button>
          <button type="button" className="text-primary" onClick={() => void report("other")}>
            {t.safety.other}
          </button>
        </span>
      ) : null}
      {note ? <span className="text-muted-foreground">{note}</span> : null}
    </div>
  );
}
