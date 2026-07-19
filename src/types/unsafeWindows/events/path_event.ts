import { CompleteGirl } from "../..";
import { BaseUnsafeWindow } from "../baseUnsafeWindow";

export interface UnsafeWindow_PathEvent extends BaseUnsafeWindow {
  time_remaining: number;
  current_event: {
    can_participate: boolean;
    event_data: {
      available_reward_types: Array<string>;
      current_progression: number;
      current_step: number;
      current_tier: PathEventTierCurrent;
      id_member: number;
      id_path_event: number;
      pass_reminder: null;
      path_of_attraction: {
        event_end: string;
        event_start: string;
        id_path_event: number;
        is_current: boolean;
        name: string;
        skin: string;
        tiers: Array<PathEventTier>;
      };
      taken_reward_list: Array<any>;
      taken_rewards: null | any;
      tier: number;
      triggered_reminders: null | any;
      unlocked: null | any;
    };
    event_duration_seconds: number;
    event_name: string;
    girls: Array<CompleteGirl>;
    identifier: string;
    participation_info: string;
    progression_href: string;
    seconds_until_event_end: number;
    type: "path_event";
  };
  event_data: {
    available_reward_types: Array<string>;
    current_progression: number;
    current_step: number;
    current_tier: PathEventTierCurrent;
    id_member: number;
    id_path_event: number;
    pass_reminder: any;
    path_of_attraction: UnsafeWindow_PathEvent["current_event"]["event_data"]["path_of_attraction"];
    taken_reward_list: Array<any>;
    taken_rewards: null | any;
    tier: number;
    triggered_reminders: null | any;
    unlocked: null | any;
  };
  extra_rewards_claimed: boolean;
  id_event: number;
  pass_reminder: any;
  event_unlocked_price: number;
  next_tier: number;
  event_ends_in: number;
  event_tiers: Array<PathEventTier>;
  event_girls: Array<CompleteGirl>;
  bonus_rewards_unlocked: boolean;
  current_progression: number;
}

export interface PathEventTierCurrent {
  id_path_event_step: number;
  id_path_event: number;
  num_step: number;
  id_objective: number;
  goal_objective: number;
  tier: string;
  objective: {
    id_objective: number;
    identifier: string;
    contest_points: number | null;
    legendary_contest_points: number | null;
    path_event_points: number | null;
    path_of_valor_points: number | null;
    path_of_glory_points: number | null;
    cumback_contest_points: number | null;
    crazy_cumback_contest_points: number | null;
    daily_goals_points: number | null;
    seasonal_event_1_points: number | null;
    seasonal_event_2_points: number | null;
    seasonal_event_3_points: number | null;
    seasonal_event_4_points: number | null;
    double_penetration_points: number | null;
    name: string;
    anchors: Array<{
      url: string;
      label: string;
      disabled: boolean;
    }>;
  };
  objective_target: number;
  anchor_win_from: Array<{
    url: string;
    label: string;
    disabled: boolean;
  }>;
}

export interface PathEventTier extends PathEventTierCurrent {
  rewards: {
    free: {
      reward: {
        loot: boolean;
        rewards?: Array<any>;
        girls?: Array<any>;
        shards?: Array<any>;
        surplus_item?: any;
      };
      claimed: boolean;
    };
    locked: {
      reward: {
        loot: boolean;
        rewards?: Array<any>;
        girls?: Array<any>;
        shards?: Array<any>;
        surplus_item?: any;
      };
      claimed: boolean;
    };
  };
}
