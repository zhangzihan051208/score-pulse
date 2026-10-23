import { events } from "@/lib/data";
import { overallScore } from "@/lib/score-display";
import type { Sport } from "@/lib/types";
import { playerOverall } from "./blend";
import type { HonorPlayer, HonorTeam } from "./types";

export type DossierText = { en: string; zh: string };

export type DossierFixture = {
  id: string;
  title: DossierText;
  date: string;
  status: "upcoming" | "ended" | "live";
  href?: string;
  detail?: DossierText;
};

export type DossierRating = {
  id: string;
  title: DossierText;
  date: string;
  overall: number;
  href?: string;
  /** Real match thread, or a night projected from the honour baseline. */
  source: "match" | "form";
};

const ANCHOR = Date.UTC(2026, 9, 23);

const OPPONENTS: Record<Sport, string[]> = {
  soccer: [
    "Real Madrid",
    "Barcelona",
    "Bayern Munich",
    "Manchester City",
    "Arsenal",
    "Liverpool",
    "Inter",
    "Paris Saint-Germain",
    "Juventus",
    "Atlético Madrid",
    "Borussia Dortmund",
    "Napoli",
  ],
  nba: [
    "Los Angeles Lakers",
    "Boston Celtics",
    "Golden State Warriors",
    "Denver Nuggets",
    "New York Knicks",
    "Milwaukee Bucks",
    "Oklahoma City Thunder",
    "Miami Heat",
    "Dallas Mavericks",
    "Chicago Bulls",
  ],
  nfl: [
    "Kansas City Chiefs",
    "Philadelphia Eagles",
    "San Francisco 49ers",
    "Buffalo Bills",
    "Baltimore Ravens",
    "Dallas Cowboys",
    "Green Bay Packers",
    "Detroit Lions",
    "Cincinnati Bengals",
    "Miami Dolphins",
  ],
  f1: [
    "Monaco Grand Prix",
    "British Grand Prix",
    "Italian Grand Prix",
    "Belgian Grand Prix",
    "Japanese Grand Prix",
    "United States Grand Prix",
    "Singapore Grand Prix",
    "Brazilian Grand Prix",
  ],
  tennis: [
    "Jannik Sinner",
    "Carlos Alcaraz",
    "Novak Djokovic",
    "Aryna Sabalenka",
    "Iga Świątek",
    "Coco Gauff",
    "Alexander Zverev",
    "Ben Shelton",
  ],
  ufc: [
    "Islam Makhachev",
    "Ilia Topuria",
    "Alex Pereira",
    "Tom Aspinall",
    "Zhang Weili",
    "Alexander Volkanovski",
    "Max Holloway",
    "Charles Oliveira",
  ],
  esports: [
    "T1",
    "Gen.G",
    "Team Spirit",
    "G2 Esports",
    "FaZe Clan",
    "Team Vitality",
    "Natus Vincere",
    "Fnatic",
  ],
};

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function iso(daysFromAnchor: number) {
  return new Date(ANCHOR + daysFromAnchor * 86_400_000).toISOString().slice(0, 10);
}

function norm(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function pickOpponent(sport: Sport, self: string, salt: number) {
  const needle = norm(self);
  const pool = OPPONENTS[sport].filter((name) => {
    const n = norm(name);
    return !needle.includes(n) && !n.includes(needle);
  });
  const list = pool.length ? pool : OPPONENTS[sport];
  return list[salt % list.length]!;
}

function fixtureTitle(
  sport: Sport,
  name: string,
  team: string,
  opponent: string,
  home: boolean,
): DossierText {
  if (sport === "f1") return { en: opponent, zh: opponent };
  if (sport === "tennis" || sport === "ufc") {
    const line = `${name} vs ${opponent}`;
    return { en: line, zh: line };
  }
  const left = home ? team : opponent;
  const right = home ? opponent : team;
  const line = `${left} vs ${right}`;
  return { en: line, zh: line };
}

function formOverall(base: number, id: string, index: number) {
  const delta = ((hash(`${id}:form:${index}`) % 13) - 6) / 10;
  return Math.round(Math.min(9.8, Math.max(6.1, base + delta)) * 10) / 10;
}

function realRows(person: HonorPlayer): { fixture: DossierFixture; rating?: DossierRating }[] {
  const team = norm(person.team);
  const rows: { fixture: DossierFixture; rating?: DossierRating }[] = [];
  for (const event of events) {
    if (event.sport !== person.sport) continue;
    const perf = event.performances.find((row) => row.athleteId === person.id);
    const home = norm(event.homeTeamName ?? "");
    const away = norm(event.awayTeamName ?? "");
    const teamHit =
      team.length > 2 &&
      ((home && (home.includes(team) || team.includes(home))) ||
        (away && (away.includes(team) || team.includes(away))));
    if (!perf && !teamHit) continue;
    const title = { en: event.title.en, zh: event.title.zh };
    const date = event.startAt.slice(0, 10);
    rows.push({
      fixture: {
        id: event.id,
        title,
        date,
        status: event.status === "live" ? "live" : event.status,
        href: `/events/${event.slug}`,
        detail: { en: event.subtitle.en, zh: event.subtitle.zh },
      },
      rating: perf
        ? {
            id: event.id,
            title,
            date,
            overall: overallScore(perf.communityAvg, perf.positionKey),
            href: `/events/${event.slug}/${encodeURIComponent(person.id)}`,
            source: "match",
          }
        : undefined,
    });
  }
  return rows;
}

export function playerTimeline(person: HonorPlayer): {
  schedule: DossierFixture[];
  recentRatings: DossierRating[];
} {
  const real = realRows(person);
  const hasRealPast = real.some((row) => row.fixture.status !== "upcoming");
  const hasRealNext = real.some((row) => row.fixture.status === "upcoming");
  const base = playerOverall(person.scores, person.positionKey);
  const generated: { fixture: DossierFixture; rating?: DossierRating }[] = [];
  const projectForm = person.era !== "legend";

  if (projectForm && !hasRealPast) {
    [-16, -9, -3].forEach((offset, index) => {
      const salt = hash(`${person.id}:past:${index}`);
      const opponent = pickOpponent(person.sport, person.team || person.name, salt);
      const home = salt % 2 === 0;
      const title = fixtureTitle(person.sport, person.name, person.team, opponent, home);
      const date = iso(offset);
      const id = `${person.id}-form-${index}`;
      generated.push({
        fixture: { id, title, date, status: "ended" },
        rating: {
          id,
          title,
          date,
          overall: formOverall(base, person.id, index),
          source: "form",
        },
      });
    });
  }
  if (projectForm && !hasRealNext) {
    [4, 11].forEach((offset, index) => {
      const salt = hash(`${person.id}:next:${index}`);
      const opponent = pickOpponent(person.sport, person.team || person.name, salt);
      const home = salt % 2 === 1;
      const title = fixtureTitle(person.sport, person.name, person.team, opponent, home);
      generated.push({
        fixture: {
          id: `${person.id}-next-${index}`,
          title,
          date: iso(offset),
          status: "upcoming",
        },
      });
    });
  }

  const schedule = [...real.map((row) => row.fixture), ...generated.map((row) => row.fixture)].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const recentRatings = [...real, ...generated]
    .map((row) => row.rating)
    .filter((row): row is DossierRating => Boolean(row))
    .sort((a, b) => b.date.localeCompare(a.date));

  return { schedule, recentRatings };
}

export function teamTimeline(club: Pick<HonorTeam, "id" | "name" | "sport">): DossierFixture[] {
  const rows: DossierFixture[] = [];
  [-16, -9, -3, 4, 11].forEach((offset, index) => {
    const salt = hash(`${club.id}:club:${index}`);
    const opponent = pickOpponent(club.sport, club.name, salt);
    const home = salt % 2 === 0;
    const left = home ? club.name : opponent;
    const right = home ? opponent : club.name;
    const title =
      club.sport === "f1"
        ? { en: opponent, zh: opponent }
        : club.sport === "tennis" || club.sport === "ufc"
          ? { en: `${club.name} vs ${opponent}`, zh: `${club.name} vs ${opponent}` }
          : { en: `${left} vs ${right}`, zh: `${left} vs ${right}` };
    rows.push({
      id: `${club.id}-fx-${index}`,
      title,
      date: iso(offset),
      status: offset < 0 ? "ended" : "upcoming",
    });
  });
  return rows;
}
