import { listFixturesForTeam } from "./fixtures-sync";
import { fixtureToMatchEvent } from "./live-match";
import type { TsdbEvent } from "./thesportsdb";
import {
  fetchTeamById,
  fetchTeamEventsLast,
  fetchTeamEventsNext,
  fetchTeamHonours,
  fetchTeamRoster,
  mapTsdbStatus,
} from "./thesportsdb";
import { resolveTeamBadgeUrl } from "./team-badges";
import type { MatchEvent, Sport } from "./types";

export type TeamRosterMember = {
  id: string;
  name: string;
  position?: string;
  number?: string;
  photoUrl?: string;
  /** FC overall, when the squad is drawn from the soccer honor board. */
  rating?: number;
};

export type TeamHonor = {
  title: string;
  season?: string;
  league?: string;
};

export type TeamEventCard = {
  id: string;
  slug?: string;
  title: string;
  date?: string;
  status: MatchEvent["status"];
  statusDetail?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  isHome: boolean;
};

export type TeamHub = {
  id: string;
  name: string;
  sport: Sport;
  league?: string;
  badgeUrl?: string;
  stadium?: string;
  country?: string;
  formed?: string;
  description?: string;
  roster: TeamRosterMember[];
  recent: TeamEventCard[];
  upcoming: TeamEventCard[];
  honors: TeamHonor[];
};

function tsdbEventToCard(ev: TsdbEvent, teamId: string): TeamEventCard {
  const home = ev.strHomeTeam ?? "Home";
  const away = ev.strAwayTeam ?? "Away";
  const isHome = ev.idHomeTeam === teamId;
  return {
    id: ev.idEvent,
    title: ev.strEvent ?? `${home} vs ${away}`,
    date: ev.dateEvent,
    status: mapTsdbStatus(ev.strStatus ?? undefined),
    statusDetail: ev.strStatus ?? undefined,
    homeTeam: home,
    awayTeam: away,
    homeScore: ev.intHomeScore != null ? Number(ev.intHomeScore) : null,
    awayScore: ev.intAwayScore != null ? Number(ev.intAwayScore) : null,
    isHome,
  };
}

function matchEventToCard(event: MatchEvent, teamId: string): TeamEventCard {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title.en,
    date: event.startAt.slice(0, 10),
    status: event.status,
    statusDetail: event.statusDetail,
    homeTeam: event.homeTeamName ?? "Home",
    awayTeam: event.awayTeamName ?? "Away",
    homeScore: event.homeScore,
    awayScore: event.awayScore,
    isHome: event.homeTeamId === teamId,
  };
}

export async function buildTeamHub(
  teamId: string,
  sport: "nba" | "soccer",
  teamNameHint?: string,
): Promise<TeamHub | null> {
  const [team, rosterRaw, lastTsdb, nextTsdb, honorsRaw, dbEvents] =
    await Promise.all([
      fetchTeamById(teamId),
      fetchTeamRoster(teamId),
      fetchTeamEventsLast(teamId, 10),
      fetchTeamEventsNext(teamId, 10),
      fetchTeamHonours(teamId),
      listFixturesForTeam(teamId, sport, teamNameHint, 20),
    ]);

  const name =
    team?.strTeam?.trim() ||
    teamNameHint?.trim() ||
    dbEvents[0]?.homeTeamName ||
    dbEvents[0]?.awayTeamName ||
    null;
  if (!name) return null;

  const roster: TeamRosterMember[] = rosterRaw
    .filter((p) => p.idPlayer && p.strPlayer)
    .slice(0, 40)
    .map((p) => ({
      id: p.idPlayer,
      name: p.strPlayer,
      position: p.strPosition?.trim() || undefined,
      number: p.intSquadNumber?.trim() || p.strNumber?.trim() || undefined,
      photoUrl: p.strCutout?.trim() || p.strThumb?.trim() || undefined,
    }));

  const byId = new Map<string, TeamEventCard>();
  for (const ev of [...lastTsdb, ...nextTsdb]) {
    byId.set(ev.idEvent, tsdbEventToCard(ev, teamId));
  }
  for (const event of dbEvents) {
    byId.set(event.id, matchEventToCard(event, teamId));
  }

  const all = [...byId.values()].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );
  const recent = all.filter((e) => e.status === "ended" || e.status === "live").slice(0, 12);
  const upcoming = all.filter((e) => e.status === "upcoming").slice(0, 12);

  const honors: TeamHonor[] = honorsRaw
    .map((h) => ({
      title: h.strTrophy?.trim() || "Trophy",
      season: h.strSeason?.trim(),
      league: h.strLeague?.trim(),
    }))
    .filter((h) => h.title);

  const badgeUrl =
    team?.strTeamBadge?.trim() ||
    (await resolveTeamBadgeUrl({ tsdbTeamId: teamId, teamName: name, sport }));

  return {
    id: teamId,
    name,
    sport,
    league: team?.strLeague,
    badgeUrl,
    stadium: team?.strStadium?.trim(),
    country: team?.strCountry?.trim(),
    formed: team?.intFormed?.trim(),
    description: team?.strDescriptionEN?.trim()?.slice(0, 600),
    roster,
    recent,
    upcoming,
    honors,
  };
}
