import { TODO } from "../base";
import { GirlMinimalData } from "./girls";

export type penta_drill_data = {
  cycle_data: cycle_data_pd;
  girl_data: GirlMinimalData;
  max_real_tiers: number;
  pass_reminder: any; // should never be useful
  path_rewards: Array<path_rewards_pd>; // { [pathId: string]: string[] /* item IDs */
  progression: progression_penta_drill;
};

export type cycle_data_pd = {
  event_end: string; //"2025-12-29 13:00:00";
  event_start: string; //"2025-12-10 13:00:00";
  id_penta_drill: number; //1;
  is_current: boolean; //true; no reason to be false ?
  seconds_until_event_end: number; //1382195;
};

export type path_rewards_pd = {
  free_rewards: any;
  free_reward_state: "claimed" | "unclaimed" | "available";
  pass_rewards: any;
  pass_reward_state: "locked" | "claimed" | "unclaimed" | "available";
  passplus_reward_state: "locked";
  passplus_rewards: [];
  potions_required: number;
  tier: number;
};

export type progression_penta_drill = {
  girls_taken_rewards: null | any;
  has_pass: 0 | 1;
  id_member: number;
  id_penta_drill: number;
  points: number; // difference is unknown
  potions: number; // difference is unknown
  taken_rewards: null | string; // "free_1,pass_1"
  tier: number;
  triggered_reminders: null | any; // should never be useful anyway
};

export type penta_drill_team_data = {
  girls: TODO;
  girls_ids: [number, number, number, number, number, number, number];
  id_member: number;
  id_team: number;
  max_team_size: 7;
  min_team_size: 7;
  power_display: number;
  slot_index: number;
  synergies: any;
  theme: null;
  theme_elements: [];
  total_power: number;
};

export type penta_drill_all_teams = [
  penta_drill_team_data,
  penta_drill_team_data,
  penta_drill_team_data,
  penta_drill_team_data,
  penta_drill_team_data,
];
