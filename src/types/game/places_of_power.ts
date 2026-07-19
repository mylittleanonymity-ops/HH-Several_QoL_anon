import { GirlID, HeroClass } from ".";

export interface global_pop_hero_girls_incomplete {
  id_girl: GirlID;
  carac1: number;
  carac2: number;
  carac3: number;
  id_places_of_power: number | null;
  avatar: string;
}

export interface PoPGirlData {
  assigned: number | -1;
  avatar: string;
  carac_1: number;
  carac_2: number;
  carac_3: number;
  carac_1_initial: number;
  carac_2_initial: number;
  carac_3_initial: number;
  id_girl: GirlID;
  name: string;
  rarity: string;
}

export interface PlacesOfPowerReward {
  loot: boolean;
  name?: string;
  rewards: Array<any>; // Maybe to do unsure if I actually will do it
}

export interface PlacesOfPowerData {
  base_power: number;
  class: HeroClass;
  criteria: "carac_1" | "carac_2" | "carac_3";
  description: string;
  duration: number | null;
  ends_in: number | null;
  girl?: any; // TODO ?
  girls: Array<PoPGirlData>;
  id_girl: GirlID;
  id_places_of_power: number;
  id_world: number;
  image: string;
  level: number;
  level_power: number;
  levelup_cost: number;
  locked: 1 | undefined;
  max_level: number;
  max_power: number | null;
  max_team_power: number;
  min_level: number | null;
  multiplier: string;
  next_level_power: number;
  next_max_team_power: number;
  num_world: number;
  remaining_time: number;
  rewards: Record<number, PlacesOfPowerReward>;
  skin: string | "hentai,gay";
  status: "can_start" | "in_progress" | "pending_reward" | "locked";
  time_to_finish: number; // 0 when PoP can be started
  title: string;
  type: "standard" | "temp";
  end_ts?: number; // Added by Several QoL
}
