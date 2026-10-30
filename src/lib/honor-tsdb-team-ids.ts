/** TheSportsDB idTeam for honor-board clubs when name search is ambiguous. */
export const honorTsdbTeamId: Record<string, string> = {
  psg: "133714",
  realmadrid: "133738",
  barcelona: "133739",
  bayern: "133664",
  mancity: "133613",
  liverpool: "133602",
  manunited: "133612",
  arsenal: "133604",
  chelsea: "133610",
  juventus: "133676",
  milan: "133667",
  inter: "133681",
  atletico: "133727",
  dortmund: "133669",
  napoli: "133670",
  ajax: "133652",
  porto: "134114",
  benfica: "134108",
};

export function honorTsdbId(honorClubId: string): string | undefined {
  return honorTsdbTeamId[honorClubId];
}

function foldTeamName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
}

/** Names that TheSportsDB search mixes up with another club. */
const NAME_TO_TSDB_ID: Record<string, string> = {
  parissaintgermain: "133714",
  parisstgermain: "133714",
  parissg: "133714",
  psg: "133714",
  巴黎圣日耳曼: "133714",
};

/** Canonical TSDB id when the display name is a known club. */
export function tsdbIdForTeamName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return NAME_TO_TSDB_ID[foldTeamName(name)];
}
