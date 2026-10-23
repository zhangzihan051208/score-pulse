import { tx } from "@/lib/copy";
import { positionRoleLabel } from "@/i18n/position-dims";
import type { PositionKey } from "@/lib/position-ratings";
import type { Athlete, Locale, MatchEvent, Performance } from "@/lib/types";

export function teamNameForAthlete(event: MatchEvent, athlete: Athlete): string | undefined {
  if (athlete.idTeam && event.homeTeamId === athlete.idTeam) return event.homeTeamName;
  if (athlete.idTeam && event.awayTeamId === athlete.idTeam) return event.awayTeamName;
  return athlete.team;
}

export function athletePostMeta(event: MatchEvent, athlete: Athlete) {
  return {
    athleteName: athlete.name,
    teamId: athlete.idTeam,
    teamName: teamNameForAthlete(event, athlete),
    photoUrl: athlete.photoUrl,
  };
}

/** One-line role blurb under the player name (no jersey — show on avatar badge). */
export function playerRoleSubtitle(
  locale: Locale,
  athlete: Pick<Athlete, "team">,
  performance: Pick<Performance, "role" | "result">,
  positionKey: PositionKey,
  extras?: { prefix?: string; includePositionGuide?: boolean },
): string {
  const parts: string[] = [];
  if (extras?.prefix?.trim()) parts.push(extras.prefix.trim());
  if (athlete.team?.trim()) parts.push(athlete.team.trim());
  parts.push(tx(performance.role, locale));
  if (performance.result) {
    const sub = tx(performance.result, locale);
    if (sub.trim()) parts.push(sub);
  }
  if (extras?.includePositionGuide !== false) {
    parts.push(positionRoleLabel(locale, positionKey));
  }
  return parts.join(" · ");
}
