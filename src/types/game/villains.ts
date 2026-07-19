import {
  battleLostItem,
  gemsItem,
  itemDropItem,
  progressionItem,
  softCurrencyItem,
  ticketItem,
  orbsItem,
  bulbItem,
  HeroClass,
  GirlID,
  GirlRarity,
  ObjectivePoints,
  OpponentFighter,
  Rarity,
  GradeSkins,
  PlainGirls,
  EventsList,
  livelySceneItem,
  energyKissItem,
  energyQuestsItem,
  Shard,
} from "../";

export interface PreFightShard extends Shard {
  // very weird value
  // "1" for mythic ?, "6" for legendary ?, "100" for rare ? No idea what it's
  // for maybe biggest possible drop ?
  value: string;
}

export type PreFightShards = Array<PreFightShard>;

export type BasicReward =
  | softCurrencyItem
  | gemsItem
  | ticketItem
  | itemDropItem
  | battleLostItem
  | orbsItem
  | progressionItem
  | bulbItem
  | livelySceneItem
  | energyKissItem
  | energyQuestsItem;

export type BasicRewards = Array<BasicReward>;

export interface VillainPreBattle extends OpponentFighter {
  rewards: {
    data: {
      has_lively_scene?: true; // when there's a video
      loot: false; // false indicating showing potential rewards
      rewards: BasicRewards;
      shards?: PreFightShards;
    };
    girls_plain: PlainGirls | [];
    item_data: null | Array<itemDropItem>;
    items_plain: [] | Array<{ rarity: Rarity; ico: string }>;
  };
}
