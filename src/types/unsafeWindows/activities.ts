import { CompleteGirl, global_pop_hero_girls_incomplete, PlacesOfPowerData, Rarity } from "../game";

export interface UnsafeWindow_Activities {
  player_missions: (PlayerMissionNotQueued | PlayerMissionPending)[];
  pop_data: Record<number, PlacesOfPowerData>;
  pop_hero_girls: Record<number, Omit<CompleteGirl, "preview">>;
  hh_prices_auto_start: number;
  hh_prices_auto_claim: number;
}

export interface PlayerMissionNotQueued {
  id_member_mission: number;
  id_mission: number;
  id_member: number;
  creation: string;
  mission_end: string;
  mission_state: "not_started" | "pending"; // pending when the mission is the one queued
  duration: number;
  rarity: Rarity;
  cost: number;
  win: string;
  mission: Mission;
  state: "not_started" | "claim_reward"; // "claim_reward" when finished
  remaining_time: number | null;
  remaining_cost: number;
  rewards: {
    loot: false;
    rewards: any[];
  };
}

export interface PlayerMissionPending {
  id_member_mission: number;
  id_mission: number;
  id_member: number;
  creation: string;
  mission_end: string;
  mission_state: "pending"; // pending when the mission is the one queued
  duration: number;
  rarity: Rarity;
  cost: number;
  win: string;
  mission: Mission;
  state: "pending"; // "claim_reward" when finished
  remaining_time: number;
  remaining_cost: number;
  rewards: {
    loot: false;
    rewards: any[];
  };
}

export interface Mission {
  id_mission: number;
  id_mission_group: null;
  event_day: number;
  skin: string;
  title_raw: string;
  description_raw: string;
  events: any[];
  image: string;
  title: string;
  description: string;
  event_shortname: null;
}
