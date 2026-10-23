export type RootStackParamList = {
  Tabs: { screen?: "Home" | "Boards" | "Zones" | "Profile" } | undefined;
  Rankings: { sport: string };
  Player: { sport: string; id: string };
  Team: { sport: string; id: string };
  Event: { slug: string };
  Rate: { slug: string; athleteId: string };
  Matchup: { slug: string };
  Search: { q?: string };
  Zone: { id: string };
  ZoneCreate: undefined;
  ZoneItem: { zoneId: string; itemId: string };
  Login: undefined;
  Onboarding: undefined;
  Vip: undefined;
  MyTeams: undefined;
  Guide: undefined;
  Feed: undefined;
  Privacy: undefined;
};

export type TabParamList = {
  Home: undefined;
  Boards: undefined;
  Zones: undefined;
  Profile: undefined;
};
