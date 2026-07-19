import { CompleteGirl, GirlArmorItemEquipped, GirlPreview, GirlSourceList } from "../game";

export interface UnsafeWindow_love_raids {
  love_raids: love_raids_type[];
  mega_raids_bonus_percentage: number; // 100
}
export type love_raids_type = LoveRaidsOngoing | LoveRaidsUpcoming;

interface LoveRaidsOngoing extends LoveRaidsBase {
  status: "ongoing";
  seconds_until_event_end: number;
}

interface LoveRaidsUpcoming extends LoveRaidsBase {
  status: "upcoming";
  seconds_until_event_start: number;
}

interface LoveRaidsBase {
  all_is_owned: boolean;
  announcement_type_name: "partial" | "full" | "none";
  background_id: number;
  end_datetime: string; // "2025-10-24 05:00:00"
  event_duration_seconds: number;
  event_name: string; // "Mysterious Love Raid" smh
  girl_data: Girl_Data_Mysterious | Girl_Data_Full; // TODO ?
  id_announcement_type: 1 | 2 | 3;
  id_girl: number;
  id_raid: number;
  is_mega_raid: boolean;
  raid_module_pk: number; // it's to know which troll / champ it's for
  raid_module_type: "season" | "troll" | "champion";
  start_datetime: string; // "2025-10-23 07:00:00"
  tranche_data: TrancheData;
}

interface TrancheData {
  id_raid_tranche: number;
  id_raid: number;
  tranche_num: number;
  total_shards: number;
  shards_left: number;
  start_datetime: Date;
  end_datetime: Date;
  seconds_until_tranche_end?: number;
}

interface Girl_Data_Mysterious {
  name: string; // "Mysterious girl"; always Mysterious girl in english, but in other languages it can be different
  ico: string; //"https://hh.hh-content.com/pictures/gallery/70/1200x-black/748211386-4751ddd3d7939ea32e0c19474ba2acbe.png"; // Always includes -black
  source: {
    name: "love_raid";
    group: {
      name: "love_raid";
      id: null; // always null as when it's ongoing you have girl info
    };
    ongoing: false;
    sentence: string; //"Rescue me from <i>Harriet</i> any tier!";
    anchor_source: {
      url: string; //"/troll-pre-battle.html?id_opponent=18";
      label: string; //"Go to Harriet";
      disabled: true;
    };
    playable: true;
    anchor_win_from: [
      {
        url: string; //"/troll-pre-battle.html?id_opponent=18";
        label: string; //"Go to Harriet";
        disabled: true;
      },
    ];
  };
  source_list: null;
  grade_skins: null[]; //[null, null, null]; What's funny here is that it tells us how many skins the girl has
  grade_offsets: {
    static: number[]; //[361, 326, 1359, 825];
    animated: number[]; // [208, 326, 1359, 825];
  };
  shards: number; //100;
}

type Girl_Data_Full = {
  source: GirlSourceList;
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
  element: string;
  id_role: number;
  name: string;
  release_date: string;
  anniversary: string;
  eye_color1: string;
  eye_color2: string;
  hair_color1: string;
  hair_color2: string;
  upgrade_quests: { [key: string]: number };
  scene_paths: { [key: string]: string };
  animated_grades: any;
  grade_offset_values: any;
  images: {
    ava: Array<string>;
    ico: Array<string>;
  };
  zodiac: string;
  blessing_bonuses: any;
  default_avatar: string;
  grade_skins: number[];
  level: number;
  graded: number;
  awakening_level: number;
  xp: number;
  ico: string;
  avatar: string;
  black_avatar: string;
  grade_offsets: any;
  Graded: string;
  graded2: string;
  style: string;
  element_data: CompleteGirl["element_data"];
  salary: number;
  salary_timer: number;
  pay_time: number;
  pay_in: number;
  salary_per_hour: number;
  position_img: string;
  preview: GirlPreview;
  can_be_blessed: boolean;
  can_be_blessed_pvp4: boolean;
  blessed_attributes: string[];
  caracs: {
    carac1: number; // 5.5
    carac2: number; // 3.5
    carac3: number; // 2.5
  };
  caracs_sum: number;
  orgasm: number;
  shards: number;
  role_data: any;
  own: boolean;
  source_list?: CompleteGirl["source_list"];
  id_member?: number;
  fav_graded?: number;
  ts_pay?: number;
  affection?: number;
  id_places_of_power?: number | null;
  date_added?: string;
  armor?: GirlArmorItemEquipped[];
};
