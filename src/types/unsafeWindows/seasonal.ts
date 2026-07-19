import { CompleteGirl, GirlElement, GirlID, livelySceneItem } from "../game";

export interface UnsafeWindow_seasonal_SEM {
  mega_event_data: {
    id_seasonal_event: number;
    id_member: number;
    potions: number;
    tier: number;
    cards: string; // "", "1"
    last_card_collect_date: string;
    taken_rewards: string;
    has_pass: 0 | 1;
    triggered_reminders: string;
    taken_reward_list: string[];
    available_reward_types: ["free"] | ["free", "pass"];
    lively_scenes: Array<{
      lively_scene: {
        id_lively_scene: number;
        id_girl: number;
        order_num: number;
        name: string;
        is_unlocked: boolean;
        content: {
          image: null | string;
          video: null | string;
          image_censored: string;
          video_censored: string;
        };
        release_date: string;
        index: number;
        potions_required?: number;
      };
      from_tier: boolean;
      from_market: boolean;
    }>;
    lively_scenes_potions_required: Record<number, number>;
  };
  event_functionalities: {
    has_bundles: true;
    has_card: true;
    has_market: false;
    has_pass: true;
    has_percent_ranking: false;
    has_revival_market: true;
    has_top_ranking: false;
    id_seasonal_event_type: 4;
  };
  mega_current_tier: number;
  mega_tiers_data: Array<{
    free_reward: {
      loot: true;
      rewards: Array<any>;
    };
    free_reward_state: "available" | "claimed" | "unclaimed";
    paid_reward: {
      loot: true;
      rewards: Array<any>;
    };
    paid_reward_state: "available" | "claimed" | "unclaimed";
    potions_required: number;
    tier: number;
  }>;
  seconds_remaining: number;
  event_anchors: Array<{
    disabled: boolean; // should always be false
    label: string; // "Defeat Villains"
    url: string; // "/troll-pre-battle.html?id_opponent=14", NO SESSID
  }>;
  player_resources: number;
  hero_has_mega_pass: 0 | 1;
  pass_reminder: any;
  event_girls_all_owned: boolean;
  mega_name: string;
  mega_event_id: number;
  mega_girls: Array<{
    animated_grades: any;
    ava: string;
    element: GirlElement;
    grade_offsets: {
      static: Array<number>;
      animated: Array<number>;
    };
    has_animated_grades: boolean;
    id: GirlID;
  }>;
  girls: Girls_SEM[];
}

interface Girls_SEM {
  id_member: null;
  id_girl: number;
  shards: null;
  level: number;
  fav_graded: null;
  graded: number;
  ts_pay: null;
  affection: null;
  xp: null;
  id_places_of_power: null;
  date_added: null;
  awakening_level: number;
  girl: Girls_SEM_Girl;
  armor: any[];
  salary: number;
  pay_time: number;
  pay_in: number;
  /* caracs: BlessedCaracsPvp4Class;
  blessed_caracs: BlessedCaracsPvp4Class;
  blessed_caracs_pvp4: BlessedCaracsPvp4Class; */
  caracs_sum: number;
  blessed_attributes: string[];
  can_be_blessed: boolean;
  can_be_blessed_pvp4: boolean;
  graded2: string;
  favorite_grade: number;
  salary_per_hour: number;
  ico: string;
  ava: string;
  level_cap: number;
  awakening_costs: number;
  is_owned: boolean;
  /* affection_details: AffectionDetails;
  xp_details: XPDetails;
  skill_tiers_info: { [key: string]: BlessedCaracsElement }; */
  skills: any[];
  skill_trait: string;
  skill_tiers_unlocked: any[];
  /* battle_caracs: BattleCaracs; */
  power_display: number;
  /* lively_scenes: BlessedCaracsElement[]; */
  member_grade_skins: any[];
  grade_skins_stats_bonus: number;
  selected_grade_skin_num: null;
}

interface Girls_SEM_Girl {
  id_girl: number;
  id_girl_ref: number;
  nb_grades: number;
  class: number;
  figure: number;
  carac1: number;
  carac2: number;
  carac3: number;
  rarity: string;
  id_world: number;
  id_quest_get: number;
  name: string;
  release_date: string;
  upgrade_quests: { [key: string]: number };
  hair_color1: string;
  hair_color2: string;
  eye_color1: string;
  eye_color2: string;
  zodiac: string;
  element: string;
  /* animated_grades:     AnimatedGrade[]; */
  anniversary: string;
  grade_offset_values: Array<number[]>;
  preview_scenes: Array<string[]>;
  /* blessing_bonuses:    any[] | { [key: string]: BlessingBonus }; */
  id_role: number;
  /* role_data: RoleData; */
  /* element_data:        ElementData; */
  is_released: boolean;
  /* blessed_caracs:      BlessedCaracs;
    grade_offsets:       GradeOffsets; */
  preview: Girls_SEM_Girl_Preview;
  default_avatar: string;
  grade_skins: any[];
  grade_skins_data: any[];
}

interface Girls_SEM_Girl_Preview {
  poses: string[];
  scenes: string[];
  lively_scenes: Girls_SEM_Girl_Preview_LivelyScene[];
  position_img: string;
}

interface Girls_SEM_Girl_Preview_LivelyScene {
  id_lively_scene: number;
  id_girl: number;
  order_num: number;
  name: string;
  is_unlocked: boolean;
  content: livelySceneItem["display_data"];
  release_date: string;
}
