import {
  GradeSkins,
  Shard,
  BasicRewards,
  ObjectivePoints,
  HeroChangesUpdate,
  AjaxShardGirlUpdate,
} from "..";

export interface DoBattlesTrollsResponse {
  battle_result: "hero_won" | "opponent_won";
  hero_changes: {
    currency?: {
      // if paying for x10/x50
      hard_currency: number;
    };
    energy_fight: number;
    energy_fight_recharge_time: number;
    ts_fight: number;
  };
  objective_points?: ObjectivePoints;
  result: "won"; // even when losing
  rewards?: {
    data: {
      has_lively_scene?: true; // when there's a video
      girls?: AjaxShardGirlUpdate[]; // if girl is obtained
      grade_skins?: GradeSkins; // if a skin is obtained
      loot: true; // true indicating showing actual rewards
      rewards?: BasicRewards;
      shards?: AjaxShardGirlUpdate[]; // if shards are obtained
    };
    // Present when rewards include soft_currency or ticket entries in BasicRewards.
    heroChangesUpdate: HeroChangesUpdate;
    lose: boolean;
    redirectUrl: string; // "/troll-pre-battle.html?id_opponent=7"
    sub_title?: string; // for reward popup
    title: string; // for reward popup
  };
  success: boolean; // of the request, not the battle itself
  rounds: any;
}
