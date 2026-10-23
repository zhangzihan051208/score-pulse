import { weightedOverall, type PositionKey } from "@/lib/position-ratings";
import type { MatchEvent } from "@/lib/types";

type ScoreMapLike = Record<string, number>;

export function performanceKey(eventId: string, athleteId: string) {
  return `${eventId}:${athleteId}`;
}

/** Simple mean — prefer {@link overallScore} when position is known. */
export function meanScore(scores: ScoreMapLike) {
  const values = Object.values(scores).filter((n) => typeof n === "number");
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function overallScore(scores: ScoreMapLike, positionKey: PositionKey): number {
  return weightedOverall(scores, positionKey);
}

export function getPerformance(event: MatchEvent, athleteId: string) {
  return event.performances.find((p) => p.athleteId === athleteId);
}

export function formatWhen(iso: string, locale: string) {
  const loc =
    locale === "zh"
      ? "zh-CN"
      : locale === "ja"
        ? "ja-JP"
        : locale === "es"
          ? "es-ES"
          : locale === "de"
            ? "de-DE"
            : "en-US";
  return new Intl.DateTimeFormat(loc, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
