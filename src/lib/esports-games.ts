/** Popular titles available on PandaScore REST (fixtures tier). */

export type EsportsGameSlug = "lol" | "cs2" | "dota2" | "valorant";

export type EsportsGameConfig = {
  slug: EsportsGameSlug;
  /** PandaScore URL prefix (`cs2` uses legacy `csgo`). */
  apiPrefix: string;
  label: string;
};

export const ESPORTS_GAMES: EsportsGameConfig[] = [
  { slug: "lol", apiPrefix: "lol", label: "League of Legends" },
  { slug: "cs2", apiPrefix: "csgo", label: "Counter-Strike 2" },
  { slug: "dota2", apiPrefix: "dota2", label: "Dota 2" },
  { slug: "valorant", apiPrefix: "valorant", label: "Valorant" },
];

const bySlug = new Map(ESPORTS_GAMES.map((g) => [g.slug, g]));

export function getEsportsGame(slug: string): EsportsGameConfig | undefined {
  return bySlug.get(slug as EsportsGameSlug);
}

export function isEsportsGameSlug(slug: string): slug is EsportsGameSlug {
  return bySlug.has(slug as EsportsGameSlug);
}

/** Tab entries for `/boards/esports` branches. */
export function esportsBoardTabs() {
  return ESPORTS_GAMES.map((g) => ({
    slug: g.slug,
    sport: "esports" as const,
    label: g.label,
  }));
}
