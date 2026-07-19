import { HeroClass } from "./common";

export type sharedHeroIncomplete = {
  infos: sharedHeroInfos;
  club: sharedHeroClub;
  currencies: sharedHeroCurrencies;
  energies: sharedHeroEnergies;
  update: (type: string, maybeNewValue: number, toDiscover?: any, unknown?: boolean) => void; // HH++ bdsm doesn't allow you to input values for the last one
  updates: (data: any, toDiscover?: boolean) => void; // updates will call update
};

export type sharedHeroInfos = {
  Xp: {
    cur: number;
    left: number;
    level: number;
    max: number;
    min: number;
    next_max: number;
    ratio: number;
  };
  avs_required: boolean;
  carac1: number;
  carac2: number;
  carac3: number;
  caracs: {
    carac1: number;
    carac2: number;
    carac3: number;
    chance: number;
    endurance: number;
    primary_carac_amount: number;
    secondary_caracs_sum: number;
  };
  class: HeroClass;
  club_cooldown_ts: number; // time until can join back a club, can be negative
  harem_endurance: number;
  hc_confirm: boolean;
  hh_skin: "hentai" | (string & {});
  hh_universe: "nutaku" | "hentai" | "test_h" | (string & {});
  id: number;
  is_cheater: 0 | 1;
  is_tester: 0 | 1;
  level: number;
  market_stats_purchase_steps: [1, 10, 30, 60];
  name: string;
  no_pachinko_anim: boolean;
  no_static_image_animation: boolean;
  nosound: boolean;
  on_prod_server: boolean; // always true ?
  pwa_rewards_claimed: [] | any; // unsure of the content
  questing: {
    choices_adventure: number; //0;
    current_url: string; //"/quest/1421?sess=bsfqosa27drvm3fjkj64ji5oue";
    id_quest: number;
    id_world: number;
    num_step: number;
    num_world: number;
    step: number;
  };
  screen_ratio: number;
  server_time: string; //"2025-12-20T19:31:10+01:00";
  xp: number;
};

export type sharedHeroCurrencies = {
  frames: number;
  hard_currency: number;
  laby_coin: number;
  rejuvenation_stone: number;
  scrolls_common: number;
  scrolls_epic: number;
  scrolls_legendary: number;
  scrolls_mythic: number;
  scrolls_rare: number;
  seasonal_event_cash: number;
  soft_currency: number;
  sultry_coins: number;
  ticket: number;
};

export type sharedHeroEnergies = {
  quest: sharedHeroEnergiesType;
  fight: sharedHeroEnergiesType;
  challenge: sharedHeroEnergiesType;
  kiss: sharedHeroEnergiesType;
  worship: sharedHeroEnergiesType;
  reply?: sharedHeroEnergiesType; // replies don't exist on every game
  drill: sharedHeroEnergiesType;
};

export type sharedHeroEnergiesType = {
  amount: number;
  max_amount: number;
  max_regen_amount: number;
  next_refresh_ts: number; // in seconds, when next you'll get an energy
  recharge_time: number; // in seconds until full recharge
  seconds_per_point: number;
  update_ts: number; // not sure
};

export type sharedHeroClub =
  | [] // when not in a club
  | {
      chat_token: string;
      co_leaders: number[];
      created_at: string;
      created_by: number;
      ico: ""; // Never has been implemented ?
      id_club: number;
      is_co_leader: boolean;
      is_leader: boolean;
      leader_id: string; // contains the ID as string
      leader_name: string;
      level: string;
      level_restriction: number | any;
      max_members: number;
      member_count: number;
      name: string;
      place: number; // place on the leaderboard
      status: "request_only" | "open" | "closed";
      total_contribution_points: number;
      total_upgrades: number;
    };
