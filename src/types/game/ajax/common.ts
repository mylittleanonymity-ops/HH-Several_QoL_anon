import { BasicRewards, GradeSkins, Shard, allOrbsType } from "..";

export type CommonAjaxResponse = {
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
    redirectUrl?: string; // "/troll-pre-battle.html?id_opponent=7"
    sub_title?: string; // for reward popup
    title: string; // for reward popup
  };
  result: "won";
  success: boolean; // of the request, not the battle itself
};

export interface AjaxShardGirlUpdate extends Shard {
  // despite the name `previous_value` it's not actually the amount of previously
  // owned shards. it is the difference between `value` and the amount of gained
  // shards which only matches up with the previously owned shards if there is no
  // overflow that gets turned into skin shards or flowers.
  previous_value: number;
  // new owned *girl* shard value
  value: number;
}

// soft_currency/ticket entries mirror BasicRewards items of the same type.
export type HeroChangesCurrencyUpdate = {
  currency?: {
    soft_currency?: number; // owned total amount
    ticket?: number; // owned total amount
  };
  soft_currency?: number; // drop amount, matches soft_currency reward entry
};

export type HeroChangesUpdate =
  | ((HeroChangesCurrencyUpdate | {}) &
      (KissEnergyUpdate | {}) &
      (QuestEnergyUpdate | {}) &
      (OrbChangesUpdate | {}) &
      (WorshipEnergyUpdate | {}) &
      (ChallengeEnergyUpdate | {}) &
      (FightEnergyUpdate | {}) &
      (DrillEnergyUpdate | {}))
  | [];

export type KissEnergyUpdate = {
  energy_kiss: number;
  energy_kiss_recharge_time: number;
  ts_kiss: number;
};

export type QuestEnergyUpdate = {
  energy_quest: number;
  energy_quest_recharge_time: number;
  ts_quest: number;
};

export type WorshipEnergyUpdate = {
  energy_worship: number;
  energy_worship_recharge_time: number;
  ts_worship: number;
};

export type ChallengeEnergyUpdate = {
  energy_challenge: number;
  energy_challenge_recharge_time: number;
  ts_challenge: number;
};

export type FightEnergyUpdate = {
  energy_fight: number;
  energy_fight_recharge_time: number;
  ts_fight: number;
};

export type DrillEnergyUpdate = {
  energy_drill: number;
  energy_drill_recharge_time: number;
  ts_drill: number;
};

export type OrbChangesUpdate =
  | Partial<Record<allOrbsType, number>> // owned total amount for each orb type
  | [];
