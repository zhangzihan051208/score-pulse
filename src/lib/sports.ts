import type { Sport } from "./types";

export const SPORT_DIMENSIONS: Record<Sport, string[]> = {
  nba: ["scoring", "defense", "playmaking", "hustle", "clutch"],
  soccer: ["attack", "creation", "defending", "workrate", "composure"],
  esports: ["mechanics", "macro", "impact", "consistency", "clutch"],
  nfl: ["execution", "physicality", "awareness", "consistency", "clutch"],
  f1: ["pace", "racecraft", "tyres", "consistency", "composure"],
  tennis: ["serve", "return", "rally", "movement", "clutch"],
  ufc: ["striking", "grappling", "cardio", "control", "composure"],
};

export const SPORT_ACCENT: Record<Sport, string> = {
  nba: "from-[#c45911] to-[#e67e22]",
  soccer: "from-[#1e7a46] to-[#27ae60]",
  esports: "from-[#5b21b6] to-[#9333ea]",
  nfl: "from-[#1a365d] to-[#2b6cb0]",
  f1: "from-[#7f1d1d] to-[#e11d48]",
  tennis: "from-[#365314] to-[#65a30d]",
  ufc: "from-[#111827] to-[#6b7280]",
};

export const SPORT_CHIP: Record<Sport, string> = {
  nba: "bg-orange-600",
  soccer: "bg-emerald-700",
  esports: "bg-violet-700",
  nfl: "bg-blue-800",
  f1: "bg-rose-700",
  tennis: "bg-lime-700",
  ufc: "bg-zinc-800",
};
