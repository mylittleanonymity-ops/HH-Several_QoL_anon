import { GirlRarity } from "../girls";

export interface SeasonalMarket_AjaxResponse {
  inventory: Inventory[];
  time_to_restock: number;
  currency: number;
  additional_information: any[];
  success: boolean;
}

interface Inventory {
  loot: boolean;
  shards?: Girl[];
  slot_index: number;
  is_accessible_slot: boolean;
  market_price: number;
  girls?: Girl[]; // This is when you have 100 shards of the girl
  /* surplus_item?:      SurplusItem; */
  /* rewards?: Reward[]; */ // other than girl shards
  has_lively_scene?: boolean;
}

interface Girl {
  id_girl: number;
  type: "girl_shards";
  slot_class: boolean;
  rarity: GirlRarity;
  ico: string;
  avatar: string;
  default_avatar: string;
  black_avatar: string;
  name: string;
  girl_class: number;
  /* caracs:          Caracs; */
  graded2: string;
  level: number;
  /* element_data:    ElementData; */
  salary_per_hour: number;
  value: number;
  /* grade_offsets:   GradeOffsets;
    animated_grades: AnimatedGrade[]; */
  role: number;
  is_girl_owned: boolean;
  previous_value: number;
}
