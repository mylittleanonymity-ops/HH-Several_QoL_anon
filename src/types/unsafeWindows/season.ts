import { GirlPreview } from "../game";

export interface UnsafeWindow_Season {
  seasons_girls: Array<SeasonGirl>;
}

interface SeasonGirl {
  id_girl: number;
  type: string;
  slot_class: boolean;
  rarity: string;
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
  preview: GirlPreview;
  graded: number;
  own: boolean;
  id_role: number;
  /* role_data:       RoleData; */
}
