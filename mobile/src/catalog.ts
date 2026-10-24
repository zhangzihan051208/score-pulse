import raw from "./data/catalog.json";

export type Locale = "zh" | "en";
export type Hall = "players" | "teams" | "legends";

export type Slim = {
  id: string;
  name: string;
  sport: string;
  subtitle: string;
  positionKey?: string;
  rank: number;
  honorZh: string;
  honorEn: string;
  scores: Record<string, number>;
  dimIds: string[];
  overall: number;
  digits: number;
  kitNumber?: string;
  photo?: string;
  takes: { zh: string; en: string }[];
};

export type RosterMember = {
  id: string;
  name: string;
  positionKey?: string;
  kitNumber?: string;
  overall?: number;
  photo?: string;
};

export type TeamCard = Slim & { roster: RosterMember[] };

type Catalog = {
  sports: string[];
  sportLabels: Record<Locale, Record<string, string>>;
  roleLabels: Record<Locale, Record<string, string>>;
  dimLabels: Record<Locale, Record<string, Record<string, string>>>;
  teamDims: Record<Locale, Record<string, Record<string, string>>>;
  people: Record<string, Slim>;
  teams: Record<string, TeamCard>;
  boards: Record<Hall, Record<string, string[]>>;
  roleBoards?: Record<string, string[]>;
};

export const catalog = raw as Catalog;

const roleOrder = Object.keys(catalog.roleLabels.en);

export function sportLabel(locale: Locale, sport: string) {
  return catalog.sportLabels[locale][sport] ?? sport;
}

export function roleLabel(locale: Locale, positionKey?: string) {
  if (!positionKey) return "";
  return catalog.roleLabels[locale][positionKey] ?? positionKey.split(".").pop() ?? "";
}

export function dimLabel(locale: Locale, sport: string, positionKey: string | undefined, dimId: string) {
  if (positionKey && catalog.dimLabels[locale][positionKey]?.[dimId]) {
    return catalog.dimLabels[locale][positionKey][dimId];
  }
  return catalog.teamDims[locale][sport]?.[dimId] ?? dimId;
}

export function person(sport: string, id: string) {
  return catalog.people[`${sport}:${id}`];
}

export function team(sport: string, id: string) {
  return catalog.teams[`${sport}:${id}`];
}

export function rolesFor(sport: string, hall: "players" | "legends") {
  const ids = catalog.boards[hall][sport] ?? [];
  const present = new Set(
    ids
      .map((id) => catalog.people[`${sport}:${id}`]?.positionKey)
      .filter((key): key is string => Boolean(key)),
  );
  return roleOrder.filter((key) => present.has(key));
}

export function boardRows(hall: Hall, sport: string, role?: string) {
  if (role && catalog.roleBoards?.[role]) {
    return catalog.roleBoards[role]
      .map((id, index) => {
        const row = catalog.people[`${sport}:${id}`];
        return row ? { ...row, rank: index + 1 } : undefined;
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
  }
  const ids = catalog.boards[hall][sport] ?? [];
  const rows =
    hall === "teams"
      ? ids.map((id) => catalog.teams[`${sport}:${id}`]).filter(Boolean)
      : ids.map((id) => catalog.people[`${sport}:${id}`]).filter(Boolean);
  const filtered = role ? rows.filter((row) => row.positionKey === role) : rows;
  return filtered.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function formatScore(overall: number, digits = 1) {
  return overall.toFixed(digits);
}
