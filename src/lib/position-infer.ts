import type { PositionKey } from "./position-ratings";
import type { Sport } from "./types";

export function inferPositionKey(
  sport: Sport,
  positionText?: string | null,
): PositionKey {
  const p = (positionText ?? "").toLowerCase();

  if (sport === "nba") {
    if (p.includes("center") || p === "c") return "nba.center";
    if (p.includes("guard") || p === "g") return "nba.guard";
    if (p.includes("forward") || p === "f") return "nba.forward";
    return "nba.forward";
  }

  if (sport === "soccer") {
    if (p.includes("goal")) return "soccer.keeper";
    if (p.includes("wing") || p.includes("wide")) return "soccer.winger";
    if (p.includes("strik") || p.includes("forward") || p.includes("centre-forward"))
      return "soccer.striker";
    if (
      p.includes("full") ||
      (p.includes("back") && (p.includes("left") || p.includes("right")))
    )
      return "soccer.fullback";
    if (p.includes("defend") || p.includes("centre-back") || p.includes("center-back"))
      return "soccer.centerback";
    if (p.includes("mid")) return "soccer.midfielder";
    return "soccer.midfielder";
  }

  return "nba.forward";
}
