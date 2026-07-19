import { Rarity, GirlID, HeroClass, GirlArmorItemEquipped } from ".";

export type GirlRarity = Rarity | "starting";

export interface PlainSkin {
  ico_path: string;
  is_owned: boolean;
}

export type PlainSkins = Array<PlainSkin>;

export type GirlElement =
  | "nature"
  | "sun"
  | "psychic"
  | "darkness"
  | "water"
  | "stone"
  | "light"
  | "fire";

export interface GradeSkinPreview {
  animation_format: "video" | "spine" | [];
  girl_grade_num: number;
  grade_skin_name: string;
  ico_path: string;
  id_girl: GirlID;
  id_girl_grade_skin: number;
  image_path: string;
  is_owned: boolean;
  is_released: boolean; // unlikely that this is ever false on prod
  num_order: number;
  offset_values: {
    animated: Array<number>;
    static: Array<number>;
  };
  shards_count: number;
  previous_skin_shards: number;
  rarity: GirlRarity;
  release_date: string; // "2025-10-08"
  shards_added: number;
  type: string; // "base", "medium" ?
}

export type GradeSkins = Array<GradeSkinPreview>;

export interface GirlMinimalData {
  ico: string;
  id_girl: GirlID;
  rarity: GirlRarity;
}

export interface PlainGirl extends GirlMinimalData {
  is_girl_owned?: true;
  grade_skins?: PlainSkins;
}

export type PlainGirls = Array<PlainGirl>;

export interface Shard {
  animated_grades: Array<any> | [];
  avatar: string; //'https://hh.hh-content.com/pictures/girls/10/ava0.png?v=3';
  black_avatar: string; //'https://hh.hh-content.com/pictures/girls/10/avb0.png?v=3';
  caracs: {
    carac1: number; // or float e.g 3.5
    carac2: number;
    carac3: number;
  };
  default_avatar: string; //'https://hh.hh-content.com/pictures/girls/10/ava0.png?v=3';
  element_data: {
    type: string; //'water';
    weakness: string; //'sun';
    domination: string; //'fire';
    domination_ego_bonus_percent: number; //10;
    domination_damage_bonus_percent: number; //10;
    domination_critical_chance_bonus_percent: number; //20;
    ico_url: string; //'https://hh.hh-content.com/pictures/girls_elements/Sensual.png';
    flavor: string; //'Sensual';
  };
  girl_class: HeroClass;
  grade_offsets: {
    static: Array<number>; // [238, 282, 150, 280];
    animated: Array<number>; //  [238, 282, 150, 280];
  };
  graded2: string; //'<g class="grey"></g><g class="grey"></g><g class="grey"></g>';
  ico: string; //'https://hh.hh-content.com/pictures/girls/10/ico0.png?v=3';
  id_girl: GirlID;
  is_girl_owned: boolean;
  level: 1; // always 1 even if you own the girl and have leveled her up already
  name: string; //'Arcana';
  rarity: GirlRarity;
  role: number | null; // 10;
  salary_per_hour: number;
  slot_class: false;
  type: "girl_shards";
}

// Should separate those owned / in edit waifu page and those that are in events and not owned, will need to monitor it also
export type CompleteGirl = {
  Graded: string; // "☆☆☆"
  affection?: number;
  animated_grades: any;
  anniversary: string; // "2025-10-08"
  armor?: Array<GirlArmorItemEquipped>;
  avatar: string;
  awakening_level: number; // 0
  black_avatar: string;
  blessed_attributes: Array<string>;
  blessing_bonuses: any;
  can_be_blessed: boolean;
  can_be_blessed_pvp4: boolean;
  carac1: number; // 5.5
  carac2: number; // 3.5
  carac3: number; // 2.5
  caracs: {
    carac1: number; // 5.5
    carac2: number; // 3.5
    carac3: number; // 2.5
  };
  caracs_sum: number;
  class: HeroClass;
  date_added?: string; // "2025-10-08"
  default_avatar: string;
  element: GirlElement;
  element_data: {
    type: GirlElement;
    weakness: GirlElement;
    domination: GirlElement;
    domination_ego_bonus_percent: 10;
    domination_damage_bonus_percent: 10;
    domination_critical_chance_bonus_percent: 20;
    ico_url: string; //"https://hh.hh-content.com/pictures/girls_elements/Voyeurs.png";
    flavor: string; //"Voyeur";
  };
  eye_color1: string; // "00F"
  eye_color2: string; // ""
  fav_graded?: number;
  figure: number; // 1
  grade_offset_values: any;
  grade_offsets: any;
  grade_skins: Array<number>; //  [171, 170, 154] , related to id_girl_grade_skin
  graded: number; // 0
  graded2: string; // '<g class="grey"></g><g class="grey"></g><g class="grey"></g>';
  hair_color1: string; // "F00"
  hair_color2: string; // ""
  ico: string;
  id_girl: GirlID;
  id_girl_ref: number; // no idea
  id_member: number;
  id_places_of_power: null | number;
  id_quest_get: number; // no idea
  id_role: number; // 1 , laby role ?
  id_world: number; // 51 ???
  images: {
    ava: Array<string>;
    ico: Array<string>;
  };
  level: number; // 1
  name: string;
  nb_grades: number; // 3
  orgasm: number; // 280 ???, is it the ego ?
  own?: boolean;
  pay_in: number;
  pay_time: number;
  position_img: string; //"1.png", "12.png"
  preview: GirlPreview;
  rarity: GirlRarity;
  release_date: string; // "2025-10-08"
  role_data: any;
  salary: number;
  salary_per_hour: number;
  salary_timer: number;
  scenes_paths: {
    [key: number]: string; // 1:"1004687-4a80a968d9724490de5134ee46410c67"
  };
  shards: number;
  source?: GirlSourceList;
  source_list?: {
    [key: string]: Array<GirlSourceList> | undefined;
    event_dm?: Array<GirlSourceList>;
    event_troll?: Array<GirlSourceList>;
    pachinko_event?: Array<GirlSourceList>;
    event_champion_girl?: Array<GirlSourceList>;
    harem?: Array<GirlSourceList>; // when you have the girl
  };
  style: string; // "Fluffer", "Candaulist", "Smut"
  ts_pay?: number;
  upgrade_quests: {
    [key: number]: number; // 1: 1004687, 2: 1004688, 3: 1004689
  };
  xp: number;
  zodiac: string; //"♌︎ Leo";
};

export type GirlPreview = {
  grade_skins_data: Array<GradeSkinPreview>;
  lively_scenes: Array<{
    content: {
      image: null | string; // string when it's dropped
      image_censored: string;
      video: null | string; // string when it's dropped
      video_censored: string;
    };
    id_girl: GirlID;
    id_lively_scene: number;
    is_unlocked: boolean;
    name: string; // "A" ????
    order_num: number; // 0 : No idea
    release_date: string; // "2025-10-08"
  }>;
  poses: Array<string>;
  scenes: Array<string>; // either blurred with full path, or relative when unlocked WITHOUT sess
};

export type GirlSourceList = {
  anchor_source: {
    disabled: boolean; // should always be false ?
    label: string; // "Go to grunt", "Go to Missions" etc
    url: string; // url WITHOUT sess
  };
  anchor_win_from: Array<{
    disabled: boolean; // should always be false ?
    label: string;
    url: string; // url WITHOUT sess
  }>;
  group: {
    id: number;
    name: string; // "event" | "mythic_event" // type of source it came from
  };
  name: string; // "event_dm"
  ongoing: boolean;
  playable: boolean; // if ongoing should always be true ?
  sentence: string; // "Compelte daily missions etc"
};
