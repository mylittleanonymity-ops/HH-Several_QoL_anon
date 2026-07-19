import { CompleteGirl } from "../game";

export interface UnsafeWindow_pentaDrill {
  penta_drill_data: {
    cycle_data: {
      id_penta_drill: 6;
      event_start: string; //"2026-02-23 13:00:00";
      event_end: string; // "2026-03-09 13:00:00";
      seconds_until_event_end: number;
      is_current: true; // should always be true
    };
    girl_data: CompleteGirl;
    max_real_tiers: number; //57
    pass_reminder: any;
    path_rewards: Array<{
      free_reward: {
        loot: true;
        rewards: Array<any>;
      };
      free_reward_state: "available" | "claimed" | "unclaimed";
      pass_reward: {
        loot: true;
        rewards: Array<any>;
      };
      pass_reward_state: "available" | "claimed" | "unclaimed";
      passplus_reward_state: "locked"; // prolly unintended
      passplus_rewards: Array<any>; // [] ?
      potions_required: number;
      tier: number;
    }>;
    progression: {
      girls_taken_rewards: string; // wtf is that
      has_pass: 0 | 1;
      id_member: number;
      id_penta_drill: number;
      points: number;
      potions: number; // same as points ?
      taken_rewards: string; // "free_2,pass_2,free_4,pass_4,free_10..."
      tier: number;
      triggered_reminders: string; // "21784,21799"
    };
  };
}
