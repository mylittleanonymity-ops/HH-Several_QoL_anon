export type SeasonTiers = Array<SeasonTierIncomplete>;

export interface SeasonTierIncomplete {
  tier: string;
  mojo_required: string;
  free_reward_picked: "1" | "";
  pass_reward_picked: "1" | "";
}
