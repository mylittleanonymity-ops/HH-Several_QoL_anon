export type StoredPlayerLeagueRank = {
  league: number;
  rank: number;
};
export type StoredPlayerSeasonInfo = {
  previousTierThreshold: number;
  nextTierThreshold: number | undefined;
  mojo: number;
  name: string | undefined;
  tier: number;
  endsAt: number | undefined;
};

export type StoredPlayerPentaDrillInfo = {
  previousTierThreshold: number;
  nextTierThreshold: number | undefined;
  potions: number;
  tier: number;
  endsAt: number | undefined;
};
