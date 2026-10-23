import type { Sport } from "@/lib/types";
import portraits from "./portraits.json";

const BG: Record<Sport, string> = {
  nba: "#c45911",
  soccer: "#1e7a46",
  esports: "#5b21b6",
  nfl: "#1a365d",
  f1: "#9f1239",
  tennis: "#3f6212",
  ufc: "#27272a",
};

const map = portraits as Record<string, string>;

export function initials(name: string) {
  const parts = name
    .replace(/[^\p{L}\p{N} ]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function monogram(name: string, sport: Sport) {
  const letters = initials(name);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="40" fill="${BG[sport]}"/><text x="128" y="158" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="92" font-weight="700" fill="white">${letters}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function portraitFor(sport: Sport, id: string, name: string) {
  return map[`${sport}:${id}`] ?? monogram(name, sport);
}
