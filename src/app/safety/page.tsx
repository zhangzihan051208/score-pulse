"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/use-i18n";

type Report = {
  id: string;
  event_id: string | null;
  excerpt: string | null;
  reason: string;
  created_at: string;
  comment_id: string | null;
};

export default function SafetyPage() {
  const { t } = useI18n();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    fetch("/api/safety/reports")
      .then(async (res) => {
        const data = (await res.json()) as { reports?: Report[]; error?: string };
        if (!res.ok) {
          setError(data.error ?? t.safety.failed);
          setReports([]);
          return;
        }
        setError(null);
        setReports(data.reports ?? []);
      })
      .catch(() => setError(t.safety.failed));
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id: string, action: "hide" | "dismiss") {
    const res = await fetch("/api/safety/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) load();
  }

  return (
    <div className="mx-auto max-w-2xl px-3 py-10">
      <Link href="/" className="text-xs text-muted-foreground hover:underline">
        ← {t.nav.home}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t.safety.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t.safety.lead}</p>
      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {reports && reports.length === 0 && !error ? (
        <p className="mt-6 text-sm text-muted-foreground">{t.safety.empty}</p>
      ) : null}
      <ul className="mt-4 space-y-3">
        {(reports ?? []).map((report) => (
          <li key={report.id} className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">
              {report.reason}
              {report.event_id ? ` · ${report.event_id}` : ""}
            </p>
            <p className="mt-2 text-sm leading-6">{report.excerpt || t.safety.noExcerpt}</p>
            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" onClick={() => void act(report.id, "hide")} disabled={!report.comment_id}>
                {t.safety.hide}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => void act(report.id, "dismiss")}>
                {t.safety.dismiss}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
