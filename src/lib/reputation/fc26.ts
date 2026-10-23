import type { PositionKey } from "@/lib/position-ratings";
import type { ScoreMap } from "@/lib/types";
import type { HonorPlayer } from "./types";

/** EA Sports FC 26 overall, shirt and club. Source: SoFIFA top 100 snapshot (version FC 26). */
export type Fc26Patch = {
  rating: number;
  kitNumber: string;
  team: string;
  clubId?: string;
  positionKey: PositionKey;
  scores: ScoreMap;
  /** Lower sorts first. This is the FC 26 list order. */
  order: number;
};

export const FC26_PATCHES: Record<string, Fc26Patch> = {
  mbappe: { rating: 91, kitNumber: "10", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.striker", order: 1, scores: { finishing: 9.2, movement: 9.7, linkup: 8.5, pressing: 7.2, composure: 8.8 } },
  salah: { rating: 91, kitNumber: "11", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.winger", order: 2, scores: { dribbling: 9.0, crossing: 8.6, finishing: 9.4, tracking: 6.3, decision: 8.9 } },
  bellingham: { rating: 90, kitNumber: "5", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.midfielder", order: 3, scores: { passing: 8.9, vision: 9.0, defending: 8.1, stamina: 9.4, tempo: 9.1 } },
  haaland: { rating: 90, kitNumber: "9", team: "Manchester City", clubId: "mancity", positionKey: "soccer.striker", order: 4, scores: { finishing: 9.4, movement: 8.6, linkup: 7.5, pressing: 8.2, composure: 8.6 } },
  rodri: { rating: 90, kitNumber: "16", team: "Manchester City", clubId: "mancity", positionKey: "soccer.midfielder", order: 5, scores: { passing: 9.2, vision: 8.4, defending: 8.6, stamina: 9.1, tempo: 9.2 } },
  dembele: { rating: 90, kitNumber: "10", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.striker", order: 6, scores: { finishing: 9.0, movement: 9.1, linkup: 8.7, pressing: 6.7, composure: 8.8 } },
  vandijk: { rating: 90, kitNumber: "4", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.centerback", order: 7, scores: { aerial: 8.8, tackling: 8.9, positioning: 9.1, buildup: 8.2, composure: 9.0 } },
  yamal: { rating: 89, kitNumber: "10", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.winger", order: 8, scores: { dribbling: 9.2, crossing: 8.9, finishing: 8.3, tracking: 4.8, decision: 8.8 } },
  wirtz: { rating: 89, kitNumber: "7", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.midfielder", order: 9, scores: { passing: 8.8, vision: 9.1, defending: 5.2, stamina: 8.7, tempo: 8.8 } },
  vitinha: { rating: 89, kitNumber: "17", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.midfielder", order: 10, scores: { passing: 8.9, vision: 9.0, defending: 8.2, stamina: 8.7, tempo: 8.8 } },
  pedri: { rating: 89, kitNumber: "8", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.midfielder", order: 11, scores: { passing: 8.9, vision: 9.1, defending: 8.6, stamina: 9.0, tempo: 8.9 } },
  valverde: { rating: 89, kitNumber: "8", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.midfielder", order: 12, scores: { passing: 8.8, vision: 8.6, defending: 8.7, stamina: 9.3, tempo: 8.8 } },
  vini: { rating: 89, kitNumber: "7", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.winger", order: 13, scores: { dribbling: 9.3, crossing: 8.1, finishing: 8.8, tracking: 5.8, decision: 8.5 } },
  hakimi: { rating: 89, kitNumber: "2", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.fullback", order: 14, scores: { defending: 8.3, overlap: 9.2, delivery: 8.5, pace: 9.2, focus: 8.4 } },
  raphinha: { rating: 89, kitNumber: "11", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.winger", order: 15, scores: { dribbling: 8.8, crossing: 8.6, finishing: 8.7, tracking: 7.0, decision: 8.7 } },
  donnarumma: { rating: 89, kitNumber: "25", team: "Manchester City", clubId: "mancity", positionKey: "soccer.keeper", order: 16, scores: { saves: 9.0, reflexes: 9.0, distribution: 7.0, command: 8.3, positioning: 8.7 } },
  alisson: { rating: 89, kitNumber: "1", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.keeper", order: 17, scores: { saves: 8.6, reflexes: 8.9, distribution: 8.6, command: 8.5, positioning: 9.0 } },
  kimmich: { rating: 89, kitNumber: "6", team: "Bayern Munich", clubId: "bayern", positionKey: "soccer.midfielder", order: 18, scores: { passing: 9.1, vision: 8.6, defending: 8.6, stamina: 9.2, tempo: 8.8 } },
  kane: { rating: 89, kitNumber: "9", team: "Bayern Munich", clubId: "bayern", positionKey: "soccer.striker", order: 19, scores: { finishing: 9.3, movement: 6.4, linkup: 8.6, pressing: 7.8, composure: 9.2 } },
  courtois: { rating: 89, kitNumber: "1", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.keeper", order: 20, scores: { saves: 8.5, reflexes: 9.0, distribution: 7.6, command: 8.9, positioning: 8.8 } },
  musiala: { rating: 88, kitNumber: "10", team: "Bayern Munich", clubId: "bayern", positionKey: "soccer.midfielder", order: 21, scores: { passing: 8.3, vision: 8.4, defending: 6.5, stamina: 7.3, tempo: 8.7 } },
  saka: { rating: 88, kitNumber: "7", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.winger", order: 22, scores: { dribbling: 8.9, crossing: 9.0, finishing: 8.4, tracking: 7.3, decision: 8.6 } },
  isak: { rating: 88, kitNumber: "9", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.striker", order: 23, scores: { finishing: 9.1, movement: 8.3, linkup: 8.0, pressing: 7.0, composure: 8.8 } },
  gabriel: { rating: 88, kitNumber: "6", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.centerback", order: 24, scores: { aerial: 8.9, tackling: 8.8, positioning: 8.9, buildup: 7.8, composure: 7.9 } },
  lautaro: { rating: 88, kitNumber: "10", team: "Inter", clubId: "inter", positionKey: "soccer.striker", order: 25, scores: { finishing: 9.3, movement: 8.2, linkup: 7.8, pressing: 8.7, composure: 8.8 } },
  lewa: { rating: 88, kitNumber: "9", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.striker", order: 27, scores: { finishing: 9.2, movement: 7.3, linkup: 8.2, pressing: 7.8, composure: 8.7 } },
  palmer: { rating: 87, kitNumber: "10", team: "Chelsea", clubId: "chelsea", positionKey: "soccer.midfielder", order: 28, scores: { passing: 8.7, vision: 8.9, defending: 5.0, stamina: 8.3, tempo: 8.8 } },
  caicedo: { rating: 87, kitNumber: "25", team: "Chelsea", clubId: "chelsea", positionKey: "soccer.midfielder", order: 29, scores: { passing: 8.4, vision: 7.9, defending: 8.7, stamina: 9.0, tempo: 8.3 } },
  mendes: { rating: 87, kitNumber: "25", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.fullback", order: 30, scores: { defending: 8.3, overlap: 8.9, delivery: 8.1, pace: 9.4, focus: 8.3 } },
  kvara: { rating: 87, kitNumber: "7", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.winger", order: 31, scores: { dribbling: 8.9, crossing: 7.9, finishing: 8.1, tracking: 6.8, decision: 8.5 } },
  julian: { rating: 87, kitNumber: "19", team: "Atlético Madrid", clubId: "atletico", positionKey: "soccer.striker", order: 32, scores: { finishing: 8.8, movement: 8.6, linkup: 8.3, pressing: 8.6, composure: 8.6 } },
  saliba: { rating: 87, kitNumber: "2", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.centerback", order: 33, scores: { aerial: 8.4, tackling: 8.8, positioning: 8.8, buildup: 7.8, composure: 8.2 } },
  gyokeres: { rating: 87, kitNumber: "14", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.striker", order: 34, scores: { finishing: 8.8, movement: 9.0, linkup: 7.8, pressing: 9.0, composure: 8.5 } },
  kounde: { rating: 87, kitNumber: "23", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.fullback", order: 35, scores: { defending: 8.7, overlap: 8.6, delivery: 7.8, pace: 8.4, focus: 8.2 } },
  macallister: { rating: 87, kitNumber: "10", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.midfielder", order: 36, scores: { passing: 8.8, vision: 8.6, defending: 8.2, stamina: 8.7, tempo: 8.8 } },
  bastoni: { rating: 87, kitNumber: "95", team: "Inter", clubId: "inter", positionKey: "soccer.centerback", order: 37, scores: { aerial: 8.7, tackling: 8.7, positioning: 8.7, buildup: 8.3, composure: 8.5 } },
  rice: { rating: 87, kitNumber: "41", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.midfielder", order: 38, scores: { passing: 8.6, vision: 7.9, defending: 8.6, stamina: 9.2, tempo: 8.4 } },
  osimhen: { rating: 87, kitNumber: "45", team: "Galatasaray", clubId: "galatasaray", positionKey: "soccer.striker", order: 39, scores: { finishing: 8.8, movement: 9.2, linkup: 7.1, pressing: 7.5, composure: 8.0 } },
  barella: { rating: 87, kitNumber: "23", team: "Inter", clubId: "inter", positionKey: "soccer.midfielder", order: 41, scores: { passing: 8.8, vision: 8.5, defending: 8.5, stamina: 8.9, tempo: 8.9 } },
  odegaard: { rating: 87, kitNumber: "8", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.midfielder", order: 42, scores: { passing: 8.9, vision: 9.0, defending: 7.0, stamina: 8.8, tempo: 8.8 } },
  raya: { rating: 87, kitNumber: "1", team: "Arsenal", clubId: "arsenal", positionKey: "soccer.keeper", order: 43, scores: { saves: 8.6, reflexes: 8.7, distribution: 8.7, command: 8.4, positioning: 8.5 } },
  brunofernandes: { rating: 87, kitNumber: "8", team: "Manchester United", clubId: "manunited", positionKey: "soccer.midfielder", order: 47, scores: { passing: 9.0, vision: 9.2, defending: 6.7, stamina: 9.5, tempo: 8.8 } },
  marquinhos: { rating: 87, kitNumber: "5", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.centerback", order: 48, scores: { aerial: 8.8, tackling: 8.8, positioning: 9.0, buildup: 8.4, composure: 8.6 } },
  debruyne: { rating: 87, kitNumber: "11", team: "Napoli", clubId: "napoli", positionKey: "soccer.midfielder", order: 49, scores: { passing: 9.2, vision: 9.2, defending: 6.8, stamina: 6.6, tempo: 8.9 } },
  nico: { rating: 86, kitNumber: "10", team: "Athletic Club", positionKey: "soccer.winger", order: 51, scores: { dribbling: 8.8, crossing: 8.3, finishing: 7.9, tracking: 5.8, decision: 8.2 } },
  bruno: { rating: 86, kitNumber: "39", team: "Newcastle United", positionKey: "soccer.midfielder", order: 53, scores: { passing: 8.8, vision: 8.6, defending: 8.2, stamina: 9.0, tempo: 8.6 } },
  olise: { rating: 86, kitNumber: "17", team: "Bayern Munich", clubId: "bayern", positionKey: "soccer.winger", order: 54, scores: { dribbling: 8.8, crossing: 7.9, finishing: 8.3, tracking: 6.5, decision: 8.8 } },
  tonali: { rating: 86, kitNumber: "8", team: "Newcastle United", positionKey: "soccer.midfielder", order: 55, scores: { passing: 8.4, vision: 7.9, defending: 8.4, stamina: 8.3, tempo: 8.4 } },
  dias: { rating: 86, kitNumber: "3", team: "Manchester City", clubId: "mancity", positionKey: "soccer.centerback", order: 57, scores: { aerial: 8.5, tackling: 8.6, positioning: 8.7, buildup: 8.0, composure: 8.5 } },
  konate: { rating: 86, kitNumber: "5", team: "Liverpool", clubId: "liverpool", positionKey: "soccer.centerback", order: 58, scores: { aerial: 8.3, tackling: 8.7, positioning: 8.7, buildup: 7.8, composure: 8.0 } },
  trent: { rating: 86, kitNumber: "12", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.fullback", order: 60, scores: { defending: 8.0, overlap: 8.1, delivery: 9.3, pace: 7.5, focus: 8.2 } },
  calhanoglu: { rating: 86, kitNumber: "20", team: "Inter", clubId: "inter", positionKey: "soccer.midfielder", order: 62, scores: { passing: 8.9, vision: 8.9, defending: 8.3, stamina: 8.1, tempo: 8.7 } },
  rudiger: { rating: 86, kitNumber: "22", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.centerback", order: 63, scores: { aerial: 8.6, tackling: 8.4, positioning: 8.4, buildup: 8.2, composure: 8.0 } },
  terstegen: { rating: 86, kitNumber: "1", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.keeper", order: 64, scores: { saves: 8.4, reflexes: 8.5, distribution: 8.9, command: 8.4, positioning: 8.4 } },
  messi: { rating: 86, kitNumber: "10", team: "Inter Miami", clubId: "miami", positionKey: "soccer.striker", order: 65, scores: { finishing: 8.4, movement: 7.8, linkup: 8.6, pressing: 5.7, composure: 9.2 } },
  jneves: { rating: 85, kitNumber: "87", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.midfielder", order: 66, scores: { passing: 8.6, vision: 8.4, defending: 8.3, stamina: 9.2, tempo: 8.4 } },
  doue: { rating: 85, kitNumber: "14", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.winger", order: 67, scores: { dribbling: 9.1, crossing: 7.4, finishing: 7.8, tracking: 6.6, decision: 7.8 } },
  olmo: { rating: 85, kitNumber: "20", team: "Barcelona", clubId: "barcelona", positionKey: "soccer.midfielder", order: 70, scores: { passing: 8.4, vision: 8.6, defending: 5.3, stamina: 6.5, tempo: 8.7 } },
  rodrygo: { rating: 85, kitNumber: "11", team: "Real Madrid", clubId: "realmadrid", positionKey: "soccer.winger", order: 71, scores: { dribbling: 8.8, crossing: 7.9, finishing: 8.3, tracking: 5.2, decision: 8.4 } },
  mbeumo: { rating: 85, kitNumber: "19", team: "Manchester United", clubId: "manunited", positionKey: "soccer.winger", order: 72, scores: { dribbling: 8.3, crossing: 8.4, finishing: 8.7, tracking: 6.9, decision: 8.0 } },
  foden: { rating: 85, kitNumber: "47", team: "Manchester City", clubId: "mancity", positionKey: "soccer.winger", order: 75, scores: { dribbling: 8.9, crossing: 8.0, finishing: 8.2, tracking: 7.2, decision: 8.3 } },
  thuram: { rating: 85, kitNumber: "9", team: "Inter", clubId: "inter", positionKey: "soccer.striker", order: 80, scores: { finishing: 8.5, movement: 8.6, linkup: 7.9, pressing: 7.9, composure: 7.8 } },
  fabian: { rating: 85, kitNumber: "8", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.midfielder", order: 81, scores: { passing: 8.4, vision: 8.4, defending: 7.9, stamina: 8.4, tempo: 8.6 } },
  ederson: { rating: 85, kitNumber: "31", team: "Fenerbahçe", clubId: "fenerbahce", positionKey: "soccer.keeper", order: 85, scores: { saves: 8.3, reflexes: 8.3, distribution: 9.1, command: 8.2, positioning: 8.3 } },
  son: { rating: 85, kitNumber: "7", team: "Los Angeles FC", positionKey: "soccer.striker", order: 89, scores: { finishing: 8.4, movement: 8.4, linkup: 8.3, pressing: 7.5, composure: 8.6 } },
  griezmann: { rating: 85, kitNumber: "7", team: "Atlético Madrid", clubId: "atletico", positionKey: "soccer.striker", order: 91, scores: { finishing: 8.6, movement: 7.8, linkup: 8.6, pressing: 7.5, composure: 8.8 } },
  ronaldo: { rating: 85, kitNumber: "7", team: "Al Nassr", clubId: "alnassr", positionKey: "soccer.striker", order: 95, scores: { finishing: 8.8, movement: 7.5, linkup: 7.6, pressing: 7.0, composure: 9.1 } },
  barcola: { rating: 84, kitNumber: "29", team: "Paris Saint-Germain", clubId: "psg", positionKey: "soccer.winger", order: 96, scores: { dribbling: 8.6, crossing: 8.1, finishing: 8.0, tracking: 5.4, decision: 7.9 } },
  marmoush: { rating: 84, kitNumber: "7", team: "Manchester City", clubId: "mancity", positionKey: "soccer.striker", order: 100, scores: { finishing: 8.7, movement: 8.8, linkup: 8.2, pressing: 7.4, composure: 8.4 } },
};

export function applyFc26(players: HonorPlayer[]) {
  for (const person of players) {
    if (person.sport !== "soccer" || person.era === "legend") continue;
    const patch = FC26_PATCHES[person.id];
    if (!patch) {
      person.prestige += 1000;
      continue;
    }
    person.fcRating = patch.rating;
    person.kitNumber = patch.kitNumber;
    person.team = patch.team;
    if (patch.clubId) person.clubId = patch.clubId;
    else delete person.clubId;
    person.positionKey = patch.positionKey;
    person.scores = patch.scores;
    person.prestige = patch.order;
  }
}
