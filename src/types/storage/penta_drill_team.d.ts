export type StoredPentaDrillTeam = {
  teams: Record<number, [number, number, number, number, number, number, number]>;
  name: string;
};

export type PentaDrillStoredTeams = Array<StoredPentaDrillTeam>;
