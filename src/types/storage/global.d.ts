export type BadgeEntry = string | { id: string; until?: number; name?: string };

export interface BadgeDataCache {
  data: {
    [universe: string]: {
      [badgeType: string]: BadgeEntry[];
    };
  };
  nextRefreshAt: number;
}
