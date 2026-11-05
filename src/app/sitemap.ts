import type { MetadataRoute } from "next";
import { SIDELINE_LEAGUES } from "@/lib/leagues";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://getgrandstand.app").replace(
    /\/$/,
    "",
  );
  const now = new Date();
  const staticPaths = ["", "/boards/soccer", "/boards/nba", "/rankings", "/guide", "/search", "/privacy", "/safety"];
  const leaguePaths = SIDELINE_LEAGUES.map((league) =>
    league.sport === "nba" ? "/boards/nba" : `/boards/${league.sport}/${league.slug}`,
  );
  const tablePaths = SIDELINE_LEAGUES.map((league) =>
    league.sport === "nba"
      ? "/boards/nba/table"
      : `/boards/${league.sport}/${league.slug}/table`,
  );
  const paths = [...new Set([...staticPaths, ...leaguePaths, ...tablePaths])];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" || path.startsWith("/boards") ? "hourly" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/boards") ? 0.8 : 0.4,
  }));
}
