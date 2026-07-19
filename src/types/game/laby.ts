export type labyLeaderboardXHRResponse = {
  feature: "labyrinth_leaderboard";
  hero_data: null | {
    avatar: string;
    completed_cycles: number;
    id_member: number;
    is_hero: true;
    level: number;
    nickname: string;
    rank: number;
    stones_used: number;
    tired_girls: number;
  };
  leaderboard: Array<{
    avatar: string;
    completed_cycles: number;
    id_member: number;
    is_hero: false;
    level: number;
    nickname: string;
    rank: number;
    stones_used: number;
    tired_girls: number;
  }>;
  success: true;
};
