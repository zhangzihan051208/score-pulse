import { shouldTranslate } from "@/lib/comment-locale";
import type { Locale } from "@/lib/types";

type Job = {
  text: string;
  resolve: (value: string | null) => void;
};

const resolved = new Map<string, string | null>();
const queues = new Map<string, Job[]>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function cacheKey(locale: string, text: string) {
  return `${locale}\n${text}`;
}

/** Batch visible comments into one translation request. */
export function requestTranslation(text: string, locale: Locale): Promise<string | null> {
  const trimmed = text.trim();
  if (!shouldTranslate(trimmed, locale)) return Promise.resolve(null);
  const key = cacheKey(locale, trimmed);
  if (resolved.has(key)) return Promise.resolve(resolved.get(key) ?? null);

  return new Promise((resolve) => {
    const list = queues.get(locale) ?? [];
    list.push({ text: trimmed, resolve });
    queues.set(locale, list);
    if (!timers.has(locale)) {
      timers.set(
        locale,
        setTimeout(() => {
          void flush(locale);
        }, 40),
      );
    }
  });
}

async function flush(locale: string) {
  timers.delete(locale);
  const list = queues.get(locale) ?? [];
  const batch = list.splice(0, 24);
  queues.set(locale, list);
  if (list.length > 0) {
    timers.set(
      locale,
      setTimeout(() => {
        void flush(locale);
      }, 0),
    );
  }
  if (batch.length === 0) return;

  const finish = (values: (string | null)[]) => {
    batch.forEach((job, index) => {
      const next = values[index] ?? null;
      resolved.set(cacheKey(locale, job.text), next);
      job.resolve(next);
    });
  };

  try {
    const res = await fetch(
      `/api/comments/translate?locale=${encodeURIComponent(locale)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch.map((job) => job.text) }),
      },
    );
    if (!res.ok) {
      finish(batch.map(() => null));
      return;
    }
    const data = (await res.json()) as {
      items?: { text?: string; original?: string | null }[];
    };
    finish(
      batch.map((job, index) => {
        const item = data.items?.[index];
        if (!item?.original || !item.text || item.text === job.text) return null;
        return item.text;
      }),
    );
  } catch {
    finish(batch.map(() => null));
  }
}
