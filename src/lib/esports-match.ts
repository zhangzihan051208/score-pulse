import { S } from "@/lib/copy";
import { emptyScoresForPosition } from "@/lib/position-ratings";
import type { EsportsGameConfig, EsportsGameSlug } from "@/lib/esports-games";
import type { PsMatch } from "@/lib/pandascore";
import { SPORT_ACCENT } from "@/lib/sports";
import type { Athlete, MatchEvent, Performance } from "@/lib/types";

function mapStatus(status?: string): MatchEvent["status"] {
  switch (status) {
    case "running":
      return "live";
    case "finished":
    case "canceled":
    case "cancelled":
      return "ended";
    default:
      return "upcoming";
  }
}

export function esportsEventSlug(game: EsportsGameSlug | string, match: PsMatch): string {
  const tail = match.slug?.trim() || String(match.id);
  return `es-${game}-${tail}`.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 120);
}

function teamNames(match: PsMatch): [string, string] {
  const a = match.opponents?.[0]?.opponent?.name ?? "Team A";
  const b = match.opponents?.[1]?.opponent?.name ?? "Team B";
  return [a, b];
}

function scores(match: PsMatch): [number | null, number | null] {
  const r = match.results ?? [];
  return [r[0]?.score ?? null, r[1]?.score ?? null];
}

function subtitleFor(match: PsMatch): string {
  return (
    match.league?.name ??
    match.serie?.full_name ??
    match.serie?.name ??
    match.tournament?.name ??
    match.videogame?.name ??
    "Esports"
  );
}

function playersToPerformances(match: PsMatch, homeTag: string, awayTag: string) {
  const performances: Performance[] = [];
  const roster: Record<string, Athlete> = {};
  const positionKey = "esports.player" as const;

  match.opponents?.forEach((slot, sideIndex) => {
    const team = slot.opponent;
    if (!team) return;
    const tag = sideIndex === 0 ? homeTag : awayTag;
    for (const p of team.players ?? []) {
      if (!p.id || !p.name) continue;
      const id = String(p.id);
      roster[id] = {
        id,
        name: p.name,
        shortName: p.name.slice(0, 2).toUpperCase(),
        country: S("—"),
        team: tag,
        photoUrl: p.image_url,
      };
      performances.push({
        athleteId: id,
        positionKey,
        role: S(p.role?.trim() || "Player"),
        highlight: S("Grade this series on five axes — not the season stat line."),
        stats: [],
        communityAvg: { ...emptyScoresForPosition(positionKey) },
        ratingCount: 0,
      });
    }
  });

  return { performances, roster };
}

export function pandaMatchToEvent(game: EsportsGameConfig, match: PsMatch): MatchEvent | null {
  if (!match.id) return null;
  const [homeName, awayName] = teamNames(match);
  const [homeScore, awayScore] = scores(match);
  const homeTag = match.opponents?.[0]?.opponent?.acronym ?? homeName.slice(0, 3).toUpperCase();
  const awayTag = match.opponents?.[1]?.opponent?.acronym ?? awayName.slice(0, 3).toUpperCase();
  const status = mapStatus(match.status);
  const slug = esportsEventSlug(game.slug, match);
  const title =
    match.name?.trim() ||
    `${homeName} vs ${awayName}` ||
    `Match ${match.id}`;
  const startAt = match.begin_at ?? match.scheduled_at ?? new Date().toISOString();
  const { performances, roster } = playersToPerformances(match, homeTag, awayTag);

  const bo = match.number_of_games ? `BO${match.number_of_games}` : "";
  const scoreLine =
    homeScore != null && awayScore != null ? `${homeScore}-${awayScore}` : undefined;

  return {
    id: String(match.id),
    slug,
    sport: "esports",
    leagueSlug: game.slug,
    homeTeamId: match.opponents?.[0]?.opponent?.id
      ? String(match.opponents[0].opponent.id)
      : undefined,
    awayTeamId: match.opponents?.[1]?.opponent?.id
      ? String(match.opponents[1].opponent.id)
      : undefined,
    homeTeamName: homeName,
    awayTeamName: awayName,
    homeScore,
    awayScore,
    statusDetail: match.status,
    title: S(title),
    subtitle: S(subtitleFor(match)),
    venue: S(bo || "—"),
    startAt,
    status,
    summary: S(
      scoreLine
        ? `${scoreLine}${bo ? ` · ${bo}` : ""} · ${performances.length} players`
        : `${performances.length} players on the card`,
    ),
    cover: SPORT_ACCENT.esports,
    performances,
    roster,
    live: status === "live",
  };
}
